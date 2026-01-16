# BOLIYAN PROJECT INDEX

**Central Navigation Hub**

This document serves as the master map for the Boliyan monorepo. Use it to navigate between different documentation files ("AGENTS.md") and understand the high-level architecture.

## 🗺️ NAVIGATOR

### 📂 Apps (Frontend)
- **[Web App Logic](file:///d:/VSCode/Boliyan/apps/web/src/lib/AGENTS.md)** (`apps/web/src/lib`) - Store, Mock Data, Utilities.
- **[Hooks](file:///d:/VSCode/Boliyan/apps/web/src/hooks/AGENTS.md)** (`apps/web/src/hooks`) - Custom React Hooks (Bidding, etc.).
- **[Marketplace UI](file:///d:/VSCode/Boliyan/apps/web/src/components/marketplace/AGENTS.md)** (`apps/web/src/components/marketplace`) - Core interactions (ItemCard, Filters).
- **[Shared UI](file:///d:/VSCode/Boliyan/apps/web/src/components/ui/AGENTS.md)** (`apps/web/src/components/ui`) - Shadcn + Radix primitives.

### 📦 Packages (Backend & Shared)
- **[Database](file:///d:/VSCode/Boliyan/packages/database/AGENTS.md)** (`packages/database`) - Raw SQL Schema & Migrations.
- **[Shared Logic](file:///d:/VSCode/Boliyan/packages/shared/AGENTS.md)** (`packages/shared`) - Validation & Business Logic.

### 📜 Root Documentation
- **[Project Rules (AGENTS.md)](file:///d:/VSCode/Boliyan/AGENTS.md)** - Operational Rules & Design Philosophy.
- **[Manifesto](file:///d:/VSCode/Boliyan/MANIFESTO.md)** - Product Vision & Mission.
- **[Gemini Knowledge](file:///d:/VSCode/Boliyan/GEMINI.md)** - Detailed Project Knowledge Base.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Monorepo Structure
Boliyan uses a **manual monorepo** structure (no Turborepo/Nx yet) to keep things simple.

- **`apps/web`**: The main Next.js 16 application.
  - Uses a **custom Context Store** (`store.tsx`) for state management (No Redux/Zustand).
  - **Mock Data First**: Development relies on `mock-data.ts`. Real data sync is a future roadmap item.
  
- **`packages/database`**: The Source of Truth for data.
  - **Native SQL**: We write raw SQL schema files (`schema.sql`). No ORM.
  
- **`packages/shared`**: Isomorphic business logic.
  - Code here must run in **both** Browser and Node.js environments.
  - Used for validating bids, parsing amounts, etc.

## 🔍 QUICK LINKS
- **[Mock Data File](file:///d:/VSCode/Boliyan/apps/web/src/lib/mock-data.ts)**
- **[Global Store](file:///d:/VSCode/Boliyan/apps/web/src/lib/store.tsx)**
- **[Database Schema](file:///d:/VSCode/Boliyan/packages/database/schema.sql)**
