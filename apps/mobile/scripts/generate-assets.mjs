/**
 * Generate PNG app icon and splash screen assets from the SVG logo.
 *
 * Usage:  node scripts/generate-assets.mjs
 *
 * Produces:
 *   assets/icon.png          (1024×1024, for iOS App Store)
 *   assets/adaptive-icon.png (1024×1024, foreground for Android adaptive icon)
 *   assets/splash-icon.png   (512×512, centered on splash via Expo config)
 *
 * Requirements: sharp  (npm install --save-dev sharp)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = join(ROOT, 'assets');
const SVG_SOURCE = join(ROOT, '..', '..', 'apps', 'web', 'public', 'logo.svg');

const BG_COLOR = '#ffffff';
const BRAND_BLUE = '#2563eb';

function buildIconSvg(size) {
  // Render the Ba logomark centered on a rounded-rect background
  const padding = Math.round(size * 0.15);
  const logoSize = size - padding * 2;
  const scale = logoSize / 40; // original viewBox is 40×40
  const tx = padding;
  const ty = padding;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${BG_COLOR}"/>
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    <path d="M32,10 C32,20 28,26 16,26 C12,26 8,24 8,24"
      stroke="${BRAND_BLUE}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="18" cy="36" r="4" fill="${BRAND_BLUE}"/>
  </g>
</svg>`;
}

function buildAdaptiveIconSvg(size) {
  // Foreground only — transparent background, logo in center safe zone (66%)
  const safeZone = Math.round(size * 0.66);
  const offset = Math.round((size - safeZone) / 2);
  const scale = safeZone / 40;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path d="M32,10 C32,20 28,26 16,26 C12,26 8,24 8,24"
      stroke="${BRAND_BLUE}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="18" cy="36" r="4" fill="${BRAND_BLUE}"/>
  </g>
</svg>`;
}

function buildSplashIconSvg(size) {
  // Just the logomark on transparent, for Expo splash resizeMode: 'contain'
  const scale = size / 40;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(${scale})">
    <path d="M32,10 C32,20 28,26 16,26 C12,26 8,24 8,24"
      stroke="${BRAND_BLUE}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="18" cy="36" r="4" fill="${BRAND_BLUE}"/>
  </g>
</svg>`;
}

async function renderSvgToPng(svgString, outputPath, size) {
  const sharp = (await import('sharp')).default;

  const png = await sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toBuffer();

  await writeFile(outputPath, png);
  console.log(`✓ ${outputPath} (${size}×${size})`);
}

async function main() {
  await mkdir(ASSETS_DIR, { recursive: true });

  // 1. App icon (1024×1024) — with dark rounded background
  await renderSvgToPng(
    buildIconSvg(1024),
    join(ASSETS_DIR, 'icon.png'),
    1024
  );

  // 2. Adaptive icon foreground (1024×1024) — transparent bg, centered mark
  await renderSvgToPng(
    buildAdaptiveIconSvg(1024),
    join(ASSETS_DIR, 'adaptive-icon.png'),
    1024
  );

  // 3. Splash icon (512×512) — logomark only, Expo handles centering
  await renderSvgToPng(
    buildSplashIconSvg(512),
    join(ASSETS_DIR, 'splash-icon.png'),
    512
  );

  console.log('\nDone! Assets written to apps/mobile/assets/');
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
