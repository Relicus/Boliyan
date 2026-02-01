# Mobile App Roadmap (Multi-Level MVPs)

Goal: Build a proper native app (React Native + Expo + NativeWind) that matches the web responsive UI through a shared visual system, with platform comfort overrides only where iOS/Android require it.

## Principles
- Single Source of Truth (SSoT) for design tokens and UI primitives.
- DRY business logic via `packages/shared` (rules, types, constants).
- Platform comfort over pixel parity: same intent, minimal OS-specific overrides.
- Each MVP is independently shippable and visually testable.

## SSoT Scope (Must Live Here)
- Design tokens: colors, spacing, radii, typography scale, shadows, motion timings.
- UI primitives: Button, Card, Badge, Input, Section, ListRow, Sheet.
- Interaction states: loading, disabled, error, empty, success.
- Content rules: truncation, pricing format, empty-state copy.

## Visual Parity Contract
- Any UI change starts in tokens or primitives.
- If a screen cannot be built using shared primitives + tokens, log a parity gap and resolve before release.
- Platform overrides allowed only with documented OS rationale (font, shadow, safe areas).

## MVP 0: Foundation (Ship-Ready Skeleton)
Scope:
- Create `packages/design-tokens` (SSoT) and wire it into web.
- Create `apps/mobile` (Expo) and shared pathing to `packages/shared`.
- Configure NativeWind to consume shared design tokens.
- Build the UI primitives (Button, Card, Badge, Input, Section, ListRow, Sheet).
- Establish navigation shell (tabs + stack) and empty screens.

Visual Checks:
- Token parity: compare web vs mobile for color, spacing, radii, type scale.
- Component kit parity: side-by-side screenshots for each primitive.

Exit Criteria:
- Primitives implemented with IDs and shared tokens.
- Basic nav works on iOS + Android simulators.

## MVP 1: Core Buyer Flow (Minimal Marketplace)
Scope:
- Home feed (listings), Item detail, Place bid, Watchlist.
- Data via shared API client; use shared rules/constants.
- Motion: minimal transitions for card open and bid confirmation.

Visual Checks:
- Home and Item detail match web mobile layout intent.
- Bid flow: field spacing, states, error messages match web rules.

Exit Criteria:
- Buyer can discover, view, and place a bid.
- Watchlist add/remove works with correct states.

## MVP 2: Seller Essentials
Scope:
- My Listings list, Listing detail, basic edit (title, price, status).
- Seller analytics badges (views, bids) using shared components.

Visual Checks:
- Seller list row density matches web mobile intent.
- Status and analytics badges consistent with tokens.

Exit Criteria:
- Seller can review listings and update key fields.

## MVP 3: Deal Flow + Notifications
Scope:
- Deal acceptance flow (no chat before deal).
- Notification center + push notification wiring (outbid, accepted, message alerts).

Visual Checks:
- Notification UI matches web mobile hierarchy.
- Deal acceptance flow uses shared status components.

Exit Criteria:
- Notifications show correct states and deep link to item.
- Deal acceptance completes end-to-end.

## MVP 4: Discovery & Trust
Scope:
- Search/filters, location relevance.
- Ratings and reviews components.

Visual Checks:
- Filter chips and sliders match web intent and spacing rules.
- Trust badges aligned with existing token system.

Exit Criteria:
- Search and filters usable on both iOS and Android.

## Parity Checkpoints (Per MVP)
- Screen list for each MVP with a visual checklist.
- Side-by-side web mobile vs native screenshots.
- Document any platform comfort overrides.

## Release Gates (Every MVP)
- `npx tsc --noEmit -p apps/web/tsconfig.json`.
- Mobile build passes on iOS + Android simulators.
- Parity checklist completed and archived.

## Suggested File Structure
- `packages/shared` (rules, types, constants, formatters)
- `packages/design-tokens` (source of truth)
- `apps/web` (existing)
- `apps/mobile` (native UI + navigation + screens)

## Next Actions
1) Create `packages/design-tokens` and export token map.
2) Scaffold `apps/mobile` with Expo + NativeWind.
3) Implement MVP 0 primitives and nav shell.
