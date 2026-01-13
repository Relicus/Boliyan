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
*   **Smart Bidding**: No "Is this available?" spam. Bids only.
*   **Strict Messaging**: Chat unlocks ONLY after a deal is accepted.
*   **Secret Bidding**: Sellers can choose to hide bid amounts.

## Getting Started

### Frontend
```bash
cd apps/web
npm install
npm run dev
```
