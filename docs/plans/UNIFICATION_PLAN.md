# UNIFICATION & POLISH PLAN (CURRENT)

Status: Active (post-wrapper release gate)
Last updated: 2026-02-08

This plan reflects the current codebase state and only keeps practical, high-impact work.

Execution order: start this plan after wrapper release-critical work in `wrapper-waterfall-plan.md` Phase A and Phase B.

## 1) What Is Already Unified

- Global tooltip provider is mounted in `apps/web/src/app/layout.tsx`.
- `ItemCard` uses shared primitives (`PriceDisplay`, `BiddingControls`) instead of local duplicated bid UI.
- Marketplace location display now uses listing-first fallback consistently in:
  - `apps/web/src/components/marketplace/ItemCard.tsx`
  - `apps/web/src/components/marketplace/ListingBadges.tsx`
  - `apps/web/src/components/marketplace/product-modal/ProductInfo.tsx`
  - `apps/web/src/app/product/[slug]/ProductPageClient.tsx`
- Search/filter wiring is centralized through marketplace/search contexts and shared fetch transform flow.

## 2) Current Gaps (Practical)

### A. Tooltip provider duplication

- `VerifiedBadge` still wraps itself in a local `TooltipProvider`, while root already provides one.
- Impact: extra provider mounts and avoidable render overhead in repeated badge lists.

### B. Card-system visual drift

- `ItemCard`, `WatchedItemCard`, and `MyBidCard` are close, but not fully aligned in spacing and metadata density.
- Impact: marketplace and dashboard feel less cohesive than intended.

### C. Unused UI baseline still exists

- Ownership moved to `PERFORMANCE_OPTIMIZATION_PLAN.md` Phase C to keep debt cleanup in one place.
- Impact on this plan: card-system polish should consume that output, not duplicate it.

## 3) Next 2 Sprint Plan

### Sprint 1 (Low-risk cleanup)

1. Remove local `TooltipProvider` from `VerifiedBadge` and rely on root provider.
2. Audit seller identity row (name, rating, verified, location) across marketplace and dashboard cards.
3. Keep only one metadata label style token set for compact/comfortable/spacious card modes.

Exit criteria:

- No nested tooltip providers in common badges.
- Desktop + mobile card rows look intentionally consistent, not identical but clearly same system.

### Sprint 2 (System hardening)

1. Add one visual consistency Playwright spec for card metadata rows (desktop + mobile).
2. Document final card-system primitives and allowed variations in `apps/web/src/components/marketplace/AGENTS.md`.
3. Sync any card-system impacts from `PERFORMANCE_OPTIMIZATION_PLAN.md` Phase C debt decisions.

Exit criteria:

- Visual consistency checks prevent unplanned drift.

## 4) Next Session Start Checklist

1. Remove local `TooltipProvider` from `VerifiedBadge` first.
2. Capture desktop and mobile screenshots for `ItemCard`, `WatchedItemCard`, and `MyBidCard` before token alignment.
3. Implement one shared metadata label token set, then run `just checks`.

## 5) Guardrails

- Keep `just checks` green before merges.
- Keep `audit:unused` in the checks pipeline.
- Avoid introducing component-specific styling tokens when shared tokens already exist.
