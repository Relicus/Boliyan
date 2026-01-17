'use client';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, CheckCircle, Trash2 } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { ManagedListing } from '@/types/dashboard';
import { useRouter } from 'next/navigation';

interface ListingActionMenuProps {
  listing: ManagedListing;
}

export function ListingActionMenu({ listing }: ListingActionMenuProps) {
  const { updateListingStatus, deleteListing } = useDashboard();
  const router = useRouter();

  const handleMarkSold = () => {
    updateListingStatus(listing.id, 'completed');
  };

  const handleMarkActive = () => {
    updateListingStatus(listing.id, 'active');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
      deleteListing(listing.id);
    }
  };

  const handleEdit = () => {
    // router.push(`/dashboard/seller/edit/${listing.id}`); // TODO: Implement edit page later
    alert('Edit functionality coming in next phase');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Listing
        </DropdownMenuItem>
        
        {listing.status === 'active' ? (
          <DropdownMenuItem onClick={handleMarkSold}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Mark as Sold
          </DropdownMenuItem>
        ) : (
          listing.status === 'completed' && (
            <DropdownMenuItem onClick={handleMarkActive}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Active
            </DropdownMenuItem>
          )
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
