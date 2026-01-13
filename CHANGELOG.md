# Changelog

All notable changes to the Boliyan project will be documented in this file.

## [Unreleased]
### Planned Features
- **Watchlist**: Ability for users to "heart" items and view them later.
- **Notification Center**: Alerts for outbid status, accepted offers, and new messages.
- **Advanced Filters**: Location radius, price range (min/max), and item condition.
- **Trust Signals**: User verification badges and "Report Item" functionality.

### Changed
- **Messaging Rules**: Chat is now STRICTLY locked until a bid is accepted. No pre-deal messages.

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
