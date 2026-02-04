# Boliyan Project Command Runner
# Run `just --list` to see all available commands

set windows-shell := ["pwsh", "-NoProfile", "-Command"]

# Default recipe: show available commands
default:
    @just --list

# ─────────────────────────────────────────────────────────────────────────────
# Core Workflows
# ─────────────────────────────────────────────────────────────────────────────

# Start the Next.js development server
dev:
    npm --prefix apps/web run dev

# Build the production application
build:
    npm --prefix apps/web run build

# Run ESLint checks
lint:
    npm --prefix apps/web run lint

# Run TypeScript type checking
typecheck:
    npm --prefix apps/web run typecheck

# ─────────────────────────────────────────────────────────────────────────────
# Quality Assurance
# ─────────────────────────────────────────────────────────────────────────────

# Run all pre-flight checks (lint, typecheck, build)
checks:
    npm --prefix apps/web run checks

# Run feature validation script
validate:
    npm --prefix apps/web run validate-features

# Run Playwright E2E tests
e2e:
    npm --prefix apps/web run test:e2e

# Run Playwright E2E tests in dev mode
e2e-dev:
    npm --prefix apps/web run test:e2e:dev

# ─────────────────────────────────────────────────────────────────────────────
# Maintenance
# ─────────────────────────────────────────────────────────────────────────────

# Clear the .next cache directory
clean:
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps/web/.next
    Write-Host "[Clean] .next cache cleared."

# Kill zombie Node.exe processes (runs cleanup.mjs)
kill-node:
    node apps/web/scripts/cleanup.mjs

# ─────────────────────────────────────────────────────────────────────────────
# Database (Supabase)
# ─────────────────────────────────────────────────────────────────────────────

# Pull remote database schema
db-pull:
    cd apps/web && npx supabase db pull

# Generate migration diff
db-diff name:
    cd apps/web && npx supabase db diff --file {{name}}

# Push local migrations to remote
db-push:
    cd apps/web && npx supabase db push

# Reset local database
db-reset:
    cd apps/web && npx supabase db reset

# ─────────────────────────────────────────────────────────────────────────────
# Mobile App (Expo)
# ─────────────────────────────────────────────────────────────────────────────

# Install mobile dependencies
mobile-install:
    npm --prefix apps/mobile install

# Start Expo dev server on LAN (fast start, use cached bundle)
mobile:
    cd apps/mobile && npx expo start --lan

# Start Expo dev server with cache clear (use if weird errors occur)
mobile-clean:
    cd apps/mobile && npx expo start -c --lan

# Start Expo for Android
mobile-android:
    npm --prefix apps/mobile run android

# Start Expo for iOS
mobile-ios:
    npm --prefix apps/mobile run ios
