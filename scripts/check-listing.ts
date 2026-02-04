
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wxdehgjadxlkhvfwjfxd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HacUQJb7Qh3Y-YoKgdVKjA_kmVgQAMu';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkListing() {
  console.log(`Searching for "apple notifications" in 'listings' table...`);
  
  const { data: tableData, error: tableError } = await supabase
    .from('listings')
    .select('*')
    .ilike('title', '%apple notifications%');

  if (tableError) {
    console.error("Error searching 'listings' table:", tableError);
  } else {
    console.log(`Found ${tableData?.length} matching items in 'listings' table.`);
    if (tableData && tableData.length > 0) {
      const item = tableData[0];
      console.log(`ID: ${item.id}, Status: ${item.status}, Seller ID: ${item.seller_id}`);
      
      // Check for seller profile
      console.log(`Checking for seller profile ${item.seller_id}...`);
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', item.seller_id)
        .single();
      
      if (profileErr) {
        console.error("Error fetching profile:", profileErr);
      } else {
        console.log(`Profile found: ${profile.full_name || 'No Name'}, Verified: ${profile.is_verified}`);
      }
      
      // Check marketplace_listings view
      console.log(`Checking if item appears in 'marketplace_listings' view...`);
      const { data: viewData, error: viewError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', item.id);
      
      if (viewError) {
        console.error("Error searching 'marketplace_listings' view:", viewError);
      } else {
        console.log(`Found ${viewData?.length} matches in 'marketplace_listings' view.`);
        if (viewData && viewData.length > 0) {
          console.log("Item IS visible in the view.");
        } else {
          console.log("!!! Item NOT visible in the view !!!");
        }
      }

      // Count total active items
      console.log("Counting total active items in marketplace_listings...");
      const { count, error: countErr } = await supabase
        .from('marketplace_listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (countErr) {
        console.error("Error counting items:", countErr);
      } else {
        console.log(`Total active items: ${count}`);
      }

      // Check first page (8 items)
      console.log("Checking first page of marketplace items (8 items, created_at DESC)...");
      const { data: firstPage, error: pageErr } = await supabase
        .from('marketplace_listings')
        .select('id, title, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(0, 7);
      
      if (pageErr) {
        console.error("Error fetching first page:", pageErr);
      } else {
        console.log("First page items:");
        firstPage.forEach((p, i) => {
            console.log(`${i+1}. ${p.title} (${p.id}) - Created At: ${p.created_at}`);
            if (p.id === item.id) console.log("   *** TARGET ITEM IS ON FIRST PAGE ***");
        });
      }
    }
  }
}

checkListing().then(() => {
    console.log("Check finished.");
    process.exit(0);
}).catch(err => {
    console.error("Unhandle error:", err);
    process.exit(1);
});
