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

  const otherUserId = conversation.sellerId === user.id ? conversation.bidderId : conversation.sellerId;
  const otherUser = getUser(otherUserId);
  const item = items.find(i => i.id === conversation.itemId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(conversationId, inputValue);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={otherUser?.avatar} />
          <AvatarFallback>{otherUser?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-sm md:text-base">{otherUser?.name}</h3>
          <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-md">
             re: {item?.title}
          </p>
        </div>
        {/* Deal Actions could go here (Accept Offer, etc) */}
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
      <div className="p-4 border-t shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
