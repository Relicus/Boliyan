import { Item } from './index';

export interface SellerMetric {
  label: string;
  value: number;
  trend?: number; // % change vs last period (mockable for now)
  icon: string;   // Lucide icon name
  color?: string; // Optional override color
}

export interface ManagedListing extends Item {
  views: number;
  unreadBids: number;
  lastActivity: string; // ISO date string
}

export interface DashboardState {
  metrics: SellerMetric[];
  listings: ManagedListing[];
  isLoading: boolean;
  error: string | null;
}
