"use client";

import React, { useState } from 'react';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ChatWindow } from '@/components/inbox/ChatWindow';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';

export default function InboxPage() {
  const { conversations } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first conversation on desktop if none selected
  // (In a real app this might depend on screen width, but simple is fine for now)
  
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-muted/20">
      {/* Sidebar / List - Hidden on mobile if chat is open */}
      <div 
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] border-r bg-background flex flex-col",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-4 border-b font-semibold text-lg flex justify-between items-center">
          <h1>Messages</h1>
          <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
            {conversations.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
          />
        </div>
      </div>

      {/* Chat Window - Full width on mobile when selected */}
      <div 
        className={cn(
          "flex-1 flex flex-col bg-background md:block",
          !selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {selectedId ? (
          <ChatWindow 
            conversationId={selectedId} 
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4 p-8 text-center">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
              <span className="text-4xl">💬</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p>Choose a chat from the left to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
