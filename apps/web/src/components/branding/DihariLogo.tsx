/**
 * Dihari Logomark Component (Spare)
 * 
 * This is the finalized Dihari logo design featuring:
 * - Boliyan Arch (Ba-style curve)
 * - 'Arda' (b-shape) glyph on top
 * - Amber/Orange hover colors
 * - Bilingual wordmark: دہاڑی / DIHARI
 * 
 * Usage: Import and replace the Boliyan logo section in Navbar.tsx
 */

import React from 'react';

export const DihariLogomark = () => (
  <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0 transition-all duration-300 group-hover:drop-shadow-md">
    {/* Boliyan Arch (Ba-style) */}
    <path
      d="M32,12 C32,22 28,28 16,28 C12,28 8,26 8,26"
      stroke="currentColor"
      strokeWidth="7"
      fill="none"
      strokeLinecap="round"
      className="transition-all duration-300 text-slate-800 group-hover:text-amber-500"
    />
    {/* 'Arda' Glyph - User's exact SVG */}
    <g transform="translate(14, 2) scale(0.22)">
      <path
        d="M66.24,48.21a15.18,15.18,0,0,0-8.6-9.5c-7.25-2.38-13.9-.91-20.53,2.43L35.53,42c0-1,0-2,0-3s0-2.84,0-3.91c0-1.5,0-3.67-.19-6.43a3.7,3.7,0,0,0-1.33-1.27,6.08,6.08,0,0,0-2.49-.46c-.77-.05-1.34-.09-2.3-.07-2.16,0-3.24,0-4.36.53A6.51,6.51,0,0,0,23,28.69a37.41,37.41,0,0,0-1.42,9.15c0,.29,0,1.67,0,4.43l0,6.51c0,.21,0,.57,0,1,0,1.24-.08,2.25-.16,3.19-.13,1.47-.44,4.71-.93,9-.44-.1-3.73-.81-5.86,1.24a4.91,4.91,0,0,0-1.06,1.48,13.88,13.88,0,0,0-.66,2.9,8.23,8.23,0,0,0,.64,5.25,5.9,5.9,0,0,0,1.52,1.73,22.79,22.79,0,0,0,2.4.72c2.3.56,3.56.41,9,.65,2.38.11,4.78.16,7.2.17l3.16,0,3.23,0h3.11c7.72,0,14.3-2.33,20-7.75a24.59,24.59,0,0,0,3-20.19ZM54.62,55.92a2.83,2.83,0,0,1-.92,1.58,17.35,17.35,0,0,1-5.54,3.31c-1.06.33-1.37.68-5.68,1-2.07.14-3.74.27-4.79.35a1.49,1.49,0,0,1-1.23-2.29,23.82,23.82,0,0,1,5.24-6l1.81-1.51a9.52,9.52,0,0,1,3.58-1.84c.32-.07,4.06-.93,6.26,1.42C53.44,52,55.15,53.88,54.62,55.92Z"
        transform="translate(-12.8, -26.84)"
        className="transition-all duration-300 fill-slate-800 group-hover:fill-amber-500"
      />
    </g>
  </svg>
);

export const DihariWordmark = () => (
  <div className="flex flex-col items-center justify-center gap-0 py-0.5">
    <span className="text-2xl font-black mb-[-2px] transition-all duration-300 font-[family-name:var(--font-noto-urdu)] bg-clip-text text-transparent bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 group-hover:from-amber-600 group-hover:via-amber-500 group-hover:to-orange-600">
      دہاڑی
    </span>
    <span className="text-[10px] font-bold tracking-[0.4em] uppercase transition-all duration-300 font-[family-name:var(--font-outfit)] bg-clip-text text-transparent bg-gradient-to-br from-slate-600 to-slate-400 group-hover:from-amber-400 group-hover:to-amber-200">
      Dihari
    </span>
  </div>
);

export default DihariLogomark;
