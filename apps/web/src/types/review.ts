export interface Review {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  reviewedId: string;
  listingId: string;
  listingTitle?: string;
  conversationId?: string;
  rating: number; // 1-5
  content?: string;
  role: 'buyer' | 'seller';
  createdAt: string;
}

export interface ProfileCompleteness {
  score: number; // 0-100
  items: {
    name: string;
    completed: boolean;
    weight: number;
  }[];
}

export interface UserReputation {
  avgRating: number;
  reviewCount: number;
  asBuyer: { avgRating: number; count: number };
  asSeller: { avgRating: number; count: number };
}
