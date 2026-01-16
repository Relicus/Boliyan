"use client";

import React, { createContext, useContext, useState } from "react";
import { Conversation, Message } from "@/types";
import { mockConversations, mockMessages, mockUsers } from "@/lib/mock-data";
import { useAuth } from "./AuthContext";
import { useMarketplace } from "./MarketplaceContext"; // We might need item data later, but for now we keep it loose

interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, content: string) => void;
  startConversation: (bidId: string, itemId: string, bidderId: string, sellerId: string) => string | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const sendMessage = (conversationId: string, content: string) => {
    // SECURITY/LOGIC CHECK 
    const conv = conversations.find(c => c.id === conversationId);
    if (conv?.expiresAt) {
      if (new Date(conv.expiresAt).getTime() < Date.now()) {
        console.warn("Attempted to send message to an expired conversation");
        return;
      }
    }

    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      senderId: user.id,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Update conversation lastMessage
    setConversations(prev => prev.map(c => 
      c.id === conversationId 
        ? { ...c, lastMessage: content, updatedAt: new Date().toISOString() } 
        : c
    ));
  };

  const startConversation = (bidId: string, itemId: string, bidderId: string, sellerId: string) => {
    // Check if conversation already exists
    const existingConv = conversations.find(c => 
      c.itemId === itemId && 
      ((c.sellerId === sellerId && c.bidderId === bidderId) || 
       (c.bidderId === sellerId && c.sellerId === bidderId)) // Swap check just in case
    );

    if (existingConv) return existingConv.id;

    // Create conversation (unlocks chat)
    const newConvId = `conv-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const newConversation: Conversation = {
      id: newConvId,
      itemId: itemId,
      sellerId: sellerId,
      bidderId: bidderId,
      lastMessage: '',
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    setConversations(prev => [newConversation, ...prev]);
    return newConvId;
  };

  return (
    <ChatContext.Provider value={{ conversations, messages, sendMessage, startConversation }}>
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
