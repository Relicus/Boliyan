
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wxdehgjadxlkhvfwjfxd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HacUQJb7Qh3Y-YoKgdVKjA_kmVgQAMu';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
  const targetPrefix = '0584109f';
  console.log(`Fetching latest 50 conversations to find prefix ${targetPrefix}...`);

  // Fetch as Service Role? No, I don't have the key. Using Anon key (public).
  // This will fail if RLS is strict and I'm not logged in!!
  // Wait, verify-data.ts is running in Node.js outside the browser context.
  // It has NO SESSION.
  // if RLS is enabled ("Conversations View Policy"), Anon request gets 0 rows.
  
  const { data, error } = await supabase
    .from('conversations')
    .select('id, seller_id, bidder_id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Fetched ${data?.length} rows (as Anon).`);
    if (data) {
        data.forEach(c => {
            console.log(c.id);
            if (c.id.startsWith(targetPrefix)) {
                console.log("!!! FOUND TARGET !!!");
                console.log(c);
            }
        });
    }
    
    // If 0 rows, it confirms RLS is working and blocking public access.
    // Meaning the data might exist but we can't verify it without logging in.
  }
}

verify();
