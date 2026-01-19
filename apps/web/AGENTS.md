# FRONTEND KNOWLEDGE BASE

> **[🗺️ OPEN PROJECT INDEX (Navigation Hub)](file:///d:/VSCode/Boliyan/INDEX.md)** | **[📖 THE MANIFESTO](file:///d:/VSCode/Boliyan/MANIFESTO.md)**

**Context:** Next.js 16.1.1 (App Router), Tailwind v4, Shadcn UI.

## OVERVIEW
Main marketplace application. Strict TypeScript. See [Manifesto](../../MANIFESTO.md) for product rules.

## STRUCTURE
```
src/
├── app/               # App Router (Pages & Layouts)
├── components/
│   ├── ui/            # Shadcn Primitives (Styling-focused)
│   └── marketplace/   # Domain Components (ItemCard, ProductDetailsModal, SmartFilterBar)
└── lib/               # Core logic & Supabase client
    ├── store.tsx      # Compatibility Layer for state
    └── transform.ts   # DB -> UI transformations
```

## CONVENTIONS
- **AI Referencing**: (STRICT) Assign unique `id` attributes to main containers and actionable elements (buttons, inputs).
- **State Management**: Use specific context hooks (`useMarketplace`, `useAuth`, etc.) or the legacy `useApp()` wrapper.
- **UI Patterns**:
    - **Victory Halo**: Implement using `motion.div` with conic-gradients for status feedback.
    - **Celebration**: `canvas-confetti` should be triggered for all high-intent successes.
- **Data Flow**: Use Supabase real-time subscriptions for dynamic updates.

## ANTI-PATTERNS
- **DO NOT** manually link packages.
- **DO NOT** use `window.alert`. 
- **DO NOT** duplicate bid validation logic outside `placeBid` in `store.tsx`.

## ROADMAP
- **WebSockets/Real-time**: Adding live bid updates to `MarketplaceGrid`.
- **User Dashboard**: Expanding "My Bids" and "My Listings" views.

## COMMANDS
```bash
npm run dev    # Localhost:3000
npm run lint   # ESLint
```
