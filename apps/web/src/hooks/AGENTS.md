# HOOKS KNOWLEDGE BASE

**Context:** Custom React Hooks.

## DIRECTORY MAP
- **`useBidding.ts`**: Encapsulates bidding logic.
  - Handles: Validation (min 70%), bid increments, and optimistic UI updates.
  - **Dependencies**: Relies on `useApp()` context.
- **`useIntersectionObserver.ts`**: Helper for infinite scroll and lazy loading.

## CONVENTIONS
- **Naming**: Always prefix with `use` (camleCase).
- **Logic**: Hooks should separate *behavior* from *presentation*.
- **Return Values**: Return objects `{ value, handler }` rather than tuples `[value, set]` for clarity in large hooks.
