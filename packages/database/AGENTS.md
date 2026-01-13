# PROJECT KNOWLEDGE BASE

**Context:** PostgreSQL Data Layer

## OVERVIEW
Raw SQL schema definitions compatible with Supabase (PostgreSQL). Handles core entities for the marketplace.

## STRUCTURE
```
.
└── schema.sql       # Single source of truth for DDL
```

## CONVENTIONS
- **ORM**: None. Raw SQL only.
- **Auth**: References `auth.users` (Supabase managed).
- **Tables**: `profiles`, `listings`, `bids`, `conversations`.
- **IDs**: UUIDs used for primary keys.

## ANTI-PATTERNS (THIS PACKAGE)
- **DO NOT** introduce Prisma, Drizzle, or TypeORM.
- **DO NOT** split schema into multiple files unless complexity demands it.

## NOTES
- Migrations are currently manual. Apply `schema.sql` changes directly to the database.
