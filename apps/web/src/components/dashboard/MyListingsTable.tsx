'use client';

import { useDashboard } from '@/context/DashboardContext';
import { ListingActionMenu } from './ListingActionMenu';
import { Badge } from '@/components/ui/badge';
import { formatShortTimestamp } from '@/lib/utils';

export function MyListingsTable() {
  const { listings, isLoading } = useDashboard();

  if (isLoading) {
     return <div className="text-muted-foreground text-sm">Loading listings...</div>;
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
        <h3 className="text-lg font-medium">No active listings</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You haven&apos;t listed any items for sale yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Bids</th>
              <th className="px-4 py-3 text-center">Views</th>
              <th className="px-4 py-3 text-right">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {listings.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded overflow-hidden flex-shrink-0">
                      {item.images[0] && (
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="h-full w-full object-cover" 
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  ${item.askPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={
                    item.status === 'active' ? 'default' : 
                    item.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.bidAttemptsCount ?? item.bidCount}
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {item.views}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                  {formatShortTimestamp(new Date(item.createdAt))}
                </td>
                <td className="px-4 py-3 text-right">
                  <ListingActionMenu listing={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
