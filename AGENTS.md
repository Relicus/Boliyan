# PROJECT KNOWLEDGE BASE

> **[🗺️ OPEN PROJECT INDEX (Navigation Hub)](file:///d:/VSCode/Boliyan/INDEX.md)** | **[📖 THE MANIFESTO](file:///d:/VSCode/Boliyan/MANIFESTO.md)**


**Context:** Monorepo (Next.js 16 + SQL), Manual Dependency Management.
**Last Updated:** 2026-01-19

## OVERVIEW
Boliyan is a premium classifieds marketplace focused on high-intent bidding and strictly gated communication ("No chat before deal").
Built with **Next.js 16.1 (React 19)**, **Tailwind CSS v4**, and **Framer Motion**.
Data is managed via raw SQL in `packages/database` and a custom Context-based store in `apps/web`.

## COMMANDS (Run from `apps/web/`)

| Action | Command | Notes |
|--------|---------|-------|
| **Dev Server** | `npm run dev` | Runs on localhost:3000 |
| **Lint** | `npm run lint` | Uses ESLint 9 + eslint-config-next |
| **Pre-flight Check** | `npx tsc --noEmit -p apps/web/tsconfig.json` | Project-wide TypeScript check |
| **Build** | `npm run build` | Full production build |
| **Test (All)** | `npx playwright test` | Runs all E2E tests |
| **Test (Single)** | `npx playwright test tests/my-test.spec.ts` | Run specific test file |
| **Test (UI)** | `npx playwright test --ui` | Opens interactive test runner |

## DESIGN PHILOSOPHY (APPLE-STYLE MINIMALISM)
**Core Tenet:** "Subtract before you add. If a visual cue works, delete the text."

1.  **Ruthless Reduction**:
    -   Do not use labels if context or icons suffice (e.g., remove "Global Search", just use a Search Icon).
    -   Avoid "helper text" unless absolutely critical. If the UI needs explanation, the UI is wrong.
    -   **The Exchange Rule**: If you add a new visual element, try to remove an existing one to maintain density equilibrium.

2.  **Impact over Volume**:
    -   Use *Motion* instead of *Text* to convey state (e.g., Shake for error, Pulse for attention).
    -   **Typography**: One bold header is better than three paragraphs of explanation.
    -   **Whitespace**: Is an active element. Do not fill empty space just because it's empty.

## CODE STYLE & CONVENTIONS

### 1. Structure & Imports
- **Monorepo**: Manual linking. `packages/shared` logic is imported directly or via TS paths.
- **Path Aliases**: Use `@/components`, `@/lib`, `@/hooks`, `@/types` (mapped to `src/*`).
- **Import Order**:
  1. External Libraries (`react`, `framer-motion`, `lucide-react`)
  2. Types (`@/types`)
  3. Components (`@/components/ui`, `@/components/marketplace`)
  4. Hooks & Lib (`@/lib/store`, `@/hooks/useBidding`)

### 2. Naming Conventions
- **Files**:
  - Components: `PascalCase.tsx` (e.g., `ItemCard.tsx`)
  - Hooks: `camelCase.ts` (e.g., `useBidding.ts`)
  - Utilities: `camelCase.ts` (e.g., `utils.ts`)
- **Components**: PascalCase. Functional components only.
- **IDs (CRITICAL)**: specific `id` attributes for AI targeting:
  - Format: `kebab-case` with descriptive prefix + ID.
  - Example: `id="item-card-i123"`, `id="place-bid-btn-i123"`
  - **MANDATORY**: Every interactive element and major container MUST have an ID.

### 3. Styling (Tailwind v4 + Framer Motion)
- **Engine**: Tailwind CSS v4. No config file needed for standard usage.
- **Animations**: Use `framer-motion` (`motion.div`, `AnimatePresence`) for ALL state changes.
- **Patterns**:
  - **Victory Halo**: Conic gradients (`bg-[conic-gradient(...)]`) for winning states (Orange) or watchlist (Blue).
  - **Glassmorphism**: `backdrop-blur-md bg-black/60` for overlays.
  - **Fluid Typography**: Use custom classes like `text-fluid-h3` (if defined) or standard tailwind responsive prefixes.

### 4. State Management
- **Store**: `apps/web/src/lib/store.tsx` (AppContext).
- **Pattern**: No Redux/Zustand. Use `useApp()` hook to access global state (`items`, `user`, `bids`).
- **Data Flow**:
  - **Read**: `const { items, user } = useApp();`
  - **Write**: `const { placeBid, toggleWatch } = useApp();`
  - **Validation**: Logic (e.g., 70% min bid) lives in `packages/shared` or `store.tsx`, NOT in components.

### 5. Type Safety
- **Strict Mode**: Enabled. No `any`.
- **Interfaces**: Define props interface for every component.
- **Shared Types**: Use `apps/web/src/types/index.ts` for domain entities (`Item`, `Bid`, `User`).

## FEATURE IMPLEMENTATION MAP

| Feature | Logic Location | UI Component | Notes |
|---------|----------------|--------------|-------|
| **Bidding** | `useBidding` hook | `ItemCard.tsx`, `ProductDetailsModal.tsx` | Uses `SmartStepper` input. |
| **Validation** | `packages/shared/bidding.ts` | `store.tsx` | Min bid: 70% of ask price. |
| **Watchlist** | `toggleWatch` (store) | `ItemCard.tsx` (Bookmark icon) | Triggers Blue Halo. |
| **Messaging** | `sendMessage` (store) | `ChatWindow.tsx` | Unlocks ONLY after deal acceptance. |
| **Gallery** | `ItemCard` (internal state) | `ItemCard.tsx` | Immersive full-screen view. |

## ANTI-PATTERNS (DO NOT DO)
- **❌ NO ORM**: Use raw SQL in `packages/database`.
- **❌ NO Alerts**: Never use `window.alert()`. Use in-UI feedback (red rings, shaking animations).
- **❌ NO Loose Strings**: Hardcoded strings in logic. Use constants.
- **❌ NO Direct DOM Access**: Use Refs if absolutely necessary, but prefer React state.
- **❌ NO Node APIs in Shared**: `packages/shared` must run in browser too.

## TESTING GUIDELINES
- **Framework**: Playwright.
- **Selectors**: Use the mandatory `id` attributes (`page.locator('#place-bid-btn-i123')`).
- **State**: Mock data is loaded by default in `AppProvider`. Tests run against this mock state.

## ROADMAP & CURRENT TASKS
- **Notification System**: Real-time alerts for `isOutbidTrigger`.
- **Payment Integration**: Transition from "deal acceptance" to secure escrow.
- **Trust & Verification**: User ratings and reviews implementation.

## RULES FOR AI AGENTS
1.  **Minimalist Check**: Before implementing, ask "Can this be done with FEWER elements?"
2.  **Always Check IDs**: Before interacting with elements, verify the `id` exists or add it.
3.  **Verify Animations**: Ensure Framer Motion transitions are smooth and don't cause layout shifts.
4.  **Respect The Halo**: The "Victory Halo" is a core mechanic. Do not remove or alter its logic without specific instruction.
5.  **SQL First**: DDL changes must be reflected in `packages/database/schema.sql`.
6.  **Pre-flight Requirement**: ALWAYS run the **Pre-flight Check** (`npx tsc --noEmit -p apps/web/tsconfig.json`) before finishing a task to catch cross-file type errors that `next dev` might miss.

## PROJECT MANIFESTO
D:\VSCode\Boliyan\MANIFESTO.md
