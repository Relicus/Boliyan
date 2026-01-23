"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Clock, Lock, Phone, CheckCheck, Check, Star, Handshake } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatPrice } from '@/lib/utils';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewForm from '@/components/profile/ReviewForm';
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
  const { user, messages, sendMessage, markAsRead, conversations, subscribeToConversation, unsubscribeFromConversation, confirmExchange } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isLockedState, setIsLockedState] = useState(false);
  const { canReview, submitReview } = useReviews();
  const [showReviewBtn, setShowReviewBtn] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showSealAnim, setShowSealAnim] = useState(false);
  
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

  const conversation = conversations.find(c => c.id === conversationId);
  const isSeller = user && conversation ? conversation.sellerId === user.id : false;
  const otherUser = conversation ? (isSeller ? conversation.bidder : conversation.seller) : undefined;
  const item = conversation?.item;

  const isLocked = !conversation?.expiresAt ? false : isLockedState;

  // Handshake Logic
  const myRole = isSeller ? 'seller' : 'buyer';
  const iHaveConfirmed = myRole === 'seller' ? !!conversation?.sellerConfirmedAt : !!conversation?.buyerConfirmedAt;
  const theyHaveConfirmed = myRole === 'seller' ? !!conversation?.buyerConfirmedAt : !!conversation?.sellerConfirmedAt;
  const isSealed = conversation?.isSealed;

  // Trigger Seal Animation
  useEffect(() => {
    if (isSealed && !showSealAnim) {
       // Only trigger if we haven't seen it in this session (simplified)
       // Ideally we check if 'sealedAt' is very recent
       const sealedAt = conversation?.sellerConfirmedAt && conversation?.buyerConfirmedAt 
         ? Math.max(new Date(conversation.sellerConfirmedAt).getTime(), new Date(conversation.buyerConfirmedAt).getTime())
         : 0;
       
       if (Date.now() - sealedAt < 5000) { // Only animate if it happened in last 5s
          setShowSealAnim(true);
          sonic.thud();
       }
    }
  }, [isSealed, conversation]);

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


  // 3-Slot Visual Indicator Logic (Seller Only)
  // Calculate real active chat count for this item
  const activeChatCount = item ? conversations.filter(c => c.itemId === item.id).length : 0;
  const maxSlots = 3;
  const slots = Array.from({ length: maxSlots }).map((_, i) => i < activeChatCount);

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
    if (item?.status === 'completed' && otherUser) {
        canReview(item.id, isSeller ? 'seller' : 'buyer')
            .then(setShowReviewBtn);
    }
  }, [item?.status, item?.id, otherUser, canReview, isSeller]);

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

  if (!conversation) return <div className="p-10 text-center">Conversation not found</div>;
  if (!user) return <div className="p-10 text-center">Please sign in to view chats.</div>;

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
        <div className="flex items-center gap-3 p-4 pb-3">
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
                isSeller ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
                )}>
                {isSeller ? "Buyer" : "Seller"}
                </span>
                {item && (
                <span className="text-[10px] font-black text-slate-400 ml-auto mr-2 tracking-tighter uppercase whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    Ask: {formatPrice(item.askPrice)}
                </span>
                )}
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

            {/* 3-Slot Indicator (Seller Only) */}
            {isSeller && (
            <div className="flex flex-col items-end mr-2">
                <div className="flex gap-1 mb-0.5">
                {slots.map((filled, i) => (
                    <div 
                    key={i} 
                    className={cn(
                        "w-2 h-2 rounded-full ring-1 ring-slate-100 transition-all", 
                        filled ? "bg-emerald-500 shadow-sm shadow-emerald-200" : "bg-slate-100"
                    )} 
                    />
                ))}
                </div>
                <span className="text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-tighter text-slate-400">
                {activeChatCount}/{maxSlots} Slots
                </span>
            </div>
            )}
            
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

            {timeLeft && !isSealed && (
            <div className={cn(
                "flex flex-col items-end px-3 py-1.5 rounded-xl border transition-colors",
                isLocked 
                ? "bg-red-50 border-red-100 text-red-600" 
                : "bg-white border-slate-100 shadow-sm text-blue-600"
            )}>
                <div className="flex items-center gap-1.5 text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-widest text-slate-500">
                <Clock className="h-2.5 w-2.5" />
                {isLocked ? "Expired" : "Closing"}
                </div>
                <div className="text-[11px] font-black tabular-nums">
                {timeLeft}
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
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-gradient-to-b from-white to-slate-50/30"
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
               Discussion expired • Chat Locked
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
                    <div className="flex items-center justify-center">
                      {msg.isRead ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                         <Check className="h-3 w-3 text-slate-300" />
                      )}
                    </div>
                  )}
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
        )}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

    </div>
  );
}
