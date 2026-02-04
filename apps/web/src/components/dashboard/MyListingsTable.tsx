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
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {listings.map((item) => (
          <div 
            key={item.id} 
            className="bg-white border rounded-xl p-3 shadow-sm"
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {item.images[0] && (
                  <img 
                    src={item.images[0]} 
                    alt={item.title} 
                    className="h-full w-full object-cover" 
                  />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {item.title}
                  </h3>
                  <ListingActionMenu listing={item} />
                </div>
                
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  Rs. {item.askPrice.toLocaleString()}
                </p>
                
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge 
                    variant={
                      item.status === 'active' ? 'default' : 
                      item.status === 'completed' ? 'secondary' : 'outline'
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.status}
                  </Badge>
                  
                  {item.moderationStatus === 'rejected' && (
                    <Badge 
                      variant="destructive" 
                      className="text-[10px] px-1.5 py-0"
                    >
                      Rejected
                    </Badge>
                  )}
                  
                  <span className="text-xs text-muted-foreground">
                    {item.bidAttemptsCount ?? item.bidCount} bids
                  </span>
                  
                  <span className="text-xs text-muted-foreground">
                    {item.views} views
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
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
                    Rs. {item.askPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={
                        item.status === 'active' ? 'default' : 
                        item.status === 'completed' ? 'secondary' : 'outline'
                      }>
                        {item.status}
                      </Badge>
                      {item.moderationStatus === 'rejected' && (
                        <Badge 
                          variant="destructive" 
                          className="cursor-help"
                          title={item.rejectionReason || 'Listing rejected by admin'}
                        >
                          Rejected
                        </Badge>
                      )}
                    </div>
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
    </>
  );
}
