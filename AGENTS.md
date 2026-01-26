# PROJECT KNOWLEDGE BASE

> **[OPEN PROJECT INDEX](file:///d:/VSCode/Boliyan/INDEX.md)** | **[THE MANIFESTO](file:///d:/VSCode/Boliyan/MANIFESTO.md)**

**Context:** Monorepo (Next.js 16 + SQL), Manual Dependency Management.
**Last Updated:** 2026-01-25

## OVERVIEW
Boliyan is a premium classifieds marketplace focused on high-intent bidding and strictly gated communication ("No chat before deal").
The product runs in a combined buyer + seller mode; analytics is unified across offers, bids, listings, and watchlist.
Built with Next.js 16.1 (React 19), Tailwind CSS v4, and Framer Motion.
Data is managed via raw SQL in `packages/database` and a custom Context-based store in `apps/web`.

## COMMANDS (Run from `apps/web/`)

| Action | Command | Notes |
|--------|---------|-------|
| Dev Server | `npm run dev` | Runs on localhost:3000 |
| Lint | `npm run lint` | Uses ESLint 9 + eslint-config-next |
| Pre-flight Check | `npx tsc --noEmit -p apps/web/tsconfig.json` | Project-wide TypeScript check |
| Build | `npm run build` | Full production build |
| Test (All) | `npx playwright test` | Runs all E2E tests |
| Test (Single) | `npx playwright test tests/my-test.spec.ts` | Run specific test file |
| Test (UI) | `npx playwright test --ui` | Opens interactive test runner |

## DESIGN PHILOSOPHY (APPLE-STYLE MINIMALISM)
Core Tenet: "Subtract before you add. If a visual cue works, delete the text."

- Space-first clarity: prioritize compact information density by layering badges/overlays/dots on existing elements, avoid adding rows unless unavoidable, use gentle state motion (swap/rotate/shift) instead of flashing, and preserve measured whitespace so the layout breathes without feeling empty.
- Impact over Volume: use motion to convey state; keep one strong headline; let whitespace breathe.
- **Device-Specific Layout Strategy**:
  - **Desktop**: Minimize vertical space. Prioritize horizontal alignment ("in-line" as much as possible) to maximize content area.
  - **Mobile (Phone)**: Prioritize horizontal breathing room. Avoid overcrowding the row; use vertical stacks (multiple rows) when necessary to maintain touch-friendly targets and legibility.

## CODE STYLE AND CONVENTIONS

### Structure and Imports
- Monorepo: manual linking. `packages/shared` logic is imported directly or via TS paths.
- Path Aliases: use `@/components`, `@/lib`, `@/hooks`, `@/types` (mapped to `src/*`).
- Import Order:
  1. External libraries (`react`, `framer-motion`, `lucide-react`)
  2. Types (`@/types`)
  3. Components (`@/components/ui`, `@/components/marketplace`)
  4. Hooks and lib (`@/lib/store`, `@/hooks/useBidding`)

### Naming Conventions
- Files:
  - Components: `PascalCase.tsx` (e.g., `ItemCard.tsx`)
  - Hooks: `camelCase.ts` (e.g., `useBidding.ts`)
  - Utilities: `camelCase.ts` (e.g., `utils.ts`)
- Components: PascalCase. Functional components only.
- IDs (critical): every interactive element and major container must have an `id`.
  - Format: `kebab-case` with descriptive prefix + ID.
  - Example: `id="item-card-i123"`, `id="place-bid-btn-i123"`.

### Styling (Tailwind v4 + Framer Motion)
- Engine: Tailwind CSS v4. No config file needed for standard usage.
- Animations: use `framer-motion` (`motion.div`, `AnimatePresence`) for all state changes.
- Pattern: glassmorphism overlays use `backdrop-blur-md bg-black/60`.

### State Management
- Store: `apps/web/src/lib/store.tsx` (AppContext).
- Pattern: no Redux/Zustand. Use `useApp()` to access state (`items`, `user`, `bids`).
- Validation: business rules live in `packages/shared` or `store.tsx`, not in components.

### Type Safety
- Strict mode is enabled. No `any`.
- Define a props interface for every component.
- Shared types live in `apps/web/src/types/index.ts` for domain entities (`Item`, `Bid`, `User`).

## KEY AREAS (BY LOCATION)
- Bidding: `apps/web/src/hooks/useBidding.ts`, `packages/shared/bidding.ts`, `apps/web/src/components/marketplace/ItemCard.tsx`.
- Details UI: `apps/web/src/components/marketplace/ProductDetailsModal.tsx`.
- Messaging UI: `apps/web/src/components/inbox/ChatWindow.tsx`.
- Global store: `apps/web/src/lib/store.tsx`.

## ANTI-PATTERNS (DO NOT DO)
- No ORM. Use raw SQL in `packages/database`.
- No alerts. Never use `window.alert()`.
- No loose strings. Hardcoded strings in logic must be constants.
- No direct DOM access. Use React state or refs only when necessary.
- No Node APIs in `packages/shared` (must run in browser too).

## TESTING GUIDELINES
- Framework: Playwright.
- Selectors: use the mandatory `id` attributes (`page.locator('#place-bid-btn-i123')`).
- State: mock data loads by default in `AppProvider` for tests.
- Checks: run `npm run checks`.

## ROADMAP AND CURRENT PRIORITIES
- Notification system (outbid, deal accepted, message alerts).
- Direct deal closure flow (acceptance to meetup).
- Trust and verification (ratings and reviews).
- Search and discovery (filters, relevance, location).
- Seller tools (my listings, analytics, relist).
- Performance and SEO polish.

## RULES FOR AI AGENTS
1. Minimalist check: can this be done with fewer elements?
2. Always check IDs: verify the `id` exists or add it.
3. Verify animations: ensure Framer Motion transitions are smooth and avoid layout shifts.
4. SQL first: DDL changes must be reflected in `packages/database/schema.sql`.
5. Pre-flight requirement: always run `npx tsc --noEmit -p apps/web/tsconfig.json` before finishing a task.

## PROJECT MANIFESTO
D:\VSCode\Boliyan\MANIFESTO.md
