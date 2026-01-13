# PROJECT KNOWLEDGE BASE

**Context:** Next.js 16 Classifieds Marketplace (App Router)

## OVERVIEW
Boliyan Web is the frontend application built with Next.js 16.1.1, utilizing React 19 and Server Components by default. It features a mobile-first design for a classifieds marketplace with seller dashboard and bidding mechanics.

## STRUCTURE
```
src/
├── app/               # App Router pages (/, /dashboard, /list, /inbox)
├── components/
│   ├── ui/            # Shadcn/Radix primitives (visual only)
│   ├── marketplace/   # Domain logic (Grid, Cards)
│   ├── seller/        # Dashboard components
│   └── inbox/         # Messaging components
├── lib/               # Utilities & State (store.tsx)
└── types/             # TypeScript definitions
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Pages/Routes** | `src/app/` | `page.tsx`, `layout.tsx` pattern |
| **Global State** | `src/lib/store.tsx` | Zustand-style React Context |
| **Data Types** | `src/types/index.ts` | User, Item, Bid interfaces |
| **UI Primitives** | `src/components/ui/` | Do not modify logic here |

## CONVENTIONS
- **Rendering**: Server Components default. Use `'use client'` only when interaction is needed.
- **Styling**: Tailwind CSS v4. Mobile-first (hidden sidebar on small screens).
- **UI**: Shadcn UI. Component logic lives in `components/marketplace` or `components/inbox`.
- **Navigation**: `next/link` for internal, `<a>` for external.

## UNIQUE STYLES
- **Strict Messaging**: Users cannot chat until a bid is accepted (enforced in Store and UI).
- **Secret Bidding**: Sellers toggle between public auction/private bids.
- **Price Intelligence**: AI-driven recommendations in `src/app/list`.
- **Location**: Radius slider filter in Sidebar.

## COMMANDS
```bash
npm run dev      # localhost:3000
npm run lint     # ESLint check
```
