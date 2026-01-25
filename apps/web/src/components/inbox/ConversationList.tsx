"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Conversation } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  role: 'buyer' | 'seller' | 'auto';
}

export function ConversationList({ conversations, selectedId, onSelect, role }: ConversationListProps) {
  const { user, refreshConversations, bids } = useApp();
  const [now, setNow] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshConversations) {
        setIsRefreshing(true);
        await refreshConversations();
        setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Update timestamps every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to find the "other" user in the conversation
  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    return conversation.sellerId === user.id ? conversation.bidder : conversation.seller;
  };

  // Helper to get item details
  const getItem = (conversation: Conversation) => conversation.item;

  // Helper to calculate and format time left
  const getChatTimeLeft = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return { text: "Expired", urgent: true, done: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = diff < (1000 * 60 * 60 * 2); // Less than 2 hours

    let text = "";
    if (days > 0) text = `${days}d ${hours}h`;
    else if (hours > 0) text = `${hours}h ${mins}m`;
    else text = `${mins}m ${secs}s`;

    return { text, urgent: isUrgent, done: false };
  };

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-1">
          <Clock className="h-6 w-6 text-slate-200" />
        </div>
        <p className="text-sm font-bold text-slate-500">No active conversations</p>
        <p className="text-[10px] text-slate-400 max-w-[140px] leading-tight">
          Chats appear here once a bid is accepted and the deal is moving.
        </p>
        <button 
           onClick={handleRefresh}
           disabled={isRefreshing}
           className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
            {isRefreshing ? "Refreshing..." : "Refresh List"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <AnimatePresence mode="popLayout">
        {conversations.map((conv, idx) => {
          const otherUser = getOtherUser(conv);
          const item = getItem(conv);
          const bidAmount = bids.find(b => b.itemId === conv.itemId && b.bidderId === conv.bidderId)?.amount;
          const priceValue = bidAmount ?? item?.currentHighBid ?? item?.askPrice;
          const displayPrice = typeof priceValue === 'number' ? priceValue : undefined;
          const timeLeft = getChatTimeLeft(conv.expiresAt);
          const isSelected = selectedId === conv.id;
          
          const activeRole = role === 'auto' 
            ? (user && conv.sellerId === user.id ? 'seller' : 'buyer')
            : role;
          
          return (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              key={conv.id}
            >
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all flex flex-row gap-4 items-center border-none shadow-none rounded-[20px] relative group overflow-hidden",
                  isSelected 
                    ? "bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/50" 
                    : "hover:bg-slate-100/40 bg-transparent"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <div className="relative shrink-0">
                  <div className={cn(
                    "absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md",
                    activeRole === 'seller' ? "bg-slate-400/20" : "bg-blue-400/20"
                  )} />
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm relative z-10 transition-transform group-hover:scale-105">
                    <AvatarImage src={otherUser?.avatar} />
                    <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xs">
                      {otherUser?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute -bottom-1 -right-1 z-20">
                    <div className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full shadow-sm font-black uppercase tracking-tighter border-2 border-white",
                      activeRole === 'seller' 
                        ? "bg-slate-900 text-white" 
                        : "bg-blue-600 text-white"
                    )}>
                      {activeRole === 'seller' ? 'Offer' : 'Bid'}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 z-10">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 mb-0.5">
                    <h4 className="font-black text-[14px] text-slate-900 truncate leading-none flex items-center gap-1">
                      {otherUser?.name || "Anonymous"}
                      {otherUser?.isVerified && <VerifiedBadge size="sm" />}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                    {item && (
                      <div className="h-4 w-4 rounded-[4px] bg-slate-100 overflow-hidden flex-shrink-0 ring-1 ring-slate-200/50">
                        <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tight">
                      {item?.title || "Product"}
                    </div>
                    {timeLeft && (
                      <div className={cn(
                        "ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black tabular-nums border shadow-sm",
                        timeLeft.done 
                          ? "bg-slate-50 border-slate-100 text-slate-400 line-through" 
                          : timeLeft.urgent 
                            ? "bg-red-50 border-red-100 text-red-500 animate-pulse" 
                            : "bg-emerald-50 border-emerald-100 text-emerald-600"
                      )}>
                        {timeLeft.text}
                      </div>
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-[12px] truncate font-medium tracking-tight",
                    isSelected ? "text-slate-600" : "text-slate-500 group-hover:text-slate-600"
                  )}>
                    {conv.lastMessage && conv.lastMessage !== 'Chat started'
                      ? conv.lastMessage
                      : "No messages yet"}
                  </p>
                </div>

                {displayPrice !== undefined && (
                  <div className="shrink-0 text-right">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }) : 'now'}
                    </div>
                    {item && (
                      <div className="price-font text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Ask {item.askPrice.toLocaleString()}
                      </div>
                    )}
                    <div className="price-font text-[18px] font-black text-emerald-600 leading-none">
                      Rs. {displayPrice.toLocaleString()}
                    </div>
                  </div>
                )}

                {isSelected && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                  />
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
