# SHARED KNOWLEDGE BASE

**Context:** Shared business logic & validation.

## OVERVIEW
Universal TypeScript logic shared between frontend and potential backends.

## CONVENTIONS
- **Environment**: Agnostic (Runs in Browser & Node).
- **Dependency**: No `package.json`. Manual copy/import.

## ANTI-PATTERNS
- **DO NOT** use Node.js specific APIs (fs, path).
- **DO NOT** import React or Next.js specific code.
