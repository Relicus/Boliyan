# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-13
**Context:** Monorepo (Next.js 16 + SQL), manual dependency management.

## OVERVIEW
Boliyan: A premium classifieds marketplace. Built with Next.js 16 (React 19), Tailwind v4, and raw SQL (`packages/database`). Focused on high-intent bidding and strictly gated communication.

## REFERENCES
- [README.md](./README.md): Entry point & quick start.
- [MANIFESTO.md](./MANIFESTO.md): Product philosophy ("No chat before deal").
- [CHANGELOG.md](./CHANGELOG.md): History of implementations.

## STRUCTURE
```
.
├── apps/
│   └── web/           # Next.js 16.1 + React 19 Frontend
├── packages/
│   ├── database/      # SQL Schema (PostgreSQL)
│   └── shared/        # Shared logic & validation
└── README.md
```

## FEATURE MAP (WHERE TO LOOK)
| Feature | Logic | UI Components |
|---------|-------|---------------|
| **Core State** | `apps/web/src/lib/store.tsx` | AppContext (Bidding, Watchlist, Filters) |
| **Bidding Logic** | `placeBid` in `store.tsx` | `SmartStepper` in `ItemCard` & `ProductDetailsModal` |
| **Watchlist** | `toggleWatch` in `store.tsx` | `Bookmark` indicator & `blue` Halo theme |
| **Messaging** | `sendMessage` in `store.tsx` | `apps/web/src/app/chat` |
| **UI Components** | `apps/web/src/components` | Shadcn (ui/), Domain (marketplace/) |

## CONVENTIONS
- **AI Referencing**: (MANDATORY) Always assign unique, descriptive `id` attributes (e.g., `id="item-card-i123"`) to major UI elements for precise targeting by AI agents.
- **Victory Halo**: Visual feedback system using conic-gradients. 
    - **Orange**: Current high bidder (Winner state).
    - **Blue**: Item on watchlist or secret bidding mode.
- **Smart Stepper**: Manual bid inputs must include increment/decrement buttons with steps scaling by price (100, 500, 1000).
- **Styling**: Tailwind CSS v4 is used. Use the `motion` (Framer Motion) for all state-based UI transitions.

## ANTI-PATTERNS
- **DO NOT** assume root workspace linkage (manual installs only).
- **DO NOT** add an ORM.
- **DO NOT** use default browser alerts; use the `toast` system or in-card error states (shaking).

## ROADMAP
- **Notification System**: Real-time alerts for outbid status (using `isOutbidTrigger`).
- **Payment Integration**: Transitioning from "deal acceptance" to secure escrow.
- **Backend Sync**: Replacing mock data with live Supabase/PostgreSQL hooks.

## COMMANDS
```bash
# Frontend
cd apps/web && npm run dev
# Database
# (Manual SQL execution required)
```
