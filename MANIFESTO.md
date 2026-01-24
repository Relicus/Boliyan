# The Boliyan Manifesto

**"Boliyan"** — Speak your price. Seal the deal. No nonsense.

## 🚀 Mission
To build the most **efficient, transparent, and safe** peer-to-peer marketplace for Pakistan. We are killing the friction of buying and selling used goods. We believe that selling your old phone or buying a dining table shouldn't feel like a battle.

## 🛑 The Pain Points We Solve

### 1. The "Is this available?" Epidemic
**Problem:** Sellers get 50 messages asking "Available?", reply "Yes", and never hear back.
**Solution:** 
- **NO CHAT BEFORE DEAL.** 
- Buyers cannot message sellers directly. They must **Place a Bid**. 
- Chat unlocks *only* after the Seller **Accepts** the bid.
- This eliminates "window shoppers" and forces intent.

### 2. The Lowball Nightmare
**Problem:** You list a phone for 50k. Someone messages: "15k final cash now."
**Solution:** Automated Price Intelligence. We show the *real* market value. Lowball bids are auto-filtered or shamed (subtly).

### 3. The Trust Deficit
**Problem:** Meeting a stranger in a parking lot is scary. Is the item stolen? Is the buyer real?
**Solution:**
- **Verified Profiles:** Phone number + Social verification.
- **Rating History:** Your reputation follows you.
- **Safety Zones:** Suggested safe meetup spots.

### 4. Ad Clutter & Scams
**Problem:** Real listings get buried under "Earn Money Online" spam and duplicate ads.
**Solution:** Strict approval queues and community moderation. One unique item = One clean listing.

---

## ⚖️ The Rules of Engagement (Brand Values)

1.  **Respect the Time:** Don't ghost. If you change your mind, hit "Cancel Bid". It takes 1 second.
2.  **Real Prices Only:** No "Price: Rs 1" listings. Ask for what you want.
3.  **Data Privacy First:** We don't sell your phone number to telemarketers. Ever.
4.  **Community Policing:** See a scam? Flag it. We ban bad actors instantly.

---

## 🎯 Our Goal
To become the **Default Operating System** for the secondary economy. Whether you're a student selling books or a family moving house, Boliyan is the only tool you need to get the job done.

---

## 📦 Current Development Status

**Last Updated:** 2026-01-24

### Completed Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1-3** | Foundation — Schema, UI Components, Core Bidding Logic | ✅ Complete |
| **Phase 4** | Real-Time Auth & Bidding — Supabase Auth, Live Bids, Image Storage | ✅ Complete |
| **Phase 5** | Messaging & Engagement — Chat, Conversations, Read Receipts, Watchlist | ✅ Complete |
| **Phase 6** | De-Mocking & Production Hardening — Full Supabase Integration, Build Validation | ✅ Complete |

### Core Features Live
- ✅ **Live Data**: Full Supabase integration (PostgreSQL + Real-time).
- ✅ **Real-time bidding** with 70% minimum bid validation.
- ✅ **24-hour Freshness**: Bids only stay in the public pool for 24 hours, keeping auctions alive.
- ✅ **Total Bid Count**: Display lifetime bid interest (# bids) for social proof.
- ✅ **"No Chat Before Deal"** — Messaging unlocks only after bid acceptance.
- ✅ **"3-Chat Rule"**: Listing is auto-hidden once 3 bidders have been accepted (Strict Intent).
- ✅ **Watchlist** with visual indicator.
- ✅ **Winning State** for winning the highest bid.
- ✅ **Verified seller badges** (is_verified flag).
- ✅ **Immersive Gallery** with full-screen view.
- ✅ **Apple-style minimalist UI** with Framer Motion animations.

### Upcoming Priorities (Phase 7+)

> **Note:** Boliyan is a **pure classifieds marketplace**. All transactions happen directly between buyers and sellers. We connect — we don't process payments.

| Priority | Feature | Description |
|----------|---------|-------------|
| **High** | Notification System | Persistent DB-backed alerts (Outbid, Deal Accepted, New Message) with optional email/push |
| **High** | Trust & Verification | User ratings/reviews after completed deals, profile completeness scores |
| **High** | Search & Discovery | Full-text search, category filters, location-based sorting, "Similar Items" |
| **Medium** | Seller Dashboard | "My Listings" analytics (views, bids), listing management (edit/relist/close) |
| **Medium** | Production Polish | Performance optimization, image CDN, SEO improvements, rate limiting |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1 (React 19)
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Database:** Supabase (PostgreSQL + Real-time + Auth + Storage)
- **Design Philosophy:** Apple-Style Minimalism — "Subtract before you add"
