"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Item, Bid, User, Conversation, Message } from '@/types';
import { mockItems, mockBids, mockUsers, mockConversations, mockMessages } from '@/lib/mock-data';


interface AppContextType {
  user: User; // Current logged in user
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  // Deprecated: items is now the "visible page list", not all items
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
  // Master list of all items (persisted across filter changes)
  const [allItems, setAllItems] = useState<Item[]>(mockItems);
  // Visible items (filtered & paginated)
  const [items, setItems] = useState<Item[]>([]);
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
  // Current user is hardcoded as 'u1' (Ahmed Ali) for now
  const user = mockUsers[0];

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 8;

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

  // --- MOCK BACKEND SIMULATION HELPERS ---
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // --- FETCH DATA (Simulating SQL Query) ---
  const applyFiltersAndSort = () => {
     let result = allItems.filter(item => {
      // 1. Category Filter
      if (filters.category && filters.category !== "All Items" && item.category !== filters.category) return false;
      
      // 2. Search Filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!item.title.toLowerCase().includes(query) && !item.description.toLowerCase().includes(query)) return false;
      }

      // 3. Price Filter
      const currentPrice = item.currentHighBid || item.askPrice;
      if (filters.minPrice !== null && currentPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && currentPrice > filters.maxPrice) return false;

      // 4. Listing Type Filter
      if (filters.listingType === 'public' && !item.isPublicBid) return false;
      if (filters.listingType === 'sealed' && item.isPublicBid) return false;

      // 5. Watchlist Filter
      if (filters.sortBy === 'watchlist') {
         if (!watchedItemIds.includes(item.id)) return false;
      }

      // 6. Location Filter
      if (filters.locationMode !== 'country' && filters.radius < 500) {
        const seller = mockUsers.find(u => u.id === item.sellerId);
        if (seller?.location && filters.currentCoords) {
          const dist = getDistance(
            filters.currentCoords.lat,
            filters.currentCoords.lng,
            seller.location.lat,
            seller.location.lng
          );
          if (dist > filters.radius) return false;
        }
      }
      return true;
    });

    // Sort
    result = result.sort((a, b) => {
      const sellerA = mockUsers.find(u => u.id === a.sellerId);
      const sellerB = mockUsers.find(u => u.id === b.sellerId);

      switch (filters.sortBy) {
          case 'nearest': {
            if (!filters.currentCoords || !sellerA?.location || !sellerB?.location) return 0;
            const distA = getDistance(filters.currentCoords.lat, filters.currentCoords.lng, sellerA.location.lat, sellerA.location.lng);
            const distB = getDistance(filters.currentCoords.lat, filters.currentCoords.lng, sellerB.location.lat, sellerB.location.lng);
            return distA - distB;
          }
          case 'ending_soon': return new Date(a.expiryAt).getTime() - new Date(b.expiryAt).getTime();
          case 'luxury': return b.askPrice - a.askPrice;
          case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'watchlist': {
             // Priority 1: High Bidder
             const aIsHigh = a.currentHighBidderId === user.id;
             const bIsHigh = b.currentHighBidderId === user.id;
             if (aIsHigh && !bIsHigh) return -1;
             if (!aIsHigh && bIsHigh) return 1;

             // Priority 2: Has Bid
             const aHasBid = bids.some(bid => bid.itemId === a.id && bid.bidderId === user.id);
             const bHasBid = bids.some(bid => bid.itemId === b.id && bid.bidderId === user.id);
             if (aHasBid && !bHasBid) return -1;
             if (!aHasBid && bHasBid) return 1;

             return b.bidCount - a.bidCount;
          }
          case 'trending':
          default: return b.bidCount - a.bidCount;
      }
    });

    return result;
  };

  // Effect: Refetch when filters change (Reset to Page 1)
  useEffect(() => {
    const fetchFirstPage = async () => {
      setIsLoading(true);
      setPage(1); // Reset page
      setHasMore(true);

      // SIMULATE NETWORK DELAY (Remove this when switching to Real DB)
      await new Promise(resolve => setTimeout(resolve, 600));

      const filtered = applyFiltersAndSort();
      const firstPage = filtered.slice(0, ITEMS_PER_PAGE);
      
      setItems(firstPage);
      setHasMore(firstPage.length < filtered.length);
      setIsLoading(false);
    };

    fetchFirstPage();
  }, [
    // Re-run when any filter dependency changes
    filters.category, filters.search, filters.sortBy, filters.minPrice, filters.maxPrice, 
    filters.listingType, filters.locationMode, filters.radius,
    // Also re-run if bids/watch status changes (for sorting) - in real app, this might be separate
    // bids, watchedItemIds <-- REMOVED to prevent full page reload/reset on interaction
  ]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    // SIMULATE NETWORK DELAY
    await new Promise(resolve => setTimeout(resolve, 800));

    const filtered = applyFiltersAndSort(); // In real DB, we wouldn't re-query everything, we'd use cursor/offset
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const nextPage = filtered.slice(start, end);

    if (nextPage.length > 0) {
      setItems(prev => [...prev, ...nextPage]);
      setPage(prev => prev + 1);
      setHasMore(end < filtered.length);
    } else {
      setHasMore(false);
    }

    setIsLoadingMore(false);
  };

  const addItem = (newItem: Omit<Item, 'id' | 'createdAt' | 'bidCount'>) => {
    const item: Item = {
      ...newItem,
      id: `i${Date.now()}`,
      bidCount: 0,
      createdAt: new Date().toISOString(),
    };
    setAllItems(prev => [item, ...prev]);
    setItems(prev => [item, ...prev]);
  };
  const updateItem = (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'bidCount'>>) => {
    const updater = (prevItems: Item[]) => prevItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setAllItems(updater);
    setItems(updater);
  };

  const deleteItem = (id: string) => {
    const filterer = (prevItems: Item[]) => prevItems.filter(item => item.id !== id);
    setAllItems(filterer);
    setItems(filterer);
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

    // Update item stats (IN BOTH master list AND current view)
    const updateStats = (prevItems: Item[]) => prevItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          bidCount: item.bidCount + 1,
          currentHighBid: item.currentHighBid ? Math.max(item.currentHighBid, amount) : amount,
          currentHighBidderId: (!item.currentHighBid || amount > item.currentHighBid) ? user.id : item.currentHighBidderId
        };
      }
      return item;
    });

    setAllItems(updateStats);
    setItems(updateStats);

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
    <AppContext.Provider value={{ user, items, bids, conversations, messages, isLoggedIn, login, logout, addItem, updateItem, deleteItem, placeBid, toggleWatch, watchedItemIds, sendMessage, rejectBid, acceptBid, getUser, filters, setFilter, updateFilters, isLoading, isLoadingMore, hasMore, loadMore }}>
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
