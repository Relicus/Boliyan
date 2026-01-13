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
- **AI Referencing**: Always assign unique, descriptive `id` attributes to main containers, sections, and significant UI elements. This is mandatory for AI agents to accurately target, reference, and modify specific parts of the UI.
- **Imports**: Use `@/` alias. Manual imports from `packages/shared`.
- **State**: React Context + Zustand-like stores.
- **Data**: Fetch in Server Components, pass to Client Components.

## ANTI-PATTERNS
- **DO NOT** modify `components/ui` logic. Style tweaks only.
- **DO NOT** leak server secrets to client components.
- **DO NOT** assume `packages/` are symlinked.

## ROADMAP
- **UI/UX Enhancements**: See [ui_ux_roadmap.md](file:///C:/Users/ASUS/.gemini/antigravity/brain/bf3cb565-0ea7-4e77-9077-7adcdb4d1347/ui_ux_roadmap.md) for planned platform-level improvements.
- **Backend Integration**: Planned transition from mock data to Supabase/PostgreSQL.

## COMMANDS
```bash
npm run dev    # Localhost:3000
npm run lint   # ESLint
```
