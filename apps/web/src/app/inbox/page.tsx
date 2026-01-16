"use client";

import React, { useState, useEffect, Suspense } from 'react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');

  const buyingConversations = conversations.filter(c => c.bidderId === user.id);
  const sellingConversations = conversations.filter(c => c.sellerId === user.id);

  // Handle deep-linking from URL
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setSelectedId(idParam);
      
      // Auto-switch tab based on which list contains the ID
      if (buyingConversations.some(c => c.id === idParam)) {
        setActiveTab('buying');
      } else if (sellingConversations.some(c => c.id === idParam)) {
        setActiveTab('selling');
      }
    }
  }, [searchParams, buyingConversations.length, sellingConversations.length]);

  // Lock Viewport Scroll
  useEffect(() => {
    // Save original styles
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;

    // Lock it down
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100dvh';

    return () => {
      // Restore
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
    };
  }, []);

  return (
    <div id="inbox-container" className="fixed top-16 left-0 right-0 bottom-16 md:bottom-0 overflow-hidden bg-muted/20 flex">
      {/* Sidebar / List - Hidden on mobile if chat is open */}
      <div 
        id="inbox-sidebar"
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] border-r bg-background flex flex-col shrink-0 overflow-hidden",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b shrink-0">
          <h1 className="font-black text-xl mb-4 text-slate-900">Messages</h1>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList id="inbox-tabs-list" className="grid w-full grid-cols-2 h-10 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger 
                id="inbox-buying-tab"
                value="buying" 
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                <ShoppingBag className="mr-2 h-3.5 w-3.5" />
                Buying
                {buyingConversations.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md text-[10px]">
                    {buyingConversations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                id="inbox-selling-tab"
                value="selling" 
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <Store className="mr-2 h-3.5 w-3.5" />
                Selling
                {sellingConversations.length > 0 && (
                  <span className="ml-2 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px]">
                    {sellingConversations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} className="flex-1 overflow-hidden">
          <TabsContent value="buying" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={buyingConversations}
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              role="buyer"
            />
          </TabsContent>
          
          <TabsContent value="selling" className="h-full m-0 focus-visible:outline-none overflow-y-auto scrollbar-hide">
            <ConversationList 
              conversations={sellingConversations}
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              role="seller"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Window - Full width on mobile when selected */}
      <div 
        id="chat-window-container"
        className={cn(
          "flex-1 flex flex-col bg-background md:block min-w-0",
          !selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {selectedId ? (
          <ChatWindow 
            conversationId={selectedId} 
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
