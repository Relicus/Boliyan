"use client";

import { get, set } from 'idb-keyval';
import React, { createContext, useContext, useState, useEffect } from "react";
import { Conversation, Message } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { transformConversationToHydratedConversation, ConversationWithHydration } from "@/lib/transform";

interface ChatStore {
    conversations: Conversation[];
    messages: Message[];
}

const StoreKeyPrefix = 'chat-store-';

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversation: (bidId: string, itemId: string, bidderId: string, sellerId: string) => Promise<string | undefined>;
  loadMessages: (conversationId: string) => Promise<void>;
  subscribeToConversation: (conversationId: string) => Promise<void>;
  unsubscribeFromConversation: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 0. Offline Storage: LOAD
  useEffect(() => {
    if (!user?.id) return;
    
    const loadCache = async () => {
        try {
            const cached = await get<ChatStore>(StoreKeyPrefix + user.id);
            if (cached) {
                // Determine if cache is fresher or valid to show before sync
                if (cached.conversations?.length > 0) {
                    setConversations(cached.conversations);
                }
                if (cached.messages?.length > 0) {
                    setMessages(cached.messages);
                }
            }
        } catch (err) {
            console.error("Failed to load chat cache", err);
        }
    };
    loadCache();
  }, [user?.id]);

  // 0. Offline Storage: SAVE
  useEffect(() => {
    if (!user?.id) return;
    
    // Debounce or just save async? Async is fine for IDB.
    if (conversations.length > 0 || messages.length > 0) {
        set(StoreKeyPrefix + user.id, { conversations, messages } as ChatStore)
            .catch(err => console.error("Failed to save chat cache", err));
    }
  }, [conversations, messages, user?.id]);


  const transformMessage = (row: any): Message => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  });

  // 1. Fetch Conversations & Realtime logic (remains mostly same, but essentially "merges" fresh data)
  useEffect(() => {
    if (!user) {
  // ...
      const timer = setTimeout(() => setConversations([]), 0);
      return () => clearTimeout(timer);
    }

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listings:listing_id(*, profiles(*)),
          seller_profile:seller_id(*),
          bidder_profile:bidder_id(*)
        `)
        .or(`seller_id.eq.${user.id},bidder_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        setConversations(data.map(conv => transformConversationToHydratedConversation(conv as unknown as ConversationWithHydration)));
      }
    };

    fetchConversations();

    // Realtime Updates
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` }, 
        (payload) => handleConvUpdate(payload)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `bidder_id=eq.${user.id}` }, 
        (payload) => handleConvUpdate(payload)
      )
      .subscribe();

    const handleConvUpdate = async (payload: any) => {
        const convRow = payload.new;
        
        // Fetch hydration data
        const { data } = await supabase
          .from('conversations')
          .select(`
            *,
            listings:listing_id(*, profiles(*)),
            seller_profile:seller_id(*),
            bidder_profile:bidder_id(*)
          `)
          .eq('id', convRow.id)
          .single();

        if (!data) return;

        const transformed = transformConversationToHydratedConversation(data as unknown as ConversationWithHydration);

        if (payload.eventType === 'INSERT') {
            setConversations(prev => [transformed, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => prev.map(c => c.id === transformed.id ? transformed : c));
        }
    };

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 2. Realtime Messages Listener (Global for participating chats)
  // Ref for accessing latest conversations in callback without re-subscribing
  const conversationsRef = React.useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // 2. Focused Realtime Subscription (Lazy Loading)
  const activeSubscriptions = React.useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());

  const subscribeToConversation = async (conversationId: string) => {
    if (activeSubscriptions.current.has(conversationId)) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}` // SCALABILITY WIN: Only listen to this chat
        },
        (payload) => {
           const newMsg = payload.new as any;
           const transformed = transformMessage(newMsg);
           
           setMessages(prev => {
                if (prev.some(m => m.id === transformed.id)) return prev;
                return [...prev, transformed];
           });

           // Update Conversation Last Message (Global List)
           setConversations(prev => prev.map(c => 
             c.id === newMsg.conversation_id 
               ? { ...c, lastMessage: newMsg.content, updatedAt: newMsg.created_at }
               : c
           ));
        }
      )
      .subscribe();

    activeSubscriptions.current.set(conversationId, channel);
  };

  const unsubscribeFromConversation = async (conversationId: string) => {
      const channel = activeSubscriptions.current.get(conversationId);
      if (channel) {
          await supabase.removeChannel(channel);
          activeSubscriptions.current.delete(conversationId);
      }
  };

  // Cleanup all on unmount
  useEffect(() => {
      return () => {
          activeSubscriptions.current.forEach(channel => supabase.removeChannel(channel));
          activeSubscriptions.current.clear();
      };
  }, []);

  const loadMessages = async (conversationId: string) => {
      const { data } = await (supabase.from('messages') as any).select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (data) {
          const newMsgs = data.map(transformMessage);
          setMessages(prev => {
              const ids = new Set(prev.map(m => m.id));
              const uniqueNew = newMsgs.filter((m: any) => !ids.has(m.id));
              
              // Only keep messages for current active chats to save memory? 
              // For now, simple append is inherently risky for memory if app open long time, 
              // but solves the immediate requirement.
              return [...prev, ...uniqueNew];
          });
      }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return; 
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimMsg: Message = {
        id: tempId, conversationId, senderId: user.id, content, isRead: false, createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimMsg]);

    // DB Insert (Messages)
    const { data, error } = await (supabase.from('messages') as any).insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content
    } as any).select().single() as any;

    if (error) {
        console.error("Failed to send message", error);
        setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback
        return;
    }

    if (data) {
        const realMsg = transformMessage(data);
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
        
        // Explicit conversation update
        await (supabase.from('conversations') as any).update({ 
            last_message: content, 
            updated_at: new Date().toISOString() 
        } as any).eq('id', conversationId);

        // SEND NOTIFICATION TO RECIPIENT
        // Find conversation to get recipient ID
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            const recipientId = conversation.sellerId === user.id ? conversation.bidderId : conversation.sellerId;
            
            // Should strictly check if recipientId exists, but schema guarantees it
            if (recipientId) {
                await (supabase.from('notifications') as any).insert({
                    user_id: recipientId,
                    type: 'new_message',
                    title: `New message from ${user.name}`,
                    body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                    link: `/inbox?id=${conversationId}`,
                    is_read: false,
                    metadata: { conversationId }
                });
            }
        }
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    // Local Optimistic Update
    setMessages(prev => prev.map(m => 
      m.conversationId === conversationId && m.senderId !== user.id && !m.isRead 
        ? { ...m, isRead: true } 
        : m
    ));

    // DB Update
    const { error } = await (supabase.from('messages') as any)
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('is_read', false); 

    if (error) {
      console.error("Failed to mark messages as read", error);
    }
  };

  const startConversation = async (bidId: string, itemId: string, bidderId: string, sellerId: string) => {
    // 1. Check local cache
    const existing = conversations.find(c => c.itemId === itemId && c.bidderId === bidderId);
    if (existing) return existing.id;

    // 2. Insert new conversation
    const { data, error } = await (supabase.from('conversations') as any).insert({
        listing_id: itemId,
        seller_id: sellerId,
        bidder_id: bidderId,
        last_message: "Chat started",
        updated_at: new Date().toISOString()
    } as any).select().single() as any;

    if (data) {
        return data.id;
    } else if (error?.code === '23505') { // Unique constraint violation (race condition)
        const { data: exist } = await (supabase.from('conversations') as any).select('*').eq('listing_id', itemId).eq('bidder_id', bidderId).single() as any;
        if (exist) return exist.id;
    }
    return undefined;
  };

  return (
    <ChatContext.Provider value={{ conversations, messages, sendMessage, markAsRead, startConversation, loadMessages, subscribeToConversation, unsubscribeFromConversation }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
