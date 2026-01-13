# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-11
**Context:** Unstructured Monorepo (Next.js + SQL)

## OVERVIEW
KaamTamaam is a classifieds marketplace monorepo featuring a Next.js 16 frontend (`apps/boli`) and a raw SQL database layer (`packages/database`). The project uses manual dependency management without a root `package.json` workspace configuration.

## STRUCTURE
```
.
├── apps/
│   └── boli/          # Main Marketplace App (Next.js 16, React 19)
├── packages/
│   ├── database/      # SQL Schema (Supabase-compatible)
│   └── shared/        # Shared logic (Bidding validation)
└── README.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Frontend Features** | `apps/boli/src/app` | App Router pages |
| **UI Components** | `apps/boli/src/components/ui` | Shadcn/Radix primitives |
| **Domain Logic** | `apps/boli/src/components/marketplace` | Business logic components |
| **Database Schema** | `packages/database/schema.sql` | PostgreSQL definitions |
| **Shared Rules** | `packages/shared/bidding.ts` | Validation logic |

## CONVENTIONS
- **Monorepo**: No root `package.json`. Run commands inside specific `apps/` or `packages/` directories.
- **Styling**: Tailwind CSS v4 + Shadcn UI.
- **State**: React Context + Zustand-like patterns in `src/lib/store.tsx`.
- **Database**: Raw SQL. No ORM. Manual schema management.

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT** try to run `npm install` at root (it will fail/do nothing useful).
- **DO NOT** assume automatic workspace linking. Imports may be relative or require manual config.
- **DO NOT** add an ORM without explicit instruction (Raw SQL is intentional).

## COMMANDS
```bash
# Frontend (boli)
cd apps/boli
npm install
npm run dev    # Starts on localhost:3000
```

## NOTES
- **Auth**: Schema references `auth.users`, implying Supabase Auth integration.
- **Next.js**: Uses version 16.1.1 (Canary features likely).
- **Dependencies**: `packages/shared` is manually imported or copied; check `tsconfig.json` paths if imports fail.
