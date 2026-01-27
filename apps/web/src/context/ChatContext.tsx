"use client";

import { get, set } from 'idb-keyval';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Conversation, Message } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { transformConversationToHydratedConversation, ConversationWithHydration } from "@/lib/transform";
import type { Database } from "@/types/database.types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ChatStore {
    conversations: Conversation[];
    messages: Message[];
}

const StoreKeyPrefix = 'chat-store-';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  startConversation: (bidId: string, itemId: string, bidderId: string, sellerId: string) => Promise<string | undefined>;
  loadMessages: (conversationId: string) => Promise<void>;
  subscribeToConversation: (conversationId: string) => Promise<void>;
  unsubscribeFromConversation: (conversationId: string) => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<Conversation | undefined>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const loadedConversationsRef = useRef<Set<string>>(new Set());

  // Ref for accessing latest conversations in callbacks without re-subscribing
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

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


  const transformMessage = useCallback((row: MessageRow): Message => ({
    id: row.id,
    conversationId: row.conversation_id || "",
    senderId: row.sender_id || "",
    content: row.content,
    isRead: row.is_read ?? false,
    createdAt: row.created_at || new Date().toISOString(),
  }), []);

  const fetchHydratedConversation = useCallback(async (conversationId: string) => {
    // 1. Try fully hydrated fetch
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listings:listing_id(*, profiles:profiles!listings_seller_id_fkey(*)),
        seller_profile:seller_id(*),
        bidder_profile:bidder_id(*)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
        console.error("[fetchHydratedConversation] Complex fetch error:", error);
    }

    if (!data) {
        // 2. Debug: Check if raw conversation exists (Diagnose RLS vs Missing Join Data)
        const { data: rawData, error: rawError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();
            
        console.log("[fetchHydratedConversation] Fallback check:", {
            id: conversationId,
            rawFound: !!rawData,
            rawError,
            details: rawData
        });
        
        return undefined;
    }
    
    return transformConversationToHydratedConversation(data as unknown as ConversationWithHydration);
  }, []);

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          listings:listing_id(*, profiles:profiles!listings_seller_id_fkey(*)),
          seller_profile:seller_id(*),
          bidder_profile:bidder_id(*)
        `)
        // .or(`seller_id.eq.${user.id},bidder_id.eq.${user.id}`) // Rely on RLS for security & simplicity
        .order('updated_at', { ascending: false });

      if (data) {
        setConversations(data.map(conv => transformConversationToHydratedConversation(conv as unknown as ConversationWithHydration)));
      }
  }, [user]);

  // Subscription cleanup/reset
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setConversations([]), 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    loadedConversationsRef.current.clear();
  }, [user?.id]);

  // Initial Fetch Effect
  useEffect(() => {
    if (user) {
      // Wrap in async function to satisfy linter (avoid sync setState warning)
      const load = async () => {
        await fetchConversations();
      };
      load();
    }
  }, [user, fetchConversations]);

  // Realtime Subscription Effect
  useEffect(() => {
    if (!user) return;

    const handleConvUpdate = async (payload: RealtimePostgresChangesPayload<ConversationRow>) => {
        const convRow = payload.new;
        if (!convRow || !('id' in convRow)) return;

        const transformed = await fetchHydratedConversation(convRow.id);
        if (!transformed) return;

        if (payload.eventType === 'INSERT') {
            setConversations(prev => {
                if (prev.some(c => c.id === transformed.id)) return prev;
                return [transformed, ...prev];
            });
        } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => prev.map(c => c.id === transformed.id ? transformed : c));
        }
    };

    // Realtime Updates
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` }, 
        handleConvUpdate
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `bidder_id=eq.${user.id}` }, 
        handleConvUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchHydratedConversation]);

  // 2. Realtime Messages Listener (Global for participating chats)
  // Ref for accessing latest conversations in callback without re-subscribing
  // (Handled by conversationsRef above)

  // 2. Focused Realtime Subscription (Lazy Loading)
  const activeSubscriptions = React.useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());

  const subscribeToConversation = useCallback(async (conversationId: string) => {
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
        (payload: RealtimePostgresChangesPayload<MessageRow>) => {
           const newMsg = payload.new;
           if (!newMsg || !('id' in newMsg)) return;
           const transformed = transformMessage(newMsg as MessageRow);
           
           setMessages(prev => {
                if (prev.some(m => m.id === transformed.id)) return prev;
                return [...prev, transformed];
           });

           // Update Conversation Last Message (Global List)
            setConversations(prev => prev.map(c => 
              c.id === (newMsg.conversation_id || "")
                ? { ...c, lastMessage: newMsg.content, updatedAt: newMsg.created_at || c.updatedAt }
                : c
            ));
        }
      )
      .subscribe();

    activeSubscriptions.current.set(conversationId, channel);
  }, [transformMessage]);

  const unsubscribeFromConversation = useCallback(async (conversationId: string) => {
      const channel = activeSubscriptions.current.get(conversationId);
      if (channel) {
          await supabase.removeChannel(channel);
          activeSubscriptions.current.delete(conversationId);
      }
  }, []);

  // Cleanup all on unmount
  useEffect(() => {
      const subscriptions = activeSubscriptions.current;
      return () => {
          subscriptions.forEach(channel => supabase.removeChannel(channel));
          subscriptions.clear();
      };
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
      if (loadedConversationsRef.current.has(conversationId)) return;
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (data) {
          const newMsgs = data.map(transformMessage);
          setMessages(prev => {
              const ids = new Set(prev.map(m => m.id));
              const uniqueNew = newMsgs.filter((m) => !ids.has(m.id));
              
              // Only keep messages for current active chats to save memory? 
              // For now, simple append is inherently risky for memory if app open long time, 
              // but solves the immediate requirement.
              return [...prev, ...uniqueNew];
          });
          loadedConversationsRef.current.add(conversationId);
      }
  }, [transformMessage]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user) return; 
    
    if (!user.emailVerified || !user.profileComplete) {
      window.location.href = `/complete-profile?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimMsg: Message = {
        id: tempId, conversationId, senderId: user.id, content, isRead: false, createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimMsg]);

    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_content: content
    });

    if (error) {
        console.error("Failed to send message", error);
        setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback
        return;
    }

    if (data) {
        const realMsg = transformMessage(data);
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
    }
  }, [user, transformMessage]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Local Optimistic Update
    setMessages(prev => prev.map(m => 
      m.conversationId === conversationId && m.senderId !== user.id && !m.isRead 
        ? { ...m, isRead: true } 
        : m
    ));

    // DB Update
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('is_read', false); 

    if (error) {
      console.error("Failed to mark messages as read", error);
    }
  }, [user]);

  const startConversation = useCallback(async (_bidId: string, itemId: string, bidderId: string, _sellerId: string) => {
    // 1. Check local cache
    const existing = conversationsRef.current.find(c => c.itemId === itemId && c.bidderId === bidderId);
    if (existing) return existing.id;

    const { data, error } = await supabase.rpc('ensure_conversation', {
      p_listing_id: itemId,
      p_bidder_id: bidderId
    });

    if (data) {
        const conversationId = Array.isArray(data) ? data[0] : data;
        const hydrated = await fetchHydratedConversation(conversationId as string);
        if (hydrated) {
          setConversations(prev => prev.some(c => c.id === hydrated.id) ? prev : [hydrated, ...prev]);
        }
        return conversationId as string;
    }

    if (error) {
        console.error("Failed to start conversation", error);
    }
    return undefined;
  }, [fetchHydratedConversation]);

  const contextValue = useMemo(() => ({
    conversations,
    messages,
    sendMessage,
    markAsRead,
    startConversation,
    loadMessages,
    subscribeToConversation,
    unsubscribeFromConversation,
    fetchConversation: fetchHydratedConversation,
    refreshConversations: fetchConversations
  }), [
    conversations,
    messages,
    sendMessage,
    markAsRead,
    startConversation,
    loadMessages,
    subscribeToConversation,
    unsubscribeFromConversation,
    fetchHydratedConversation,
    fetchConversations
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
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
