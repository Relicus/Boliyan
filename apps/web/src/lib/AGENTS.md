# LIB KNOWLEDGE BASE

> **[🗺️ OPEN PROJECT INDEX (Navigation Hub)](file:///d:/VSCode/Boliyan/INDEX.md)** | **[📖 THE MANIFESTO](file:///d:/VSCode/Boliyan/MANIFESTO.md)**

**Context:** Core Application Logic & State.


## DIRECTORY MAP
- **`store.tsx`**: The **Global Store (Compatibility Layer)**. Aggregates contexts.
- **`supabase.ts`**: Supabase client initialization.
- **`utils.ts`**: Generic helpers (formatting currency, classes).
- **`transform.ts`**: Data transformation logic (DB -> UI types).

## CONVENTIONS
- **State Modifications**: logic should live in **Context Providers** or **`packages/shared`**.
- **Real-time**: Use hooks in `src/hooks` for realtime subscriptions.

