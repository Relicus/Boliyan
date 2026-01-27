# Anti-Bypass Hardening Plan (Supabase + App)

Status: Draft for execution
Owner: Engineering
Last updated: 2026-01-27

This document is the single source of truth for anti-bypass hardening. Sub-agents should append updates in the "Agent Work Log" section and keep changes minimal, DRY, and consistent with the plan.

## Principles (Non-Negotiable)
- Database is the source of truth; UI checks are advisory only.
- RLS is deny-by-default; policies are explicit allow-lists.
- Every critical action is a single server-side transaction (RPC).
- Fewer surfaces: remove duplicate write paths.

## Scope and Priority
1) Bid placement / update
2) Deal acceptance (conversation creation)
3) Messaging (post-accept only)
4) Listing create / edit / cancel
5) Watchlist & notifications

## Current State (Repo Scan)
- Listings RLS: enabled; public SELECT; seller insert/update/delete.
- Bids RLS: enabled; user SELECT; seller SELECT; public SELECT for visible bids; user insert/update.
- Reviews: public SELECT; user insert; no updates/deletes (immutable).
- Notifications: RLS enabled; user SELECT/UPDATE; service insert; no delete.
- Conversations: policies exist; RLS enabled; no DELETE policy.
- Messages: policies exist; RLS enable missing; no UPDATE/DELETE.
- Watchlist: RLS enabled; select/insert/delete policies.
 - App-side RPC: only `edit_listing_with_cooldown`; no RPCs for bids/acceptance/messages.

## Gaps and Risks
- Messages table lacks `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- No explicit DELETE policies on sensitive tables (conversations/notifications/messages).
- App performs direct table writes in browser via supabase client.
- No RPC-only gate for bids/acceptance (client bypass risk).
- Marketplace listing visibility not enforced at DB layer for `status` and `go_live_at`.
 - Listings public read policy uses `USING (true)` with no status/visibility filters.
 - Bids public read policy does not enforce listing status/live state.
 - Bids update policy allows bidder updates regardless of bid status.
 - Notifications insert policy is `WITH CHECK (true)` (too permissive without role gating).
 - RLS enablement for some tables exists only in migrations (not in `schema.sql`).

## Target Architecture
Client (untrusted) -> RPC (security definer) -> DB (RLS + constraints + triggers)
Only RPC performs sensitive state transitions.

## Plan by Layer

### A) Database Hardening (Supabase SQL)
1) Enable/confirm RLS on all user-content tables
   - Ensure RLS enabled for: messages, conversations, bids, listings, watchlist, notifications, reviews, profiles (if needed).
2) Tighten SELECT policies
   - Marketplace listings: only `status = 'active'` AND `go_live_at <= now()`.
   - Bids: public visibility only when listing `auction_mode = 'visible'` AND listing is active and live.
3) Deny-by-default on writes
   - Explicit INSERT/UPDATE/DELETE policies per table.
   - If delete is not needed, do not add policy (implicit deny).
4) Enforce invariants with constraints/triggers
   - Bidder != seller; listing active; listing live; not expired.
   - Bid amount within allowed range; higher than current high where applicable.
5) Move sensitive actions to RPC (security definer)
   - `place_bid(listing_id, amount, message)`
   - `accept_bid(listing_id, bid_id)` (creates conversation)
   - `send_message(conversation_id, content)`
6) Use views for safe projection
   - Ensure all views are `security_invoker = true`.
   - Remove sensitive fields (e.g., contact_phone) from public views.

### B) App Hardening (Next.js)
1) Replace direct table writes with RPC calls
   - Bidding, accept, messaging, listing edits.
2) Keep UI validation for UX only
   - Never treat client checks as authoritative.
3) Standardize server-check UX
   - Use brand loader for RPC in-progress state.
4) Error mapping
   - Map DB errors to stable user-facing states.

### C) Observability + Protection
1) Add audit table for critical actions
   - Log actor, action, target, time, and metadata.
2) Rate limiting
   - Edge or DB-level to prevent spam.

## Execution Order
1) Enable missing RLS and add missing policies (messages/conversations).
2) Read-side tightening (marketplace listings visibility).
3) Introduce RPC for bids; switch app to RPC.
4) RPC for accept + messaging.
5) Remove or restrict direct table writes.

## Deliverables
- SQL migrations in `packages/database/migrations` for RLS/policies/triggers/functions.
- App updates replacing direct writes with RPC calls.
- Minimal UX updates for loader states.

## Verification
- RLS tests: attempt forbidden actions via SQL directly.
- App tests: simulate client-side bypass attempts.
- Pre-flight: `npx tsc --noEmit -p apps/web/tsconfig.json`.

## Agent Work Log
Append-only notes for sub-agents. Keep entries short.

### 2026-01-27
- Created plan draft and baseline scan summary.
- Delegated scans completed: RLS gaps, direct writes, and RPC inventory.
- Added bid_attempts_count to listing_bid_stats and marketplace_listings (attempts vs unique bidders).
- Added RPCs for listings create/edit/status/delete to remove client-side table writes.
