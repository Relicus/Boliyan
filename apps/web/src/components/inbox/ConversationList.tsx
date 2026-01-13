"use client";

import React from 'react';
import { useApp } from '@/lib/store';
import { Conversation } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { conversations, user, getUser, items } = useApp();

  // Helper to find the "other" user in the conversation
  const getOtherUser = (conversation: Conversation) => {
    const otherUserId = conversation.sellerId === user.id ? conversation.bidderId : conversation.sellerId;
    return getUser(otherUserId);
  };

  // Helper to get item details
  const getItem = (itemId: string) => items.find(i => i.id === itemId);

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No active chats. <br />
        <span className="text-xs">Chats only open after a bid is accepted.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {conversations.map((conv) => {
        const otherUser = getOtherUser(conv);
        const item = getItem(conv.itemId);
        
        return (
          <Card
            key={conv.id}
            className={cn(
              "p-3 cursor-pointer hover:bg-accent transition-colors flex gap-3 items-center",
              selectedId === conv.id ? "bg-accent border-primary" : ""
            )}
            onClick={() => onSelect(conv.id)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar} />
              <AvatarFallback>{otherUser?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <h4 className="font-semibold text-sm truncate">{otherUser?.name || "Unknown User"}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true }) : 'New'}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground truncate mb-0.5">
                {item?.title || "Unknown Item"}
              </div>
              
              <p className={cn(
                "text-sm truncate",
                // Highlight if unread? For now just showing content
                "text-foreground/80"
              )}>
                {conv.lastMessage || "Start chatting..."}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
