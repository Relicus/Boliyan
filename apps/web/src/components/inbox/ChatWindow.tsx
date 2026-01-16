"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Clock, Lock, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { user, messages, sendMessage, conversations, getUser, items } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);

  const currentMessages = messages.filter(m => m.conversationId === conversationId);
  const conversation = conversations.find(c => c.id === conversationId);

  // Lock body scroll to prevent Safari from scrolling page when input focused
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Expiration Logic
  useEffect(() => {
    if (!conversation?.expiresAt) {
      setTimeLeft("");
      setIsLocked(false);
      return;
    }

    const timer = setInterval(() => {
      const expiry = new Date(conversation.expiresAt!).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("0h 0m 0s");
        setIsLocked(true);
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const timeStr = days > 0 
        ? `${days}d ${hours}h ${mins}m` 
        : `${hours}h ${mins}m ${secs}s`;
      
      setTimeLeft(timeStr);
      setIsLocked(false);
    }, 1000);

    return () => clearInterval(timer);
  }, [conversation?.expiresAt]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  if (!conversation) return <div className="p-10 text-center">Conversation not found</div>;
  if (!user) return <div className="p-10 text-center">Please sign in to view chats.</div>;

  const isSeller = conversation.sellerId === user.id;
  const otherUser = isSeller ? conversation.bidder : conversation.seller;
  const item = conversation.item;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLocked) return;
    sendMessage(conversationId, inputValue);
    setInputValue("");
  };

  return (
    <div 
      id="chat-window" 
      ref={chatContainerRef}
      className="flex flex-col h-full bg-[#FCFCFD]"
    >
      {/* Premium Header */}
      <header id="chat-header" className="flex items-center gap-3 p-4 border-b shrink-0 bg-white/80 backdrop-blur-xl z-30 sticky top-0">
        {onBack && (
          <Button id="chat-back-btn" variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-10 w-10 border shadow-sm ring-2 ring-white">
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xs">{otherUser?.name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-black text-[15px] text-slate-900 truncate tracking-tight">{otherUser?.name || "Unknown"}</h3>
            {otherUser?.isVerified && <VerifiedBadge size="sm" />}
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm",
              isSeller ? "bg-indigo-600 text-white" : "bg-blue-600 text-white"
            )}>
              {isSeller ? "Buyer" : "Seller"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {item && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Regarding</span>
                <span className="text-[11px] font-bold text-slate-600 truncate">{item.title}</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">Rs. {item.askPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
        
        {!isLocked && (
            <Button
                id="chat-call-btn"
                size="icon"
                variant="outline"
                className="rounded-full h-9 w-9 border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
                onClick={() => {
                    const phone = otherUser?.phone || "+971500000000"; // Fallback or Mock
                    window.location.href = `tel:${phone}`;
                }}
            >
                <Phone className="h-4 w-4" />
            </Button>
        )}

        {timeLeft && (
          <div className={cn(
            "flex flex-col items-end px-3 py-1.5 rounded-xl border transition-colors",
            isLocked 
              ? "bg-red-50 border-red-100 text-red-600" 
              : "bg-white border-slate-100 shadow-sm text-blue-600"
          )}>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
              <Clock className="h-2.5 w-2.5" />
              {isLocked ? "Expired" : "Closing"}
            </div>
            <div className="text-[11px] font-black tabular-nums">
              {timeLeft}
            </div>
          </div>
        )}
      </header>

      {/* Messages Area */}
      <div 
        id="chat-messages"
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-gradient-to-b from-white to-slate-50/30"
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-center text-[11px] font-black uppercase tracking-widest mx-auto max-w-fit px-4 py-2 rounded-full border shadow-sm",
            isLocked 
              ? "bg-red-50 border-red-100 text-red-600" 
              : "bg-blue-50 border-blue-100 text-blue-600"
          )}
        >
           {isLocked ? (
             <span className="flex items-center gap-2">
               <Lock className="h-3 w-3" />
               Discussion expired • Chat Locked
             </span>
           ) : (
             <span className="flex items-center gap-2">
               <VerifiedBadge size="sm" />
               Secure Channel • Arrange your deal
             </span>
           )}
        </motion.div>
      
        <AnimatePresence initial={false}>
          {currentMessages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 20, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className={cn(
                  "flex flex-col gap-1.5 max-w-[80%] relative",
                  isMe ? "ml-auto" : "mr-auto"
                )}
              >
                <div className={cn(
                  "px-4 py-2.5 text-[14px] font-medium shadow-sm transition-all",
                  isMe 
                    ? "bg-blue-600 text-white rounded-[22px] rounded-tr-[4px] shadow-blue-200/50" 
                    : "bg-white text-slate-800 rounded-[22px] rounded-tl-[4px] ring-1 ring-slate-100 shadow-slate-200/50"
                )}>
                  {msg.content}
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-1",
                  isMe ? "justify-end" : "justify-start"
                )}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </span>
                  {isMe && (
                    <div className="h-2 w-2 rounded-full bg-blue-100 flex items-center justify-center">
                      <div className="h-1 w-1 rounded-full bg-blue-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Modern Input Area */}
      <div id="chat-input-area" className="p-4 border-t shrink-0 bg-white/80 backdrop-blur-xl z-30">
        <form onSubmit={handleSend} className="flex gap-2 relative max-w-4xl mx-auto">
          {isLocked && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-red-100"
            >
               <span className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                 <Lock className="h-4 w-4" />
                 Channel Inactive
               </span>
            </motion.div>
          )}
          <div className="flex-1 relative group">
            <Input 
              id="chat-input-field"
              placeholder={isLocked ? "Chat is read-only" : "Type a message..."} 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              enterKeyHint="send"
              disabled={isLocked}
              className="flex-1 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-100 focus:bg-white transition-all rounded-[20px] px-5 font-medium text-slate-700 shadow-inner"
            />
          </div>
          <Button 
            id="chat-send-btn"
            type="submit" 
            size="icon" 
            disabled={!inputValue.trim() || isLocked} 
            className={cn(
              "h-12 w-12 rounded-[20px] shadow-lg transition-all active:scale-95",
              inputValue.trim() && !isLocked ? "bg-blue-600 shadow-blue-200" : "bg-slate-100"
            )}
          >
            <Send className={cn("h-5 w-5", inputValue.trim() && !isLocked ? "text-white" : "text-slate-400")} />
            <span className="sr-only">Send</span>
          </Button>
        </form>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
