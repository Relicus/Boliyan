# DATABASE KNOWLEDGE BASE

**Context:** Raw SQL Schema (Supabase-compatible).

## OVERVIEW
Single source of truth for database structure.

## STRUCTURE
- `schema.sql`: Contains ALL table definitions, triggers, and RLS policies.

## CONVENTIONS
- **DDL**: Manual SQL writing.
- **Auth**: References `auth.users` (Supabase).
- **RLS**: Row Level Security MUST be enabled on all tables.

## ANTI-PATTERNS
- **DO NOT** use Prisma, Drizzle, or TypeORM.
- **DO NOT** split schema into multiple files (keep `schema.sql` unified).
