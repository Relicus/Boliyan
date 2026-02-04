const fs = require('fs');

const url = 'https://wxdehgjadxlkhvfwjfxd.supabase.co/rest/v1/listings';
const apikey = 'sb_publishable_HacUQJb7Qh3Y-YoKgdVKjA_kmVgQAMu';
const data = JSON.parse(fs.readFileSync('batch1_listings.json', 'utf8'));

async function upload() {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`Successfully uploaded ${result.length} listings.`);
  } else {
    const error = await response.text();
    console.error('Upload failed:', response.status, error);
    process.exit(1);
  }
}

upload();
