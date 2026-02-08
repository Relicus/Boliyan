# Boliyan Performance Plan (Current + Practical)

Status: Active (phase-based)
Priority: High
Last updated: 2026-02-08

This document replaces the old long-form plan with the current implementation state and a realistic next sequence.

Execution order: after wrapper release-critical work in `wrapper-waterfall-plan.md` unless an urgent performance regression appears.

## 0) Resume Snapshot (for next session)

- Start with Phase A profiling baseline and capture reproducible numbers before code edits.
- This plan is the canonical owner for `audit:unused` allowlist debt cleanup.
- Unification work should consume outcomes from this plan's Phase C instead of duplicating cleanup tasks.

## 1) Current State (Verified)

### Implemented

- Context providers are largely stabilized with `useCallback`/`useMemo` in:
  - `apps/web/src/context/MarketplaceContext.tsx`
  - `apps/web/src/context/SearchContext.tsx`
  - `apps/web/src/context/ChatContext.tsx`
- Realtime bid visual updates use direct DOM pathway via:
  - `apps/web/src/hooks/useBidRealtime.ts`
  - `apps/web/src/lib/realtime-dom.ts`
- Item card rendering is optimized with shared image component + containment strategy in:
  - `apps/web/src/components/marketplace/ItemCard.tsx`
- Checks pipeline now includes dead-file drift protection (`audit:unused`) in:
  - `apps/web/package.json`

### Not fully solved yet

- `useApp()` compatibility layer is still broad; heavy consumers can re-render on unrelated context changes.
- Some micro-duplication remains in UI wrappers (for example local providers inside repeated badge components).
- There is still an allowlisted set of intentionally unreferenced files; this controlled debt is owned here.

## 2) Performance Objectives (Next)

1. Keep interaction updates visually instant on bidding surfaces.
2. Reduce unnecessary component updates in high-density views (grid, navbar, dashboard cards).
3. Keep codebase lean to prevent regressions from dead component drift.

## 3) Practical 3-Phase Execution

### Phase A: Profiling Baseline (1-2 days)

Tasks:

1. Capture React Profiler traces for:
   - Marketplace initial load
   - Scroll through 30+ cards
   - One realtime bid event
2. Record a simple baseline table in this file:
   - commit hash
   - avg commit duration (ms)
   - notable hot components

Exit criteria:

- Baseline numbers exist and are reproducible.

### Phase B: High-ROI Render Tightening (2-4 days)

Tasks:

1. Remove repeated local providers in hot reusable components where root providers already exist.
2. Move top 3 heavy `useApp()` consumers to narrower context hooks.
3. Verify no functional regressions in bid placement, watchlist, and filtering.

Exit criteria:

- Profiler shows reduced work in at least two hot paths.
- No UX regressions in marketplace and product flows.

### Phase C: Debt Burn-Down (2-3 days)

Tasks:

1. Either integrate or delete allowlisted unreferenced files from `audit-unused-files.mjs`.
2. Add one perf-focused regression test path (smoke-level) to guard card-grid responsiveness.
3. Publish debt decisions back to `UNIFICATION_PLAN.md` when card-system files are affected.

Exit criteria:

- Allowlist count decreases.
- Perf smoke path is automated and green.

## 4) Explicit Non-Goals (For Now)

- No state-management framework migration (no Redux/Zustand rewrite now).
- No full architecture rewrite of `useApp` in one shot.
- No speculative optimization without profiler evidence.

## 5) Verification Commands

- `just lint`
- `just typecheck`
- `npm --prefix apps/web run audit:unused`
- `just build`
- `just checks`

## 6) Next Session Start Checklist

1. Capture and record Phase A profiler baseline table (commit hash + key timings).
2. Pick top 3 heavy `useApp()` consumers from traces before editing.
3. Run `npm --prefix apps/web run audit:unused` and classify each allowlist item as keep/remove/integrate.
