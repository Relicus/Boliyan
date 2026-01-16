# LIB KNOWLEDGE BASE

**Context:** Core Application Logic & State.

## DIRECTORY MAP
- **`store.tsx`**: The **Global Store**. Uses React Context + `useReducer`. No external state libraries.
  - **Key Actions**: `placeBid`, `toggleWatch`, `setFilter`.
- **`mock-data.ts`**: The **Source of Truth** for development.
  - Contains all initial items, users, and bids.
- **`utils.ts`**: Generic helpers (formatting currency, classes).
- **`supabase.ts`**: Supabase client initialization (Currently unused/skeletal).

## CONVENTIONS
- **State Modifications**: logic should generally live in **`store.tsx`** or **`packages/shared`**.
- **Mock Data**: Always extend `mock-data.ts` when adding new features before backend integration.
