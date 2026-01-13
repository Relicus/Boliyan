"use client";

import React, { createContext, useContext, useState } from 'react';
import { Item, Bid, User, Conversation, Message } from '@/types';
import { mockItems, mockBids, mockUsers, mockConversations, mockMessages } from '@/lib/mock-data';

interface AppContextType {
  user: User; // Current logged in user
  items: Item[];
  bids: Bid[];
  conversations: Conversation[];
  messages: Message[];
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => void;
  placeBid: (itemId: string, amount: number, type: 'public' | 'private') => void;
  sendMessage: (conversationId: string, content: string) => void;
  getUser: (id: string) => User | undefined;
  filters: {
    category: string | null;
    search: string;
    radius: number;
    sortBy: 'trending' | 'nearest' | 'ending_soon' | 'luxury' | 'newest';
  };
  setFilter: (key: keyof AppContextType['filters'], value: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialize with mock data
  const [items, setItems] = useState<Item[]>(mockItems);
  const [bids, setBids] = useState<Bid[]>(mockBids);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  
  // Current user is hardcoded as 'u1' (Ahmed Ali) for now
  const user = mockUsers[0];

  const [filters, setFilters] = useState<{
    category: string | null;
    search: string;
    radius: number;
    sortBy: 'trending' | 'nearest' | 'ending_soon' | 'luxury' | 'newest';
  }>({
    category: null,
    search: "",
    radius: 15,
    sortBy: 'trending',
  });

  const addItem = (newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
    const item: Item = {
      ...newItem,
      id: `i${Date.now()}`,
      bidCount: 0,
      createdAt: new Date().toISOString(),
    };
    setItems(prev => [item, ...prev]);
  };

  const placeBid = (itemId: string, amount: number, type: 'public' | 'private') => {
    const newBid: Bid = {
      id: `b${Date.now()}`,
      itemId,
      bidderId: user.id, // In a real app, this would be the current session user
      amount,
      status: 'pending',
      type,
      createdAt: new Date().toISOString(),
    };

    setBids(prev => [...prev, newBid]);

    // Update item stats
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          bidCount: item.bidCount + 1,
          currentHighBid: item.currentHighBid ? Math.max(item.currentHighBid, amount) : amount
        };
      }
      return item;
    }));
  };

  const sendMessage = (conversationId: string, content: string) => {
    // SECURITY/LOGIC CHECK: 
    // In a real app, this function would verify that 'conversationId' refers to a VALID conversation
    // linked to an ACCEPTED bid. The UI enforces this by only showing conversations that exist.
    // We do NOT allow "creating" a conversation here; it must already exist (created by bid acceptance).
    
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

  const getUser = (id: string) => {
    return mockUsers.find(u => u.id === id);
  };

  const setFilter = (key: keyof AppContextType['filters'], value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppContext.Provider value={{ user, items, bids, conversations, messages, addItem, placeBid, sendMessage, getUser, filters, setFilter }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
