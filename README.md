# Boliyan

**Boliyan** — Speak your price. Seal the deal. No nonsense.

## Overview
A next-generation peer-to-peer marketplace for Pakistan that eliminates the friction of buying and selling used goods.

## Project Structure
```
.
├── apps/
│   └── web/           # Main Marketplace App (Next.js 16)
├── packages/
│   ├── database/      # SQL Schema (Supabase-compatible)
│   └── shared/        # Shared logic (Bidding validation)
└── README.md
```

## Key Features
*   **Smart Bidding 2.0**: No "Is this available?" spam. Bids only, with real-time feedback (Victory Halos & deltas).
*   **Strict Messaging**: Chat unlocks ONLY after a deal is accepted. No pre-deal noise.
*   **Watchlist System**: Save items for later; automatically tracked when you place a bid.
*   **Secret Bidding**: Sellers can choose to hide bid amounts for premium items.
*   **Immersive Gallery**: Immersive, high-performance multi-image viewing with fullscreen capability.

## Getting Started

### Frontend
```bash
cd apps/web
npm install
npm run dev
```
