# Wrapper Launch Plan (Waterfall)

Goal: Ship a web-first mobile wrapper with native services (camera, notifications, location, sound), while keeping all UI in the web app and avoiding duplicated screens.

## 0) Platform Choice (Locked)
Wrapper base: Expo WebView.
Release path: EAS Build + EAS Submit for App Store and Play Store.

## 1) Requirements (Freeze Scope)
Core principles:
- Web UI is the source of truth.
- Wrapper only supplies OS services, not UI.
- DRY logic stays in `packages/shared` and `apps/web`.

Must-have native services (v1):
- Push notifications (outbid, deal accepted, message alerts).
- Location access (foreground, user-initiated).
- Camera + photo library for listing uploads.
- Share sheet integration.
- Secure session storage bridge.
- Offline detection + recovery screen.

Out of scope for v1:
- Native UI screens beyond splash/loading/offline/error.
- Background location or geofencing.
- Native payments.

Acceptance criteria:
- Web loads reliably in WebView and preserves full UX parity.
- All must-have services work on iOS and Android.
- Deep links open the correct web route.
- Store review passes by demonstrating native value (camera, notifications, location).

## 2) Design (Architecture + Bridge Contract)
Wrapper architecture:
- WebView shell with minimal native screens: Splash, Loading, Offline, Error.
- JS bridge for native services.
- Unified deep-link router: native -> web route.

Bridge API (single source, no duplicates):
- `native.getLocation()` -> { lat, lng, accuracy, source }
- `native.requestNotificationPermission()` -> { status }
- `native.getPushToken()` -> { token, platform }
- `native.pickImage()` -> { fileUri, mime, size }
- `native.share()` -> { ok }
- `native.getNetworkState()` -> { online }
- `native.playSound(type)` -> { ok }

Data flow:
- Web invokes bridge; wrapper returns payload.
- Web owns all UI and state transitions.
- Wrapper only stores opaque session/token payloads.

## 3) Implementation (Waterfall Phases)

### Phase A: Wrapper Foundation
Deliverables:
- Scaffold `apps/mobile` wrapper (Expo WebView).
- Splash, Loading, Offline, Error screens.
- Universal/deep links wired to web routes.
- App version gating (soft update prompt).

Exit criteria:
- Web loads with safe areas on both OSes.
- Deep links route to correct page.

### Phase B: Session + Security
Deliverables:
- Secure storage bridge for auth persistence.
- Token sync strategy (web -> native -> web).
- Logout and session expiry handling.

Exit criteria:
- User remains signed in across restarts.
- Session invalidation is clean and recoverable.

### Phase C: Native Services (v1)
Deliverables:
- Camera/photo picker bridge to web upload.
- Location bridge + permission flow.
- Push token registration + permission UI.
- Share sheet integration.
- Sound effect bridge (optional, minimal).

Exit criteria:
- Listing image upload works from camera and gallery.
- Location fetch works with permission prompts.
- Push token stored and test push opens correct route.
- Share opens native sheet with correct link.

### Phase D: Performance + Reliability
Deliverables:
- WebView caching strategy and preload of critical routes.
- Network state monitoring with auto-retry.
- Crash/console log capture to remote logging.

Exit criteria:
- Cold start meets target time.
- Offline/online transitions are stable.

## 4) Integration (Web + Wrapper)
Tasks:
- Add feature detection in web to prefer native bridge when available.
- Fallbacks to browser APIs when running in regular web.
- Ensure all user prompts are initiated by user actions.

Exit criteria:
- Web works both inside and outside wrapper.
- No duplicate logic in web for native-only features.

## 5) QA (Full Pass)
Test matrix:
- iOS and Android, fresh install and upgrade.
- Auth flows, listing creation, bidding, notifications.
- Deep links from push and external share.
- Location permission deny/allow cycles.
- Offline retry and recovery.

Exit criteria:
- All must-have services pass on both platforms.
- `just checks` passes.

## 6) Release (Staged Rollout)
Steps:
- Internal build -> TestFlight/Play Internal.
- Limited beta (staff + power users).
- Monitor crash logs and push delivery.
- Public release.

## Risks and Mitigations
- WebView cookie/session issues -> Use secure storage bridge and token refresh.
- File upload failures -> Use native picker + upload resumable fallback.
- Push delivery delays -> Add in-app refresh + badge sync.
- Location accuracy variance -> Use user-initiated GPS with fallback to IP.

## Next Actions
1) Define bridge API in `packages/shared` for typing.
2) Scaffold wrapper and wire deep links + offline screen.
3) Add EAS config for store builds and submissions.
