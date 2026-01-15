"use client";

import React from 'react';
import { useApp } from '@/lib/store';
import { Conversation } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  role: 'buyer' | 'seller';
}

export function ConversationList({ conversations, selectedId, onSelect, role }: ConversationListProps) {
  const { user, getUser, items } = useApp();

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
              "p-4 cursor-pointer hover:bg-slate-50 transition-all flex flex-row gap-4 items-center border-none shadow-none rounded-2xl relative group",
              selectedId === conv.id ? "bg-white shadow-sm ring-1 ring-slate-100/50" : ""
            )}
            onClick={() => onSelect(conv.id)}
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={otherUser?.avatar} />
                <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">
                  {otherUser?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              {/* Role Badge Positioning */}
              <div className="absolute -bottom-1 -right-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[8px] px-1 py-0 h-4 border-none shadow-sm font-black uppercase tracking-tighter",
                    role === 'seller' ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"
                  )}
                >
                  {role === 'seller' ? 'Seller' : 'Buyer'}
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2 mb-0.5">
                <h4 className="font-bold text-[13px] text-slate-900 truncate leading-none flex items-center gap-1">
                  {otherUser?.name || "Unknown User"}
                  {otherUser?.isVerified && <VerifiedBadge size="sm" />}
                </h4>
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                  {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }) : 'Now'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                {item && (
                  <div className="h-3.5 w-3.5 rounded-sm bg-slate-100 overflow-hidden flex-shrink-0">
                    <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tight">
                  {item?.title || "Unknown Item"}
                </div>
              </div>
              
              <p className={cn(
                "text-[11px] truncate font-medium max-w-[90%]",
                selectedId === conv.id ? "text-slate-700" : "text-slate-400"
              )}>
                {conv.lastMessage || "Start chatting..."}
              </p>
            </div>

            {/* Selection Indicator */}
            {selectedId === conv.id && (
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full" />
            )}
          </Card>
        );
      })}
    </div>
  );
}
