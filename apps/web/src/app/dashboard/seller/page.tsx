'use client';

import { DashboardProvider } from '@/context/DashboardContext';
import { SellerStats } from '@/components/dashboard/SellerStats';
import { MyListingsTable } from '@/components/dashboard/MyListingsTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboardPage() {
  return (
    <DashboardProvider>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your listings and track your performance.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link href="/list">
              <Plus className="h-4 w-4" />
              New Listing
            </Link>
          </Button>
        </div>

        <SellerStats />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Active Listings</h2>
          <MyListingsTable />
        </div>
      </div>
    </DashboardProvider>
  );
}
