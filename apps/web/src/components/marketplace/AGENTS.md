# MARKETPLACE COMPONENT KNOWLEDGE BASE

**Context:** Core Domain UI for Listing & Browsing.

## DIRECTORY MAP
- **`ItemCard.tsx`**: The **Hero Component**.
  - **Responsibilities**: Display item info, handle "Watch" toggle, trigger Modal.
  - **Key Feature**: **The Victory Halo**. A conic gradient border that lights up when interesting things happen (Winning/Watching).
- **`MarketplaceGrid.tsx`**: The main layout container.
  - **Responsive**: Adapts from 1 column (Mobile) to 4 columns (Desktop).
  - Handles **Infinite Scroll** triggers.
- **`ProductDetailsModal.tsx`**: The **Transaction Hub**.
  - **Sticky Bidding**: The bidding controls stay visible on mobile.
  - **Immersive Gallery**: Fullscreen image viewing.
- **`SmartFilterBar.tsx`** & **`CategoryBar.tsx`**: Discovery tools.
  - Validates active filters against the store.

## CONVENTIONS
- **Ids**: Every interactive element MUST have a unique `id` (e.g., `id="place-bid-btn-i123"`).
- **Styling**: `ItemCard` must handle its own layout stability (aspect-ratio for images) to prevent cumulative layout shift (CLS).
