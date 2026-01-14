# Changelog

All notable changes to the Boliyan project will be documented in this file.

## [0.2.0] - 2026-01-15
### Added
- **Watchlist System**:
    - "Heart" logic: Toggle items to watch list from cards or details.
    - **Auto-Watch**: Placing a bid automatically adds the item to the user's watchlist.
    - **Watchlist Filter**: Dedicated sort/filter mode to view saved items.
- **Bidding UI 2.0 (Victory Experience)**:
    - **Smart Stepper**: Context-aware increment/decrement (100, 500, 1000) based on item price.
    - **Victory Halo**: Dynamic animated border glow (Orange for winning high bidder, Blue for watched/secret items).
    - **Celebration**: Gold/Amber confetti burst on successful bid placement.
    - **Feedback Loops**: Outbid shake animation, price deltas (+/- popups), and "You own this" disabled states.
- **Product Details & Gallery**:
    - Standalone `ProductDetailsModal` component for deep-dive interactions.
    - **Multi-image Gallery**: Infinite scroll gallery with fullscreen immersive view.
    - **Expandable Descriptions**: "More Details" popup for lengthy product copy.
    - **Proximity Logic**: Travel time and distance estimation from buyer to seller.

### Fixed
- **Accessibility**: Added `DialogTitle` to fullscreen galleries for ARIA compliance.
- **Validation**: Strict enforcement preventing users from bidding on their own listings.
- **Consistency**: Unified color palette (Orange for high bidder, Blue for watchlist) across all components.

## [0.1.0] - 2026-01-12
### Added
- **Messaging System**: Post-bid-acceptance chat UI and logic.
- **Marketplace Engine**:
    - Browse listings with infinite scroll (mocked).
    - "Secret" vs "Public" bidding modes.
    - Seller Dashboard for managing active listings.
- **Foundation**:
    - Next.js 16.1 (App Router) + React 19.
    - Tailwind CSS v4 + Shadcn UI components.
    - Database Schema (PostgreSQL/Supabase compatible).
    - Mock Data seeded for 20+ items and 3 users.
