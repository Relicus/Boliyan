"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Clock, Lock, Phone, CheckCheck, Check, Handshake } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatPrice } from '@/lib/utils';
import { Conversation } from '@/types';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useReviews } from '@/context/ReviewContext';
import { sonic } from '@/lib/sonic';
import { DealSealAnimation } from '@/components/common/DealSealAnimation';
import StarRating from '@/components/profile/StarRating';
import { toast } from 'sonner';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { user, messages, sendMessage, markAsRead, conversations, bids, subscribeToConversation, unsubscribeFromConversation, confirmExchange, fetchConversation } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isLockedState, setIsLockedState] = useState(false);
  const { submitReview } = useReviews();
  const [showSealAnim, setShowSealAnim] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [localConversation, setLocalConversation] = useState<Conversation | null>(null);
  
  // Vouch State
  const [vouchRating, setVouchRating] = useState(0);
  const [vouchSubmitted, setVouchSubmitted] = useState(false);
  
  const currentMessages = messages.filter(m => m.conversationId === conversationId);
  const prevMessageCountRef = useRef(currentMessages.length);

  // Sound feedback for new messages
  useEffect(() => {
    if (currentMessages.length > prevMessageCountRef.current) {
      const lastMsg = currentMessages[currentMessages.length - 1];
      // Only play if it's from the OTHER user (outbound sound is handled in handleSend)
      if (lastMsg && lastMsg.senderId !== user?.id) {
        sonic.pop();
      }
    }
    prevMessageCountRef.current = currentMessages.length;
  }, [currentMessages, user?.id]);

  // Lazy Subscription Lifecycle
  useEffect(() => {
    if (conversationId) {
        subscribeToConversation(conversationId);
    }
    return () => {
        if (conversationId) {
            unsubscribeFromConversation(conversationId);
        }
    };
  }, [conversationId, subscribeToConversation, unsubscribeFromConversation]);

  // Fetch Fallback if not in global state
  useEffect(() => {
    if (!conversationId || conversations.find(c => c.id === conversationId)) return;
    
    // Attempt fetch
    const loadMissing = async () => {
        // Need fetchConversation exposed in useApp -> context
        if (fetchConversation) {
            const fetched = await fetchConversation(conversationId);
            if (fetched) {
                setLocalConversation(fetched);
            }
        }
    };
    loadMissing();
  }, [conversationId, conversations, fetchConversation]);

  const conversation = conversations.find(c => c.id === conversationId) || localConversation;
  const isSeller = user && conversation ? conversation.sellerId === user.id : false;
  const otherUser = conversation ? (isSeller ? conversation.bidder : conversation.seller) : undefined;
  const item = conversation?.item;
  const offerBid = conversation
    ? bids.find(b => b.itemId === conversation.itemId && b.bidderId === conversation.bidderId)
    : undefined;
  const offerPrice = offerBid?.amount ?? item?.currentHighBid;
  const priceBlock = item ? (
    <div className="flex flex-col items-start">
      <span className="price-font text-[9px] md:text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
        Ask {formatPrice(item.askPrice)}
      </span>
      {typeof offerPrice === 'number' && (
        <span className="price-font text-[clamp(0.9rem,2.6cqi,1.1rem)] font-black text-emerald-600 leading-none tabular-nums">
          {formatPrice(offerPrice)}
        </span>
      )}
    </div>
  ) : null;

  // Handshake Logic
  const myRole = isSeller ? 'seller' : 'buyer';
  const iHaveConfirmed = myRole === 'seller' ? !!conversation?.sellerConfirmedAt : !!conversation?.buyerConfirmedAt;
  const theyHaveConfirmed = myRole === 'seller' ? !!conversation?.buyerConfirmedAt : !!conversation?.sellerConfirmedAt;
  const isSealed = conversation?.isSealed;

  const isCancelled = item?.status === 'cancelled';
  const isCompleted = item?.status === 'completed';
  const isLocked = (!conversation?.expiresAt ? false : isLockedState) || isCancelled || (isCompleted && !isSealed);

  // Trigger Seal Animation
  useEffect(() => {
    if (isSealed && !showSealAnim) {
       // Only trigger if we haven't seen it in this session (simplified)
       // Ideally we check if 'sealedAt' is very recent
       const sellerTime = conversation?.sellerConfirmedAt ? new Date(conversation.sellerConfirmedAt).getTime() : 0;
       const buyerTime = conversation?.buyerConfirmedAt ? new Date(conversation.buyerConfirmedAt).getTime() : 0;
       const sealedAt = Math.max(sellerTime, buyerTime);
       const now = new Date().getTime();
       
       if (now - sealedAt < 5000) { // Only animate if it happened in last 5s
          // Use setTimeout to avoid sync state update warning
          const timer = setTimeout(() => {
             setShowSealAnim(true);
             sonic.thud();
          }, 0);
          return () => clearTimeout(timer);
       }
    }
  }, [isSealed, conversation, showSealAnim]);

  const handleConfirmExchange = async () => {
    if (!conversation) return;
    await confirmExchange(conversation.id, myRole);
    sonic.click();
    toast.success("You confirmed the exchange!");
  };

  const handleQuickVouch = async () => {
    if (vouchRating === 0 || !otherUser || !item) return;
    
    const result = await submitReview({
        reviewedId: otherUser.id,
        listingId: item.id,
        conversationId: conversationId,
        rating: vouchRating,
        content: "Verified Exchange (Quick Vouch)",
        role: myRole
    });

    if (result.success) {
        setVouchSubmitted(true);
        sonic.chime();
        toast.success("Reputation updated!");
    } else {
        toast.error("Failed to submit vouch");
    }
  };


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
      return;
    }

    const timer = setInterval(() => {
      const expiry = new Date(conversation.expiresAt!).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("0h 0m 0s");
        setIsLockedState(true);
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
      setIsLockedState(false);
    }, 1000);

    return () => clearInterval(timer);
  }, [conversation?.expiresAt]);

  useEffect(() => {
    if (!user || conversation) {
      if (showMissing) {
        // Avoid sync state update
        setTimeout(() => setShowMissing(false), 0);
      }
      return;
    }

    const timer = setTimeout(() => setShowMissing(true), 2500); // Increased timeout to give fetch time
    return () => clearTimeout(timer);
  }, [conversation, conversationId, user, showMissing]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Mark as read logic
    const unreadMessages = currentMessages.filter(m => m.senderId !== user?.id && !m.isRead);
    if (unreadMessages.length > 0) {
        markAsRead(conversationId);
    }
  }, [currentMessages, conversationId, user?.id, markAsRead]);

  const handleRetryFetch = async () => {
    setShowMissing(false);
    if (fetchConversation && conversationId) {
        console.log("Manual retry fetching conversation:", conversationId);
        const fetched = await fetchConversation(conversationId);
        if (fetched) {
            setLocalConversation(fetched);
        } else {
            console.error("Manual retry failed to find conversation");
            toast.error("Could not find conversation. It may have been deleted.");
            setTimeout(() => setShowMissing(true), 500);
        }
    }
  };

  if (!user) return <div className="p-10 text-center">Please sign in to view chats.</div>;
  if (!conversation) {
    return showMissing
      ? (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-red-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Conversation not found</h3>
            <p className="text-sm text-slate-500 max-w-[280px]">
               We couldn't load this chat (ID: {conversationId?.slice(0, 8)}...). 
            </p>
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 font-mono mt-2">
                User: {user.id.slice(0, 8)}...
            </div>
            <Button onClick={handleRetryFetch} variant="outline" className="mt-4">
                Retry Connection
            </Button>
            <Button onClick={onBack || (() => window.history.back())} variant="ghost" className="text-slate-400">
                Go Back
            </Button>
        </div>
      )
      : <div className="flex items-center justify-center h-full p-10 text-center text-slate-400 animate-pulse">Loading chat...</div>;
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLocked) return;
    sendMessage(conversationId, inputValue);
    setInputValue("");
    sonic.pop();
  };

  return (
    <div 
      id="chat-window" 
      ref={chatContainerRef}
      className="flex flex-col h-full bg-[#FCFCFD] relative"
    >
      <DealSealAnimation isVisible={showSealAnim} />

      {/* Premium Header */}
      <header id="chat-header" className="flex flex-col border-b shrink-0 bg-white/80 backdrop-blur-xl z-30 sticky top-0">
        <div className="flex flex-col gap-2 p-4 pb-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
              <div className="flex items-center gap-2 mb-0.5 min-w-0">
                  <h3 className="font-black text-[15px] text-slate-900 truncate tracking-tight">{otherUser?.name || "Unknown"}</h3>
                  {otherUser?.isVerified && <VerifiedBadge size="sm" />}
                  <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm shrink-0",
                  isSeller ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
                  )}>
                  {isSeller ? "Buyer" : "Seller"}
                  </span>
              </div>
              
              <div className="flex items-center gap-1.5 min-w-0">
                  {item && (
                  <div className="h-4 w-4 rounded-[4px] bg-slate-100 overflow-hidden flex-shrink-0 ring-1 ring-slate-200/50">
                      <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                  )}
                  <div className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tight">
                  {item?.title || "Product"}
                  </div>
              </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between md:justify-end">
              {priceBlock}
              {!isLocked && (() => {
                const listingPhone = !isSeller ? item?.contactPhone : undefined;
                const phone = listingPhone || otherUser?.phone;
                if (!phone) return null;

                return (
                  <Button
                    id="chat-call-btn"
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 text-xs font-bold rounded-full border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors shadow-sm"
                    onClick={() => {
                      window.location.href = `tel:${phone}`;
                    }}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                );
              })()}
            </div>

            {/* Slot indicator shown on listing/dashboard only */}

            {timeLeft && !isSealed && (
            <div className={cn(
                "flex flex-col items-end px-3 py-1.5 rounded-xl border transition-colors",
                isLocked 
                ? "bg-red-50 border-red-100 text-red-600" 
                : "bg-white border-slate-100 shadow-sm text-blue-600"
            )}>
                <div className="flex items-center gap-1.5 text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-widest text-slate-500">
                <Clock className="h-2.5 w-2.5" />
                {isLocked ? (isCancelled ? "Cancelled" : (isCompleted ? "Sold" : "Expired")) : "Closing"}
                </div>
                <div className="text-[11px] font-black tabular-nums">
                {isCancelled ? "N/A" : (isCompleted ? "Closed" : timeLeft)}
                </div>
            </div>
            )}
        </div>

        {/* --- HANDSHAKE BANNER --- */}
        {!isSealed && (
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top-2">
               <div className="flex items-center gap-2">
                  <Handshake className={cn("h-4 w-4", iHaveConfirmed ? "text-emerald-500" : "text-slate-400")} />
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">
                         {iHaveConfirmed 
                            ? (theyHaveConfirmed ? "Sealing Deal..." : `Waiting for ${otherUser?.name?.split(' ')[0]}...`)
                            : (theyHaveConfirmed ? `${otherUser?.name?.split(' ')[0]} confirmed exchange!` : "Exchange Complete?")
                         }
                      </span>
                      {theyHaveConfirmed && !iHaveConfirmed && (
                          <span className="text-[10px] text-emerald-600 font-medium">Tap confirm to seal & vouch</span>
                      )}
                  </div>
               </div>
               
               {!iHaveConfirmed && (
                   <Button 
                     size="sm" 
                     onClick={handleConfirmExchange}
                     className={cn(
                         "h-8 text-xs font-bold gap-1.5 shadow-sm transition-all",
                         theyHaveConfirmed 
                           ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse" 
                           : "bg-white text-slate-700 border hover:bg-slate-50"
                     )}
                   >
                       {theyHaveConfirmed ? "Confirm & Seal" : "Deal Done"}
                   </Button>
               )}
               {iHaveConfirmed && (
                   <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                       Confirmed
                   </div>
               )}
            </div>
        )}
      </header>

      {/* Messages Area */}
      <div 
        id="chat-messages"
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide bg-gradient-to-b from-white to-slate-50/30 flex flex-col justify-end"
      >
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-center text-[11px] font-black uppercase tracking-widest mx-auto max-w-fit px-4 py-2 rounded-full border shadow-sm",
            isLocked 
              ? "bg-red-50 border-red-100 text-red-600" 
              : (isSealed ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-blue-50 border-blue-100 text-blue-600")
          )}
        >
            {isLocked ? (
              <span className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                {isCancelled ? "Listing Cancelled • Chat Locked" : (isCompleted ? "Item Sold • Chat Locked" : "Discussion expired • Chat Locked")}
              </span>
            ) : isSealed ? (
             <span className="flex items-center gap-2">
               <Handshake className="h-3 w-3" />
               Deal Sealed • Verified Exchange
             </span>
           ) : (
             <span className="flex items-center gap-2">
               <VerifiedBadge size="sm" />
               Secure Channel • Arrange your deal
             </span>
           )}
        </motion.div>
      
        <AnimatePresence initial={false}>
          {currentMessages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 20, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className={cn(
                  "flex flex-col gap-1 max-w-[85%] md:max-w-[70%] w-fit",
                  isMe ? "ml-auto self-end items-end" : "mr-auto self-start items-start"
                )}
              >
                <div className={cn(
                  "relative inline-flex w-fit max-w-full px-3 pt-1.5 pb-4 pr-12 text-[12px] md:text-[13px] font-medium leading-snug shadow-sm transition-all",
                  isMe 
                    ? "bg-blue-600 text-white rounded-[18px] rounded-tr-[6px] shadow-blue-200/50" 
                    : "bg-white text-slate-800 rounded-[18px] rounded-tl-[6px] ring-1 ring-slate-100 shadow-slate-200/50"
                )}>
                  <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  <span className={cn(
                    "absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap",
                    isMe ? "text-blue-100/90" : "text-slate-400"
                  )}>
                    {format(new Date(msg.createdAt), 'h:mm a')}
                    {isMe && (
                      <span className="flex items-center justify-center">
                        {msg.isRead ? (
                          <CheckCheck className="h-3 w-3 text-blue-100/90" />
                        ) : (
                           <Check className="h-3 w-3 text-blue-100/70" />
                        )}
                      </span>
                    )}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Modern Input Area OR Vouch Bar */}
      <div id="chat-input-area" className="p-4 border-t shrink-0 bg-white/80 backdrop-blur-xl z-30">
        
        {isSealed && !vouchSubmitted ? (
             /* --- VOUCH BAR --- */
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-3 items-center justify-center py-2"
             >
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                     How was {otherUser?.name?.split(' ')[0]}?
                 </span>
                 <div className="flex items-center gap-4">
                     <StarRating 
                        rating={vouchRating} 
                        onRatingChange={(r) => {
                            setVouchRating(r);
                            sonic.tick();
                        }} 
                        size={28} 
                     />
                 </div>
                 {vouchRating > 0 && (
                     <Button 
                        size="sm" 
                        onClick={handleQuickVouch}
                        className="w-full bg-slate-900 text-white rounded-xl shadow-lg animate-in zoom-in duration-200"
                     >
                         Confirm Vouch
                     </Button>
                 )}
             </motion.div>
        ) : isSealed && vouchSubmitted ? (
             /* --- VOUCH COMPLETE --- */
             <div className="flex items-center justify-center py-4 text-emerald-600 gap-2">
                 <CheckCheck className="h-5 w-5" />
                 <span className="font-bold text-sm">Vouch Submitted. Deal Complete.</span>
             </div>
        ) : (
            /* --- STANDARD INPUT --- */
            <form onSubmit={handleSend} className="flex gap-2 relative max-w-4xl mx-auto">
            {isLocked && (
                <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-red-100"
                >
                 <span className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {isCancelled ? "Listing Cancelled" : (isCompleted ? "Item Sold" : "Channel Inactive")}
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
                "h-12 w-12 rounded-[20px] shadow-lg transition-all active:scale-y-95",
                inputValue.trim() && !isLocked ? "bg-blue-600 shadow-blue-200" : "bg-slate-100"
                )}
            >
                <Send className={cn("h-5 w-5", inputValue.trim() && !isLocked ? "text-white" : "text-slate-400")} />
                <span className="sr-only">Send</span>
            </Button>
            </form>
        )}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      <AnimatePresence>
        {showMissing && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-20"
           >
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Clock className="h-8 w-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">Connecting...</h3>
             <p className="text-sm text-slate-500 max-w-[240px]">
               We're looking for this conversation. If it doesn't appear soon, it may have expired.
             </p>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
