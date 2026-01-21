# Feature Implementation: OAuth Login & Redirect Flow

## Overview
Implemented Google and Facebook OAuth login with a context-aware redirect system. This ensures users are returned to their original page after authentication, regardless of whether they login via the Navbar, "Sell Item" button, or an Auth Gate modal.

## Changes Implemented

### 1. Auth Dialog (Popup)
- **File:** `apps/web/src/components/auth/AuthDialog.tsx`
- **Change:** Converted to a lightweight "Gate" that directs users to full `/signin` or `/signup` pages.
- **Feature:** Captures the current URL and appends it as `?redirect=` to preserve user context.

### 2. Sign In Page
- **File:** `apps/web/src/app/(auth)/signin/page.tsx`
- **Change:** Added Google and Facebook login buttons.
- **Feature:** 
    - Reads `?redirect=` param from URL.
    - Dynamically sets `redirectTo` for OAuth providers (Google/Facebook) to ensure they callback to the correct redirect path.
    - Redirects to the specific target page after successful Email/Password login.

### 3. Sign Up Page
- **File:** `apps/web/src/app/(auth)/signup/page.tsx`
- **Change:** Added Google and Facebook login buttons.
- **Feature:** Implemented same redirect logic as Sign In page for consistent UX.

### 4. Auth Callback
- **File:** `apps/web/src/app/auth/callback/route.ts`
- **Change:** Updated to parse the `redirect` param from the query string.
- **Feature:** Redirects user to the intended target URL after session exchange completes.

### 5. Navbar
- **File:** `apps/web/src/components/layout/Navbar.tsx`
- **Change:** Updated "Sign In" and "Sell Item" buttons.
- **Feature:** 
    - "Sign In" now appends current page as redirect target.
    - "Sell Item" redirects specifically to `/list` after login if user is unauthenticated.

## Configuration Requirements (Supabase & Google)

To make this work in production or across devices (LAN), the following configurations must be maintained in the **Supabase Dashboard**:

1.  **Google Provider:**
    - Enabled with Client ID & Secret from Google Cloud Console.
    - Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`

2.  **Redirect URLs (URL Configuration):**
    - `http://localhost:3000/**` (Local Development)
    - `http://192.168.18.125:3000/**` (LAN Testing)
    - `https://<your-vercel-domain>.vercel.app/**` (Production/Live Test)

## Verification Status
- [x] Codebase updated with redirect logic.
- [x] OAuth buttons added to UI.
- [x] Navbar links updated.
- [ ] **Pending:** User needs to update Supabase "Redirect URLs" whitelist to include LAN IP for mobile testing.
