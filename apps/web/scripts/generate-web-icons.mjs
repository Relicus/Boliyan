/**
 * Generate web manifest PNG icons from the SVG logo.
 * Usage: node scripts/generate-web-icons.mjs
 */

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB_DIR = join(__dirname, '..', 'public');

const BRAND_BLUE = '#2563eb';
const BG = '#ffffff';

function buildIconSvg(size) {
  const pad = Math.round(size * 0.12);
  const logoSize = size - pad * 2;
  const scale = logoSize / 40;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${BG}"/>
  <g transform="translate(${pad}, ${pad}) scale(${scale})">
    <path d="M32,10 C32,20 28,26 16,26 C12,26 8,24 8,24"
      stroke="${BRAND_BLUE}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="18" cy="36" r="4" fill="${BRAND_BLUE}"/>
  </g>
</svg>`;
}

async function main() {
  const sharp = (await import('sharp')).default;
  const sizes = [192, 512];

  for (const s of sizes) {
    const svg = buildIconSvg(s);
    const png = await sharp(Buffer.from(svg)).resize(s, s).png().toBuffer();
    const out = join(PUB_DIR, `icon-${s}.png`);
    await writeFile(out, png);
    console.log(`✓ ${out} (${s}×${s})`);
  }

  console.log('\nDone! Web icons written to apps/web/public/');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
