"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { Badge } from '@/components/ui/badge';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void; // For mobile view to go back to list
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { user, messages, sendMessage, conversations, getUser, items } = useApp();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages for this conversation
  const currentMessages = messages.filter(m => m.conversationId === conversationId);
  const conversation = conversations.find(c => c.id === conversationId);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  if (!conversation) return <div className="p-10 text-center">Conversation not found</div>;

  const isSeller = conversation.sellerId === user.id;
  const otherUserId = isSeller ? conversation.bidderId : conversation.sellerId;
  const otherUser = getUser(otherUserId);
  const item = items.find(i => i.id === conversation.itemId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(conversationId, inputValue);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-10 w-10 border shadow-sm">
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{otherUser?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500"
          )} title="Online" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 truncate tracking-tight">{otherUser?.name}</h3>
            {otherUser?.isVerified && <VerifiedBadge size="sm" />}
            <Badge variant="outline" className={cn(
              "text-[8px] h-3.5 px-1 font-black uppercase tracking-tighter border-none",
              isSeller ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"
            )}>
              {isSeller ? "Buyer" : "Seller"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {item && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RE:</span>
                <span className="text-xs font-medium text-slate-500 truncate">{item.title}</span>
                <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-1 py-0.5 rounded">Rs. {item.askPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        {item && (
          <div className="hidden sm:block h-10 w-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
            <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 min-h-[calc(100vh-250px)]">
          <div className="text-center text-xs text-muted-foreground my-4 p-2 bg-secondary/50 rounded-lg">
             Offer accepted. You can now chat to arrange details.
          </div>
        
          {currentMessages.map((msg) => {
            const isMe = msg.senderId === user.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex w-max max-w-[75%] flex-col gap-1 px-4 py-2 text-sm rounded-xl shadow-sm",
                  isMe 
                    ? "ml-auto bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted text-foreground rounded-tl-none"
                )}
              >
                {msg.content}
                <span className={cn("text-[10px] self-end opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                  {format(new Date(msg.createdAt), 'h:mm a')}
                </span>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t shrink-0 bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            placeholder="Type a message..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
