"use client";

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ChatWindow } from '@/components/inbox/ChatWindow';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { useSearchParams } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, ShoppingBag, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';

function InboxContent() {
  const { conversations, user } = useApp();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'offers' | 'bids' | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const countBadgeBase = "ml-2 inline-flex min-w-5 h-4 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold backdrop-blur-md bg-white/70 border border-white/70 shadow-[0_4px_10px_rgba(15,23,42,0.12)]";

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const isSearching = debouncedQuery.length > 0;

  const searchIndex = useMemo(() => {
    if (!isSearching) return new Map<string, string>();

    const index = new Map<string, string>();

    conversations.forEach(conversation => {
      const otherUser = !user
        ? (conversation.seller || conversation.bidder)
        : (conversation.sellerId === user.id ? conversation.bidder : conversation.seller);

      const item = conversation.item;
      const text = [
        otherUser?.name,
        item?.title,
        conversation.lastMessage
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      index.set(conversation.id, text);
    });

    return index;
  }, [conversations, isSearching, user]);

  const filteredAllConversations = useMemo(() => {
    if (!isSearching) return conversations;

    return conversations.filter(conversation =>
      searchIndex.get(conversation.id)?.includes(debouncedQuery)
    );
  }, [conversations, debouncedQuery, isSearching, searchIndex]);

  const offerConversations = useMemo(() => {
    if (!user) return [];
    return conversations.filter(c => c.sellerId === user.id);
  }, [conversations, user]);

  const bidConversations = useMemo(() => {
    if (!user) return [];
    return conversations.filter(c => c.bidderId === user.id);
  }, [conversations, user]);

  const selectedIdParam = searchParams.get('id');
  const resolvedSelectedId = selectedId === undefined ? selectedIdParam : selectedId;
  const derivedTab = useMemo(() => {
    if (!selectedIdParam) return undefined;

    if (offerConversations.some(c => c.id === selectedIdParam)) {
      return 'offers';
    }
    if (bidConversations.some(c => c.id === selectedIdParam)) {
      return 'bids';
    }
    return 'all';
  }, [bidConversations, offerConversations, selectedIdParam]);

  const resolvedTab = isSearching ? 'all' : activeTab ?? derivedTab ?? 'all';
  const displayedAllConversations = isSearching ? filteredAllConversations : conversations;
  const displayedOfferConversations = isSearching ? filteredAllConversations : offerConversations;
  const displayedBidConversations = isSearching ? filteredAllConversations : bidConversations;
  useEffect(() => {
    if (!selectedIdParam) return;
    if (resolvedSelectedId === selectedIdParam) return;
    if (conversations.some(c => c.id === selectedIdParam)) {
      const timer = setTimeout(() => setSelectedId(selectedIdParam), 0);
      return () => clearTimeout(timer);
    }
  }, [conversations, resolvedSelectedId, selectedIdParam]);
  const handleTabChange = (value: string) => {
    if (value === 'all' || value === 'offers' || value === 'bids') {
      setActiveTab(value);
    }
  };

  return (
    <div id="inbox-container" className="flex flex-1 bg-muted/20 w-full h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)]">
      {/* Sidebar / List - Hidden on mobile if chat is open */}
      <div 
        id="inbox-sidebar"
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] border-r bg-background flex flex-col shrink-0",
          resolvedSelectedId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b shrink-0">
          <h1 className="sr-only">Messages</h1>
          <div id="inbox-search" className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="inbox-search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search people, listings, or notes"
              className="h-10 pl-9 rounded-xl bg-white border-slate-200 focus-visible:ring-blue-100"
            />
          </div>
          <Tabs value={resolvedTab} onValueChange={handleTabChange} className="w-full">
            <TabsList id="inbox-tabs-list" className="grid w-full grid-cols-3 h-10 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger 
                id="inbox-all-tab"
                value="all" 
                className="rounded-lg text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                All
                {displayedAllConversations.length > 0 && (
                  <span className={`${countBadgeBase} text-slate-700`}>
                    {displayedAllConversations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                id="inbox-offers-tab"
                value="offers" 
                className="rounded-lg text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <Store className="mr-2 h-3.5 w-3.5" />
                Selling
                {displayedOfferConversations.length > 0 && (
                  <span className={`${countBadgeBase} text-indigo-700`}>
                    {displayedOfferConversations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                id="inbox-bids-tab"
                value="bids" 
                className="rounded-lg text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <ShoppingBag className="mr-2 h-3.5 w-3.5" />
                Buying
                {displayedBidConversations.length > 0 && (
                  <span className={`${countBadgeBase} text-blue-700`}>
                    {displayedBidConversations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={resolvedTab} className="flex-1 overflow-hidden">
          <TabsContent value="all" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={displayedAllConversations}
              selectedId={resolvedSelectedId} 
              onSelect={setSelectedId} 
              role="auto"
              emptyTitle={isSearching ? "No matches" : undefined}
              emptyBody={isSearching ? "Try another name, listing, or note." : undefined}
            />
          </TabsContent>

          <TabsContent value="offers" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={displayedOfferConversations}
              selectedId={resolvedSelectedId} 
              onSelect={setSelectedId} 
              role="seller"
              emptyTitle={isSearching ? "No matches" : undefined}
              emptyBody={isSearching ? "Try another name, listing, or note." : undefined}
            />
          </TabsContent>
          
          <TabsContent value="bids" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={displayedBidConversations}
              selectedId={resolvedSelectedId} 
              onSelect={setSelectedId} 
              role="buyer"
              emptyTitle={isSearching ? "No matches" : undefined}
              emptyBody={isSearching ? "Try another name, listing, or note." : undefined}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Window - Full width on mobile when selected */}
      <div 
        id="chat-window-container"
        className={cn(
          "flex-1 flex flex-col bg-background min-w-0",
          !resolvedSelectedId ? "hidden md:flex" : "flex"
        )}
      >
        {resolvedSelectedId ? (
          <ChatWindow 
            conversationId={resolvedSelectedId} 
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4 p-8 text-center bg-slate-50/50">
            <div className="h-20 w-20 bg-white border border-slate-100 shadow-sm rounded-3xl flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Sell Fast. Buy Fair.</h2>
              <p className="max-w-xs text-sm text-slate-500 font-medium">Choose a chat from the left to arrange pick-up and complete the deal.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading inbox...</div>}>
      <InboxContent />
    </Suspense>
  );
}
