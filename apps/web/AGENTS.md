# FRONTEND KNOWLEDGE BASE

**Context:** Next.js 16.1.1 (App Router), Tailwind v4, Shadcn UI.

## OVERVIEW
Main marketplace application. Strict TypeScript. See [Manifesto](../../MANIFESTO.md) for product rules.

## STRUCTURE
```
src/
├── app/               # App Router (Page entries)
├── components/
│   ├── ui/            # Shadcn Primitives (External-like)
│   └── marketplace/   # Domain Components
└── lib/               # Stores & Utils
```

## CONVENTIONS
- **Imports**: Use `@/` alias. Manual imports from `packages/shared`.
- **State**: React Context + Zustand-like stores.
- **Data**: Fetch in Server Components, pass to Client Components.

## ANTI-PATTERNS
- **DO NOT** modify `components/ui` logic. Style tweaks only.
- **DO NOT** leak server secrets to client components.
- **DO NOT** assume `packages/` are symlinked.

## COMMANDS
```bash
npm run dev    # Localhost:3000
npm run lint   # ESLint
```
