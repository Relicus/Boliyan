"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { mockItems, mockUsers, mockBids } from "@/lib/mock-data";

export function MigrateButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string>('');

  const runMigration = async () => {
    if (!confirm("This will insert ALL mock data into Supabase. Proceed?")) return;
    
    setStatus('loading');
    setLog('Starting migration...');

    try {
      // 1. Insert Users (Profiles)
      // Note: We need to insert into auth.users first ideally, but for now we rely on the trick 
      // where we insert into 'profiles' and hope RLS/Foreign Keys don't block us OR 
      // we assume the user has run a script to disable triggers.
      // BUT WAIT: The user had Foreign Key issues earlier.
      // Strategy: We will try to INSERT into profiles. 
      // If it fails due to FK, we can't do much from client-side without Admin Auth.
      // HOWEVER: The user manually inserted a dummy user earlier.
      // For this script to work fully, we might need to skip the Auth table constraint or 
      // we just try our best.
      // Actually, for "mock" data, we can define the IDs.
      // Let's try to insert profiles. If it fails, we log it.
      
      const profiles = mockUsers.map(u => ({
        id: u.id, // These are like "u1", "u2". DB expects UUID. 
        // CRITICAL: Supabase IDs must be UUIDs. "u1" will fail validation if column is UUID.
        // Let's check schema.sql... YES, id is UUID.
        // We must GENERATE UUIDs for these mock users to map them map them.
        // Or we just use a consistent UUID based on the ID?
        // Simple hack: "00000000-0000-0000-0000-00000000000" + digit
        // u1 -> ...001
        full_name: u.name,
        avatar_url: u.avatar,
        location: u.location?.address || 'Unknown',
        rating: u.rating,
        rating_count: u.reviewCount
      }));

      // Helper to convert "u1" to UUID
      const toUUID = (shortId: string) => {
        // pad with zeros: u1 -> 00000000-0000-0000-0000-000000000001
        if (shortId.length > 30) return shortId; // already uuid likely
        const num = shortId.replace(/\D/g, '');
        return `00000000-0000-0000-0000-00000000000${num}`.slice(-12).padStart(36, '00000000-0000-0000-0000-');
      };

      // Fix IDs in memory
      const uuidMap: Record<string, string> = {};
      profiles.forEach(p => {
          const oldId = p.id;
          const newId = `00000000-0000-0000-0000-00000000000${oldId.replace(/\D/g, '')}`; 
          uuidMap[oldId] = newId;
          p.id = newId;
      });

      // We encounter the Auth FK issue again. 
      // Client cannot insert into auth.users. 
      // Workaround: We will skip creating profiles if they don't exist?
      // No, we need profiles for Foreign Keys in Listings.
      // Solution: The user must run a SQL script to generate these Auth users?
      // OR: We catch the error and tell the user "Please run this SQL to create Auth users first".
      
      // Let's try inserting Profiles. If it fails, report it.
      const { error: profileError } = await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });
      if (profileError) {
          console.error("Profile Upload Error (Likely Auth FK)", profileError);
          setLog(prev => prev + `\n\n⚠️ Profile Error: ${profileError.message}\n(You might need to create auth users via SQL first)`);
      } else {
          setLog(prev => prev + `\n✅ Profiles upserted.`);
      }

      // 2. Insert Listings
      const listings = mockItems.map(item => ({
        // id: item.id, // "i1" -> UUID?
        // listing IDs can be anything, they are Primary Keys.
        // Let's rely on DB generating them? No, we want to keep relationships with Bids maybe?
        // Actually mock bids reference mock item IDs. So we should preserve mapping if possible.
        // But mock item IDs are "i1". UUID only accepts hex. 
        // We will generate new UUIDs for items and map them for Bids.
        
        seller_id: uuidMap[item.sellerId] || item.sellerId, // Map "u1" -> UUID
        title: item.title,
        description: item.description,
        asked_price: item.askPrice,
        category: item.category,
        images: item.images, // Array of strings (URLs)
        auction_mode: item.isPublicBid ? 'visible' : 'hidden',
        status: 'active',
        created_at: item.createdAt || new Date().toISOString()
      }));

      // listings don't have UUIDs in the mock objects that satisfy Postgres UUID, so we can't force them easily unless we map "i1" -> UUID.
      // Let's do the mapping "i1" -> UUID strategy again.
       const itemUuidMap: Record<string, string> = {};
       const listedRows = listings.map((l, idx) => {
           const oldId = mockItems[idx].id;
           const newId = `00000000-0000-0000-0000-${`00000000000${idx + 1}`.slice(-12)}`; // i1 -> ...001
           itemUuidMap[oldId] = newId;
           return { ...l, id: newId };
       });

      const { error: listingError } = await supabase.from('listings').upsert(listedRows, { onConflict: 'id' });
      
      if (listingError) {
           throw listingError;
      }
      setLog(prev => prev + `\n✅ Listings upserted.`);

      // 3. Insert Bids
      const bids = mockBids.map((b, idx) => ({
          id: `00000000-0000-0000-0000-${`00000000000${idx + 1}`.slice(-12)}`, // Generate UUID
          listing_id: itemUuidMap[b.itemId], // Map i1 -> UUID
          bidder_id: uuidMap[b.bidderId], // Map u2 -> UUID
          amount: b.amount,
          status: b.status,
          created_at: b.createdAt
      })).filter(b => b.listing_id && b.bidder_id); // Ensure we have valid FKs

      const { error: bidError } = await supabase.from('bids').upsert(bids, { onConflict: 'id' });
      if (bidError) {
          console.error(bidError);
          setLog(prev => prev + `\n⚠️ Bid Error: ${bidError.message}`);
      } else {
          setLog(prev => prev + `\n✅ Bids upserted.`);
      }

      setStatus('success');
      setLog(prev => prev + `\n🎉 Migration Done! Refresh page.`);

    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setLog(prev => prev + `\n❌ Critical Error: ${e.message}`);
    }
  };

  if (status === 'success') return null; // Hide on success

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/90 text-white rounded-lg border border-orange-500 shadow-xl max-w-sm">
      <h3 className="font-bold text-orange-500 mb-2">⚡ Data Migration</h3>
      <p className="text-xs text-gray-400 mb-3">Sync local mock-data.ts to real Database.</p>
      
      {status === 'idle' && (
        <button 
          onClick={runMigration}
          className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-bold transition-colors"
        >
          Run Migration
        </button>
      )}

      {status === 'loading' && (
        <div className="text-xs animate-pulse">Processing... Check Console...</div>
      )}

      {status === 'error' && (
        <div className="text-xs text-red-500 mt-2 whitespace-pre-wrap">{log}</div>
      )}
      
      {log && status !== 'error' && <div className="text-[10px] mt-2 text-gray-500 whitespace-pre-wrap font-mono">{log}</div>}
    </div>
  );
}
