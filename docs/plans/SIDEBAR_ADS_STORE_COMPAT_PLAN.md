# Sidebar Ads + Store Compatibility Plan

> Status: Parked (foundation exists, monetization rollout intentionally deferred)
> Scope lock: Sidebar ads only (desktop web), no listing/in-feed changes
> Last updated: 2026-02-08

## 1) Goals

- Increase monetization from the left sidebar without harming marketplace trust.
- Keep ad fatigue controlled with strict slot and session pacing.
- Keep server telemetry consolidated (aggregate-first, not raw event firehose).
- Keep App Store and Play Store compliance clear for future mobile ad rollout.

## 2) Non-goals

- No changes to listing feed ad logic in `apps/web/src/components/marketplace/MarketplaceGrid.tsx`.
- No native mobile ad integration in this phase.
- No force move to auto ads.

## 3) Current Baseline

- Sidebar pacing exists in `apps/web/src/components/layout/Sidebar.tsx` with balanced caps.
- Sidebar ad component exists in `apps/web/src/components/ads/BannerAd.tsx`.
- Mobile app is a WebView wrapper in `apps/mobile/App.tsx`.
- Desktop sidebar is hidden on mobile breakpoints (`lg` only), so current sidebar ads are web-desktop focused.

## 3.1) Practical Rollout Decision (Current)

This track is intentionally paused until two gates are met:

1. Product stability gate: marketplace/discovery core flows remain stable over the last release window.
2. Measurement gate: ad telemetry ingest and daily rollup are in place before enabling paid provider traffic.

Reason: revenue tests without stable telemetry create noise and can hurt UX without clear decision data.

## 4) Architecture Decision (Locked)

Use a hybrid control model:

- Client controls ad pressure: slot count, reveal timing, session cap.
- Ad provider controls fill/auction: which ad appears in each slot.
- Server stores daily consolidated counters for analysis.

ASCII flow:

```text
Sidebar slots (client) -> provider fill (AdSense/other) -> batched counters -> daily rollup table
```

## 5) Phase Plan

Current status by phase:

- Phase A (Sidebar Slot System): mostly done
- Phase B (Provider Adapter): not started
- Phase C (Script + Compliance Surface): not started
- Phase D (Consolidated Telemetry): not started
- Phase E (Policy Controls): optional, not started

### Phase A - Sidebar Slot System (Web)

Objective: keep current balanced pacing and hard caps.

Tasks:

1. Keep max visible slots at 3 and session load cap at 5 in `apps/web/src/components/layout/Sidebar.tsx`.
2. Keep progressive reveal (slot 1 immediate, slot 2 and 3 via intersection triggers).
3. Keep slot IDs stable for QA and analytics mapping:
   - `banner-ad-sidebar-1`
   - `banner-ad-sidebar-2`
   - `banner-ad-sidebar-3`
4. Keep explicit sponsored labeling in each slot container.

Acceptance:

- Sidebar never exceeds 3 visible ads.
- A session never loads more than 5 sidebar ad loads.
- Listing/in-feed ad behavior is unchanged.

### Phase B - Provider Adapter (Web)

Objective: make ad source swappable without touching sidebar logic.

Tasks:

1. Refactor `apps/web/src/components/ads/BannerAd.tsx` to a provider adapter:
   - input: `placement`, `slotIndex`, `provider`, `fallback`.
   - output: one unified slot shell.
2. Add provider config source (env-backed):
   - `NEXT_PUBLIC_AD_PROVIDER`
   - `NEXT_PUBLIC_ADSENSE_CLIENT`
   - `NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_1`
   - `NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_2`
   - `NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_3`
3. Keep fallback path when provider has no fill.

Acceptance:

- Switching provider requires config change, not sidebar rewrites.
- Slot 1/2/3 map to distinct unit IDs.

### Phase C - Script + Compliance Surface (Web)

Objective: deterministic ad script behavior and clear disclosure.

Tasks:

1. Load provider script centrally in `apps/web/src/app/layout.tsx`.
2. Ensure script loads only when provider is enabled.
3. Ensure all ad slots are clearly labeled as sponsored/advertisement.
4. Avoid deceptive placement near tap-critical controls.

Acceptance:

- Script loading is predictable and can be disabled by config.
- All slots are visibly disclosed.

### Phase D - Consolidated Telemetry (Server + DB)

Objective: useful performance signals without high-volume raw logging.

Tasks:

1. Add ingest route: `apps/web/src/app/api/ads/telemetry/route.ts`.
2. Ingest only batched counters (no per-scroll writes).
3. Add aggregate table in `packages/database/schema.sql`:
   - `ad_metrics_daily`
   - dimensions: `metric_date`, `placement`, `slot`, `provider`, `device`
   - counters: `slot_rendered`, `slot_viewable`, `slot_clicked`, `fallback_rendered`, `sessions`
4. Upsert by unique key (date + dimensions).
5. Regenerate/update DB types in `apps/web/src/types/database.types.ts` after schema change.

Acceptance:

- Telemetry write volume scales by aggregate buckets, not user events.
- No user-level event stream is required for core decisions.

### Phase E - Policy Controls (Optional, Recommended)

Objective: tune ad pressure without redeploying.

Tasks:

1. Add policy table (or config endpoint) for runtime knobs:
   - `max_visible_slots`
   - `max_session_loads`
   - reveal thresholds
2. Client reads policy with sane defaults.
3. Keep local fallback policy if fetch fails.

Acceptance:

- Product can tune ad pressure safely from one place.

## 6) Mobile Store Compatibility Track (Future)

Current phase (sidebar-only) is store-safe because it is desktop web focused.

If mobile in-app ads are enabled later, use a dedicated mobile track:

1. Integrate AdMob/Ad Manager mobile path in `apps/mobile` (not plain web tag drop-in).
2. Add ATT flow for iOS when tracking/personalization applies.
3. Update Play Data Safety for SDK data handling.
4. Add AD_ID declaration only when required by chosen Android ad SDK.
5. Ensure privacy disclosure and user controls match actual data behavior.

## 7) KPI Framework (Week 1 Decision Gates)

Compare slot depth performance:

- Slot 1 baseline, Slot 2 delta, Slot 3 marginal lift.
- If Slot 3 underperforms materially and hurts engagement, remove Slot 3.
- If Slot 2/3 add clean lift with stable engagement, keep balanced policy.

Core metrics:

- Viewable rate per slot
- CTR per slot
- Revenue/RPM by slot unit
- Session depth vs ad exposure

## 8) Rollout Strategy

1. Internal release with provider disabled (UI shell only).
2. Enable provider for low traffic cohort.
3. Monitor first 72 hours for UX and policy anomalies.
4. Ramp gradually to full web traffic.
5. Keep one kill switch (`NEXT_PUBLIC_AD_PROVIDER=none`).

## 9) QA Checklist

- Desktop only: sidebar slots do not leak into mobile layouts.
- Slot sequencing is correct and capped.
- Session cap persists across route changes in same tab/session.
- Fallback displays when provider has no fill.
- Sponsored disclosure is always visible.
- Telemetry batches flush on pagehide/navigation.

## 10) Risks and Mitigations

- Risk: ad fatigue from repeated creatives.
  - Mitigation: strict cap, provider rotation, depth-based review.
- Risk: policy violations from unclear ad labeling.
  - Mitigation: explicit sponsored labels and placement review.
- Risk: telemetry overload.
  - Mitigation: aggregate-only upserts, batched client payloads.
- Risk: store review confusion for mobile ads.
  - Mitigation: separate mobile integration track with ATT/Data Safety checklist.

## 11) Implementation Command Checklist

- `just lint`
- `just typecheck`
- `just build`
- `just checks`

If any mobile files are changed in the future mobile ads track:

- Confirm mobile wrapper compiles (`just mobile` / platform build check)
