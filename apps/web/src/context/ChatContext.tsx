"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Conversation, Message } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { transformConversationToHydratedConversation, ConversationWithHydration } from "@/lib/transform";

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversation: (bidId: string, itemId: string, bidderId: string, sellerId: string) => Promise<string | undefined>;
  loadMessages: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);


  const transformMessage = (row: any): Message => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  });

  // 1. Fetch Conversations & Realtime
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
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
  }, [user?.id]);

  // 2. Realtime Messages Listener (Global for participating chats)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload) => {
           const newMsg = payload.new as any;
           const relevant = conversations.some(c => c.id === newMsg.conversation_id);
           if (!relevant) return;

           const transformed = transformMessage(newMsg);
           
           if (payload.eventType === 'INSERT') {
               setMessages(prev => { 
                    // Only append if we don't have it (dedup)
                    if (prev.some(m => m.id === transformed.id)) return prev;
                    return [...prev, transformed];
               });

               // Update Conversation Last Message
               setConversations(prev => prev.map(c => 
                 c.id === newMsg.conversation_id 
                   ? { ...c, lastMessage: newMsg.content, updatedAt: newMsg.created_at }
                   : c
               ));
           } else if (payload.eventType === 'UPDATE') {
               setMessages(prev => prev.map(m => m.id === transformed.id ? transformed : m));
           }
        }
      )
      .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [user?.id, conversations]); 

  const loadMessages = async (conversationId: string) => {
      const { data } = await (supabase.from('messages') as any).select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (data) {
          const newMsgs = data.map(transformMessage);
          setMessages(prev => {
              const ids = new Set(prev.map(m => m.id));
              return [...prev, ...newMsgs.filter((m: any) => !ids.has(m.id))];
          });
      }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return; // Allow optimistic fail check?
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimMsg: Message = {
        id: tempId, conversationId, senderId: user.id, content, isRead: false, createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimMsg]);

    // DB Insert
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
        
        // Explicit conversation update (trigger backup)
        await (supabase.from('conversations') as any).update({ 
            last_message: content, 
            updated_at: new Date().toISOString() 
        } as any).eq('id', conversationId);
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
      .is('is_read', false); // Optimization: only update unread ones

    if (error) {
      console.error("Failed to mark messages as read", error);
      // Revert not strictly necessary as eventual consistency handles it, 
      // but ideally we would refetch or revert if critical.
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
    <ChatContext.Provider value={{ conversations, messages, sendMessage, markAsRead, startConversation, loadMessages }}>
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
