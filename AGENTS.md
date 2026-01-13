# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-13
**Context:** Monorepo (Next.js 16 + SQL), manual dependency management.

## OVERVIEW
Boliyan: Classifieds marketplace. Next.js 16 frontend (`apps/web`), raw SQL database (`packages/database`). No root workspace config.

## REFERENCES
- [README.md](./README.md): Entry point & quick start.
- [MANIFESTO.md](./MANIFESTO.md): Product philosophy ("No chat before deal").

## STRUCTURE
```
.
├── apps/
│   └── web/           # Main App (Next.js 16, React 19)
├── packages/
│   ├── database/      # SQL Schema (Supabase-compatible)
│   └── shared/        # Shared logic (Bidding validation)
└── README.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Frontend** | `apps/web/src/app` | App Router pages |
| **UI Lib** | `apps/web/src/components/ui` | Shadcn/Radix (Copy-paste) |
| **Schema** | `packages/database/schema.sql` | PostgreSQL DDL |
| **Logic** | `packages/shared` | Bidding rules (Manual import) |

## CONVENTIONS
- **Monorepo**: Manual. No `pnpm-workspace`. Run npm inside dirs.
- **Styling**: Tailwind v4 + Shadcn.
- **Database**: Raw SQL. No ORM.

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT** run `npm install` at root.
- **DO NOT** assume workspace auto-linking.
- **DO NOT** add ORM (Prisma/Drizzle/TypeORM).

## COMMANDS
```bash
# Frontend
cd apps/web && npm run dev
# Database
# (Manual SQL execution required)
```
