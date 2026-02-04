
const fs = require('fs');
const path = require('path');
const https = require('https');

const batchFiles = [
    'batch1_listings.sql',
    'batch2_listings.sql',
    'batch3_listings.sql',
    'batch4_listings.sql'
];

async function checkUrl(url) {
    return new Promise((resolve) => {
        const cleanUrl = url.split('?')[0]; // Remove query params for cleaner check if needed, but Unsplash needs them for sizing
        https.get(url, (res) => {
            resolve(res.statusCode);
        }).on('error', (e) => {
            resolve(500);
        });
    });
}

async function run() {
    const results = [];
    for (const file of batchFiles) {
        const filePath = path.join('d:\\VSCode\\Boliyan', file);
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple regex to extract titles and image arrays
        // Note: This is an approximation for auditing
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('(') && line.includes('ARRAY[')) {
                // Matches ('seller_id', 'title', 'description', asked_price, 'category', ARRAY['image_url']
                const matches = line.match(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*ARRAY\['([^']+)'/);
                
                if (matches) {
                    results.push({
                        file,
                        title: matches[2],
                        image: matches[6]
                    });
                }
            }
        }
    }

    console.log(`Checking ${results.length} listing images...\n`);
    
    for (const item of results) {
        const status = await checkUrl(item.image);
        console.log(`[${status}] ${item.title.padEnd(40)} | ${item.image}`);
    }
}

run();
