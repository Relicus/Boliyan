# Mobile Wrapper Plan (Current State + Practical Next Steps)

Status: Active (release-critical)
Last updated: 2026-02-08

Goal: keep a web-first mobile wrapper while shipping only native value that materially improves core flows.

Execution order: this plan takes precedence over polish/performance and ad rollout plans.

## 0) Resume Snapshot (for next session)

### Done

- Expo WebView shell and bridge architecture are in place.
- Core native bridge handlers are implemented for location, images, share, network, haptics, secure storage, push permission/token, and Google sign-in.
- Wrapper shell states (loading/offline/error/update) are already shipped.

### Open release-critical gaps

1. Web auth persistence still follows browser storage path; secure-store hydration on web side is not active.
2. Push lifecycle is incomplete end-to-end (backend registration, refresh handling, revocation, and delivery verification).
3. Release config is not fully locked (build-time env validation and production store URLs).
4. Runtime observability remains minimal (console-forwarding only).

### Deferred unless required by launch scope

- `playSound` bridge remains a no-op; keep deferred or explicitly remove from v1 bridge surface.

## 1) Current Reality

### Already shipped in `apps/mobile`

- Expo WebView shell with deep-link handling and internal/external URL routing.
- Native shell states: loading, offline, error, and update gating.
- JS bridge contract wired through `packages/shared/nativeBridge` and mobile bridge handlers.
- Native bridges implemented for:
  - location
  - image pick/camera
  - share
  - network state
  - haptics
  - secure storage get/set/remove
  - push permission + Expo token
  - Google sign-in token flow

### What is still incomplete from product perspective

- Web auth persistence still uses browser storage path; secure-store hydration on web side is not active.
- Push token lifecycle is not fully productized end-to-end (token registration, refresh, revocation, observability).
- Crash/reporting instrumentation is still basic (console forwarding only).
- Release plumbing still needs hardening (env gate checks + production update/store URLs).

## 2) Scope Lock (Near-term)

Keep this strict for next cycle:

- No native duplicate feature screens.
- No native payment integration.
- No background location/geofencing.
- No broad architecture changes to web state for mobile-only concerns.

## 3) Practical Delivery Plan

### Phase A: Auth Persistence + Release Config Hardening (Highest Priority)

Tasks:

1. Reconnect web-side secure session hydration path using native bridge methods.
2. Lock release env contract (`EXPO_EAS_PROJECT_ID`, `EXPO_PUBLIC_WEB_ORIGIN`, link scheme) and document fail-fast checks.
3. Replace placeholder app-store update URLs with final production values.
4. Validate sign-in persistence across app restart (iOS + Android).
5. Validate logout/session expiry behavior and stale token recovery.

Exit criteria:

- Session survives restart on device builds.
- Logout and expired sessions recover without manual storage cleanup.
- Build and update URLs are deterministic and environment-complete.

### Phase B: Push Lifecycle Completion

Tasks:

1. Add backend token registration flow with user binding and de-dup semantics.
2. Add token refresh/update and revocation/unregister path.
3. Add notification deep-link routing verification for:
   - outbid
   - deal accepted
   - new message
4. Add lightweight observability for token registration and push open-route success.

Exit criteria:

- Push opens the expected web route reliably on both platforms.
- Token lifecycle remains correct across re-login and app reinstall scenarios.

### Phase C: Reliability and Operations

Tasks:

1. Add lightweight crash/event logging endpoint for wrapper runtime issues.
2. Add release checklist for `eas build` and `eas submit` with env and store metadata validation.
3. Add one smoke script for wrapper startup + bridge sanity checks.
4. Lock `playSound` decision (remove from v1 contract or implement minimal real behavior).

Exit criteria:

- Build-time and runtime failures are diagnosable without device-side guesswork.
- Bridge surface is explicit (no ambiguous stub behavior for release scope).

## 4) QA Matrix (Minimum)

- Fresh install + login
- App restart + retained session
- Logout + login + retained session
- Listing image upload via camera and gallery
- Location permission deny/allow path
- Push permission deny/allow + push open to route
- Offline recovery + retry
- External link open behavior

## 5) Command Checklist

- `npx expo config --type public` (from `apps/mobile`, verify env injection)
- `just mobile`
- `just mobile-android` or platform build equivalent
- `just typecheck` (web baseline integrity)
- `just checks` (web quality gate)

## 6) Next Session Start Checklist

1. Confirm Phase A env and URL locks first.
2. Finish secure-store session hydration and rerun restart QA.
3. Start backend token registration path for Phase B before touching notification UX polish.
