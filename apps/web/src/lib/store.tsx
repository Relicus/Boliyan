"use client";

import React, { createContext, useContext, useState } from 'react';
import { Item, Bid, User, Conversation, Message } from '@/types';
import { mockItems, mockBids, mockUsers, mockConversations, mockMessages } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

interface AppContextType {
  user: User; // Current logged in user
  items: Item[];
  bids: Bid[];
  conversations: Conversation[];
  messages: Message[];
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => void;
  updateItem: (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => void;
  deleteItem: (id: string) => void;
  placeBid: (itemId: string, amount: number, type: 'public' | 'private') => void;
  toggleWatch: (itemId: string) => void;
  watchedItemIds: string[];
  sendMessage: (conversationId: string, content: string) => void;
  rejectBid: (bidId: string) => void;
  acceptBid: (bidId: string) => string | undefined;
  getUser: (id: string) => User | undefined;
  filters: {
    category: string | null;
    search: string;
    radius: number;
    locationMode: 'current' | 'city' | 'country';
    city: string;
    currentCoords: { lat: number; lng: number } | null;
    sortBy: 'trending' | 'nearest' | 'ending_soon' | 'luxury' | 'newest' | 'watchlist';
    minPrice: number | null;
    maxPrice: number | null;
    listingType: 'all' | 'public' | 'sealed';
  };
  setFilter: (key: keyof AppContextType['filters'], value: any) => void;
  updateFilters: (updates: Partial<AppContextType['filters']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initialize with mock data
  const [items, setItems] = useState<Item[]>(mockItems);
  const [bids, setBids] = useState<Bid[]>(mockBids);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [watchedItemIds, setWatchedItemIds] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Logged in by default for now

  /* 
    TODO: REAL SUPABASE FETCHING PATTERN
    useEffect(() => {
      const fetchData = async () => {
        const { data: listings } = await supabase.from('listings').select('*');
        if (listings) setItems(listings as Item[]);
        // ... and so on for bids, conversations, etc.
      };
      fetchData();
    }, []);
  */
  
  // Current user is hardcoded as 'u1' (Ahmed Ali) for now
  const user = mockUsers[0];

  const [filters, setFilters] = useState<AppContextType['filters']>({
    category: null,
    search: "",
    radius: 500, // Default to max radius (whole country)
    locationMode: 'country', // Default to whole country
    city: 'Karachi',
    currentCoords: null,
    sortBy: 'trending',
    minPrice: null,
    maxPrice: null,
    listingType: 'all',
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
  const updateItem = (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    // Also clean up bids associated with this item
    setBids(prev => prev.filter(bid => bid.itemId !== id));
  };

  const placeBid = (itemId: string, amount: number, type: 'public' | 'private') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Safety check: Don't allow bids lower than 70% of ask price
    const minBidAllowed = item.askPrice * 0.7;
    if (amount < minBidAllowed) {
      console.warn(`Attempted to place a bid (${amount}) lower than 70% of ask price (${minBidAllowed})`);
      return;
    }

    // Safety check: Don't allow bids lower than current high bid for public listings
    if (type === 'public' && item.currentHighBid && amount < item.currentHighBid) {
      console.warn("Attempted to place a bid lower than the current high bid");
      return;
    }

    // Safety check: Don't allow bidding on own item
    if (item.sellerId === user.id) {
      console.warn("Attempted to bid on own item");
      return;
    }

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
          currentHighBid: item.currentHighBid ? Math.max(item.currentHighBid, amount) : amount,
          currentHighBidderId: (!item.currentHighBid || amount > item.currentHighBid) ? user.id : item.currentHighBidderId
        };
      }
      return item;
    }));

    // Auto-watch when bidding
    setWatchedItemIds(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
  };

  const toggleWatch = (itemId: string) => {
    setWatchedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const sendMessage = (conversationId: string, content: string) => {
    // SECURITY/LOGIC CHECK: 
    // In a real app, this function would verify that 'conversationId' refers to a VALID conversation
    // linked to an ACCEPTED bid. The UI enforces this by only showing conversations that exist.
    
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

  const getUser = (id: string) => {
    return mockUsers.find(u => u.id === id);
  };

  const setFilter = (key: keyof AppContextType['filters'], value: any) => {
    console.log(`[STORE] setFilter: ${key} =`, value);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateFilters = (updates: Partial<AppContextType['filters']>) => {
    console.log(`[STORE] updateFilters:`, updates);
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const rejectBid = (bidId: string) => {
    setBids(prev => prev.map(b => 
      b.id === bidId ? { ...b, status: 'rejected' as const } : b
    ));
  };

  const acceptBid = (bidId: string) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return undefined;
    
    // Update bid status to accepted
    setBids(prev => prev.map(b => 
      b.id === bidId ? { ...b, status: 'accepted' as const } : b
    ));
    
    // Check if conversation already exists
    const existingConv = conversations.find(c => 
      c.itemId === bid.itemId && 
      ((c.sellerId === user.id && c.bidderId === bid.bidderId) || 
       (c.bidderId === user.id && c.sellerId === bid.bidderId))
    );

    if (existingConv) return existingConv.id;

    // Get the item to find the seller
    const item = items.find(i => i.id === bid.itemId);
    if (!item) return undefined;
    
    // Create conversation (unlocks chat)
    const newConvId = `conv-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const newConversation: Conversation = {
      id: newConvId,
      itemId: bid.itemId,
      sellerId: item.sellerId,
      bidderId: bid.bidderId,
      lastMessage: '',
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    setConversations(prev => [newConversation, ...prev]);
    return newConvId;
  };

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  return (
    <AppContext.Provider value={{ user, items, bids, conversations, messages, isLoggedIn, login, logout, addItem, updateItem, deleteItem, placeBid, toggleWatch, watchedItemIds, sendMessage, rejectBid, acceptBid, getUser, filters, setFilter, updateFilters }}>
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
