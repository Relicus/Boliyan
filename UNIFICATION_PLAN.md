# UNIFICATION & POLISH PLAN

This document outlines the architectural and UI unification strategy for Boliyan. The goal is to move from fragmented implementations to a shared component-driven architecture, ensuring a consistent premium feel across the marketplace.

## 1. ARCHITECTURAL UNIFICATION

### A. Global Context Hygiene
*   **Tooltip Consolidation**: Move `TooltipProvider` from individual components (`ItemCard`, etc.) to `RootLayout`. This prevents multiple providers from mounting and ensures tooltips work reliably across all page elements.
*   **State Extraction**: Ensure `ItemCard`, `WatchedItemCard`, and `MyBidCard` all derive their bidding state (High Bidder, Outbid, etc.) through the same helper logic or hook.

### B. Component-Driven Layout
*   **Price Unification**: Refactor `ItemCard.tsx` to use the `PriceDisplay.tsx` component.
*   **Label Standardization**: Standardize the "Metadata Label" style across the app:
    *   **Class**: `text-[clamp(0.5625rem,2.25cqi,0.75rem)] font-black uppercase tracking-[0.08em] text-slate-500/80`
    *   **Usage**: "Asking", "High Bid", "Secret", "Closing", "Slots".

## 2. UI & INTERACTION POLISH

### A. The "Satisfying" Stepper
*   **Visual Pop**: Add Framer Motion "pop" animations (scale and slight Y-offset) to the bid amount when incremented/decremented.
*   **State-Driven Colors**:
    *   `Normal`: Slate/Blue
    *   `Error` (Below Min): Red background + Shake animation.
    *   `Success`: Amber transition.

### B. Typography Hierarchy
*   **Primary Price**: Use `font-outfit font-black` for all primary monetary values.
*   **Secondary Info**: Use `font-medium` for descriptions and secondary text to maintain contrast.

## 3. FEATURE HARDENING

### A. De-mocking the "3-Slot Rule"
*   **Logic**: Update `ChatWindow.tsx` to pull the actual count of accepted bids (active conversations) for the specific `listing_id`.
*   **UI**: Ensure the visual dot indicator correctly reflects the slot usage (1/3, 2/3, 3/3).

### B. Card Structure Alignment
*   Ensure `WatchedItemCard` and `MyBidCard` use the same internal spacing and border-radius patterns as the main `ItemCard` to prevent a "jarring" experience when switching between the Marketplace and Dashboard.

## 4. IMPLEMENTATION ROADMAP

1.  **Layout Setup**: Move TooltipProvider and sanitize `RootLayout`.
2.  **Price & Logic Sync**: Migrate `ItemCard` to `PriceDisplay` and `BiddingControls`.
3.  **Typography Audit**: Apply the standardized metadata label style globally.
4.  **Interaction Layer**: Implement the Smart Stepper animations.
5.  **Data Wiring**: Connect real conversation counts to the Chat slot indicator.
