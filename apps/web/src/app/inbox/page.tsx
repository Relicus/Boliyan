"use client";

import React, { useState, useMemo, Suspense } from 'react';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ChatWindow } from '@/components/inbox/ChatWindow';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { useSearchParams } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ShoppingBag, Store } from 'lucide-react';

function InboxContent() {
  const { conversations, user } = useApp();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'offers' | 'bids' | undefined>(undefined);

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
  const resolvedTab = activeTab ?? derivedTab ?? 'all';
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
          <h1 className="font-black text-xl mb-4 text-slate-900">Messages</h1>
          <Tabs value={resolvedTab} onValueChange={handleTabChange} className="w-full">
            <TabsList id="inbox-tabs-list" className="grid w-full grid-cols-3 h-10 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger 
                id="inbox-all-tab"
                value="all" 
                className="rounded-lg text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
              >
                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                All
                {conversations.length > 0 && (
                  <span className="ml-2 bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">
                    {conversations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                id="inbox-offers-tab"
                value="offers" 
                className="rounded-lg text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <Store className="mr-2 h-3.5 w-3.5" />
                Offers
                {offerConversations.length > 0 && (
                  <span className="ml-2 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px]">
                    {offerConversations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                id="inbox-bids-tab"
                value="bids" 
                className="rounded-lg text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <ShoppingBag className="mr-2 h-3.5 w-3.5" />
                Bids
                {bidConversations.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md text-[10px]">
                    {bidConversations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={resolvedTab} className="flex-1 overflow-hidden">
          <TabsContent value="all" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={conversations}
              selectedId={resolvedSelectedId} 
              onSelect={setSelectedId} 
              role="auto"
            />
          </TabsContent>

          <TabsContent value="offers" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={offerConversations}
              selectedId={resolvedSelectedId} 
              onSelect={setSelectedId} 
              role="seller"
            />
          </TabsContent>
          
          <TabsContent value="bids" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={bidConversations}
              selectedId={resolvedSelectedId} 
              onSelect={setSelectedId} 
              role="buyer"
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
              <h2 className="text-xl font-bold text-slate-900 mb-2">Speak Your Price</h2>
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
