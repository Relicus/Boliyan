export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number; // 0-5
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  sellerId: string;
  askPrice: number;
  recommendedPrice: number;
  category: string;
  isPublicBid: boolean;
  currentHighBid?: number;
  bidCount: number;
  createdAt: string;
}

export interface Bid {
  id: string;
  itemId: string;
  bidderId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'shortlisted';
  type: 'public' | 'private';
  createdAt: string;
}

export interface LocationInfo {
  distanceKm: number;
  durationMins: number;
}

export interface Conversation {
  id: string;
  itemId: string;
  sellerId: string;
  bidderId: string;
  lastMessage?: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
