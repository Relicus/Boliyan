'use client';

import { useEffect, useState } from 'react';
import { Item } from '@/types';
import ItemCard from '@/components/marketplace/ItemCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Skeleton from '@/components/ui/Skeleton';
import { useSearch } from '@/context/SearchContext';

interface SimilarItemsProps {
    currentItem: Item;
}

export default function SimilarItems({ currentItem }: SimilarItemsProps) {
  const { getSimilarItems } = useSearch();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchSimilar = async () => {
        setLoading(true);
        try {
            const data = await getSimilarItems(currentItem);
            if(mounted) setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            if(mounted) setLoading(false);
        }
    };

    fetchSimilar();
    return () => { mounted = false; };
  }, [currentItem, getSimilarItems]);

  if (items.length === 0 && !loading) return null;

  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-lg text-slate-900">You might also like</h3>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex space-x-4">
            {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="w-[200px] h-[300px] rounded-2xl" />
                ))
            ) : (
                items.map(item => (
                    <div key={item.id} className="w-[240px] shrink-0">
                        {/* 
                          We reuse ItemCard but maybe strip some interactive elements or keep them? 
                          Assuming ItemCard handles size constraints or we wrap in constrained div.
                        */}
                       <ItemCard 
                         item={item} 
                         seller={item.seller!} 
                         viewMode="compact" // Force compact view for similar items
                       />
                    </div>
                ))
            )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
