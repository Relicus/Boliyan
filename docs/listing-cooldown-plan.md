# Listing Cooldown Plan

Goal: New and edited listings should not go live for 1 hour. Edits should be blocked for 1 hour after save, and editing must hard-delete all bids. Pending listings should appear as inactive with a countdown in seller views and offers dashboard, but not in the marketplace until go-live.

## Rules
- New listing: go live after 1 hour.
- Edit listing: block subsequent edits for 1 hour.
- Edit listing: hard-delete all bids on save.
- Marketplace: only show listings where go_live_at <= now().
- Seller surfaces (dashboard + seller listings): show inactive + countdown when go_live_at > now().

## Database
- Add columns to listings:
  - go_live_at TIMESTAMPTZ (default now() + interval '1 hour')
  - last_edited_at TIMESTAMPTZ (nullable)
- Add RPC: edit_listing_with_cooldown
  - Reject if now() < last_edited_at + interval '1 hour'
  - Update listing fields
  - Set last_edited_at = now()
  - Set go_live_at = now() + interval '1 hour'
  - Hard delete bids for listing
- Update marketplace_listings view to include go_live_at.

## App
- Create/Edit form:
  - On edit: call RPC instead of direct update.
  - Warning on save: "Editing resets all bids and relaunches in 1 hour."
  - After save: show note/toast "Goes live in 1 hour."
- Marketplace queries:
  - Filter by go_live_at <= now().
- Dashboard offers (seller):
  - Show inactive badge + countdown when go_live_at > now().
  - Disable bid actions where applicable.
- Seller listing cards:
  - Show inactive badge + countdown.
  - Disable edit button during cooldown and show "Edit available in Xm".

## Types and Transforms
- Add goLiveAt and lastEditedAt to Item / ManagedListing.
- Map go_live_at and last_edited_at in transform logic.

## Touch Points
- packages/database/schema.sql
- packages/database/migrations/* (new migration + RPC)
- packages/database/migrations/20260125_update_marketplace_listings_contact_phone.sql
- apps/web/src/app/list/ListClient.tsx
- apps/web/src/context/MarketplaceContext.tsx
- apps/web/src/app/product/[slug]/page.tsx
- apps/web/src/components/dashboard/ListingOffersCard.tsx
- apps/web/src/components/dashboard/MyListingsTable.tsx
- apps/web/src/components/seller/SellerListingCard.tsx
- apps/web/src/types/index.ts
- apps/web/src/lib/transform.ts

## Pre-flight
- Run: npx tsc --noEmit -p apps/web/tsconfig.json
