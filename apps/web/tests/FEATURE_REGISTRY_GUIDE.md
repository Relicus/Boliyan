# Feature Registry & Testing Infrastructure Guide

**Last Updated:** 2026-01-20  
**Version:** 1.0  
**Coverage:** 179 Features (100%)

---

## Overview

This document describes the complete feature discovery, registry, and testing infrastructure for the Boliyan auction marketplace. It serves as a maintenance guide for updating the feature registry and test coverage as the codebase evolves.

---

## 📋 What We Built

### 1. Feature Registry (`src/lib/feature-registry.json`)
A comprehensive JSON mapping of **all 179 interactive features** across the application, organized into 9 logical clusters:

- **Auth & Onboarding** (23 features)
- **Auction Lifecycle** (5 features)
- **Discovery Layer** (31 features)
- **Dashboard & Seller** (27 features)
- **Create Listing** (18 features)
- **Inbox & Messaging** (13 features)
- **Trust & Profiles** (5 features)
- **Layout & Navigation** (25 features)
- **Notifications** (1 feature)

### 2. Automated Validation Script (`scripts/validate-features.js`)
A Node.js script that scans the entire codebase to:
- Extract all `id="..."` attributes
- Count interactive elements (buttons, inputs, forms, links)
- Compare discovered IDs against the registry
- Generate a detailed audit report
- Calculate coverage percentage

### 3. Audit Report (`feature-audit-report.json`)
Auto-generated JSON report containing:
- Total files scanned
- All discovered IDs by file
- Interactive element counts
- Missing IDs (in code but not registry)
- Unused IDs (in registry but not code)
- Coverage metrics

---

## 🔍 Discovery Process

### Phase 1: Manual Recursive Scanning (Passes 1-10)
We manually inspected components across:
1. **Marketplace & Discovery** (CategoryBar, Filters, Location, Price)
2. **Auction & Bidding** (ItemCard, ProductDetailsModal, useBidding)
3. **Profile & Community** (ReviewForm, ProfileCompleteness)
4. **Messaging & Notifications** (ChatWindow, NotificationDropdown)
5. **Dashboard & Seller** (MyBidCard, SellerBidCard, MyListingsTable)
6. **Search** (SearchFilters, SimilarItems)
7. **Common Components** (GamificationBadge, PriceDisplay)
8. **Layout** (Navbar, Sidebar, BottomNav)
9. **Auth** (Sign In, Sign Up)
10. **Create Listing** (List page form)

**Result:** 112 features identified (65% coverage)

### Phase 2: Automated Script Extraction
Created `validate-features.js` to systematically scan all `.tsx` and `.ts` files:

```javascript
// Key regex patterns used:
const PATTERNS = {
  ids: /id=["']([a-z0-9-]+)["']/gi,
  buttons: /<[Bb]utton[^>]*>/g,
  inputs: /<[Ii]nput[^>]*>/g,
  forms: /<form[^>]*>/g,
  links: /<Link[^>]*href=["']([^"']+)["']/g,
  onClick: /onClick=\{([^}]+)\}/g,
  onChange: /onChange=\{([^}]+)\}/g,
};
```

**Result:** 179 features identified (100% coverage)

### Major Gaps Discovered by Script:
- **Auth Flow**: 23 IDs (signin/signup forms)
- **Dashboard Tabs**: 16 IDs (mobile + desktop variants)
- **Navbar Structure**: 13 IDs (logo SVG, brand names)
- **Create Listing**: 18 IDs (entire form flow)
- **Inbox Layout**: 6 IDs (tab navigation)

---

## 🛠️ How to Use the Scripts

### Running the Validation Script

```bash
# From apps/web directory
node scripts/validate-features.js
```

**Output:**
```
🔍 Scanning codebase for features...
✅ Scanned 109 files
✅ Found 179 unique IDs
✅ Found 316 interactive elements

🔍 Comparing with feature registry...
📊 Registry Coverage: 179 IDs registered
⚠️  Missing from Registry: 0 IDs
🗑️  Unused in Registry: 0 IDs

Coverage: 100.00%
```

### Understanding the Audit Report

The generated `feature-audit-report.json` contains:

```json
{
  "summary": {
    "totalFiles": 109,
    "totalIds": 179,
    "totalInteractive": 316,
    "registeredIds": 179,
    "missingIds": 0,
    "unusedIds": 0,
    "coverage": "100.00%"
  },
  "missingIds": [],
  "unusedRegisteredIds": [],
  "idsByFile": { ... },
  "interactiveByFile": { ... }
}
```

**Key Metrics:**
- `coverage`: Percentage of IDs in code that are registered
- `missingIds`: IDs found in code but not in registry (need to add)
- `unusedRegisteredIds`: IDs in registry but not in code (potentially removed/renamed)

---

## 🔄 Updating the Registry

### When to Update

Update the feature registry when:
1. Adding new components with interactive elements
2. Renaming or removing existing IDs
3. Refactoring component structure
4. Adding new pages or major features

### Update Workflow

1. **Make code changes** (add/modify components)

2. **Run validation script:**
   ```bash
   node scripts/validate-features.js
   ```

3. **Review audit report:**
   - Check `missingIds` array for new IDs to add
   - Check `unusedRegisteredIds` for IDs to remove
   - Verify coverage percentage

4. **Update `feature-registry.json`:**
   - Add missing IDs to appropriate cluster
   - Remove unused IDs
   - Create new clusters if needed

5. **Re-run validation:**
   ```bash
   node scripts/validate-features.js
   ```
   - Confirm 100% coverage
   - Verify no missing/unused IDs

6. **Update test files:**
   - Create/update Playwright tests for new features
   - Reference IDs from registry for selectors

### Example: Adding a New Feature

**Scenario:** You add a new "Quick Bid" button with `id="quick-bid-btn"`

1. Run script → finds `quick-bid-btn` in `missingIds`

2. Update `feature-registry.json`:
```json
{
  "id": "auction-lifecycle",
  "features": [
    {
      "id": "quick-bid",
      "name": "Quick Bid Button",
      "ui_ids": ["quick-bid-btn"]
    }
  ]
}
```

3. Create test in `apps/web/tests/quick-bid.spec.ts`:
```typescript
test('Quick Bid functionality', async ({ page }) => {
  await page.goto('/');
  await page.locator('#quick-bid-btn').click();
  // ... assertions
});
```

---

## 📁 File Structure

```
apps/web/
├── src/
│   └── lib/
│       └── feature-registry.json       # Main registry (179 features)
├── scripts/
│   └── validate-features.js            # Automated validation script
├── feature-audit-report.json           # Auto-generated audit report
└── tests/
    ├── verification-70-rule.spec.ts    # Bidding logic tests
    ├── smart_bidding_verification.spec.ts
    ├── marketplace-discovery.spec.ts   # Discovery tests (planned)
    ├── dashboard-seller.spec.ts        # Dashboard tests (planned)
    ├── auth-flows.spec.ts              # Auth tests (planned)
    ├── create-listing.spec.ts          # Listing tests (planned)
    ├── messaging.spec.ts               # Messaging tests (planned)
    └── navigation.spec.ts              # Navigation tests (planned)
```

---

## 🎯 Test Coverage Strategy

### Current Status
- **Database Tests (pgTAP):** ✅ 70% rule trigger
- **E2E Tests (Playwright):** ✅ Smart bidding verification
- **Feature Registry:** ✅ 179 features mapped (100%)
- **Test Implementation:** 🚧 In Progress

### Planned Test Suites

| Cluster | Test File | Priority | Status |
|---------|-----------|----------|--------|
| Auth & Onboarding | `auth-flows.spec.ts` | High | Planned |
| Auction Lifecycle | `verification-70-rule.spec.ts` | High | ✅ Done |
| Discovery Layer | `marketplace-discovery.spec.ts` | High | Planned |
| Dashboard & Seller | `dashboard-seller.spec.ts` | Medium | Planned |
| Create Listing | `create-listing.spec.ts` | Medium | Planned |
| Inbox & Messaging | `messaging.spec.ts` | Medium | Planned |
| Trust & Profiles | `user-engagement.spec.ts` | Low | Planned |
| Layout & Navigation | `navigation.spec.ts` | Low | Planned |
| Notifications | `notifications.spec.ts` | Low | Planned |

---

## 🔧 Maintenance Tips

### Best Practices

1. **Always use `id` attributes for testable elements:**
   ```tsx
   <button id="my-feature-btn" onClick={handleClick}>
     Click Me
   </button>
   ```

2. **Use kebab-case for IDs:**
   - ✅ `navbar-search-input`
   - ❌ `navbarSearchInput`
   - ❌ `navbar_search_input`

3. **Make IDs descriptive and unique:**
   - ✅ `item-card-place-bid-btn-${itemId}`
   - ❌ `btn-1`

4. **Run validation before committing:**
   ```bash
   npm run validate-features  # Add to package.json
   ```

5. **Keep registry organized by cluster:**
   - Group related features together
   - Use clear, descriptive cluster names
   - Maintain alphabetical order within clusters

### Troubleshooting

**Issue:** Script shows low coverage after adding new features

**Solution:**
1. Check if new IDs follow naming convention
2. Verify IDs are in `.tsx` files (not `.css` or `.json`)
3. Ensure regex patterns in script match your ID format

**Issue:** Unused IDs in registry

**Solution:**
1. Search codebase for the ID: `grep -r "id-name" src/`
2. If not found, remove from registry
3. If renamed, update registry with new name

**Issue:** Test selectors not finding elements

**Solution:**
1. Verify ID exists in feature registry
2. Check if element is rendered (not hidden/conditional)
3. Use Playwright's `page.locator('#id').waitFor()` for dynamic content

---

## 📊 Metrics & Goals

### Current Metrics
- **Total Features:** 179
- **Registry Coverage:** 100%
- **Test Coverage:** ~5% (2/179 features tested)
- **Files Scanned:** 109
- **Interactive Elements:** 316

### Goals
- **Q1 2026:** 50% test coverage (90 features)
- **Q2 2026:** 80% test coverage (143 features)
- **Q3 2026:** 100% test coverage (179 features)

---

## 🚀 Next Steps

1. **Implement Auth Flow Tests** (`auth-flows.spec.ts`)
   - Sign in form validation
   - Sign up form validation
   - City selection
   - Error states

2. **Implement Discovery Tests** (`marketplace-discovery.spec.ts`)
   - Search functionality
   - Category filtering
   - Location selection
   - Price range filtering

3. **Implement Dashboard Tests** (`dashboard-seller.spec.ts`)
   - Tab navigation
   - Bid acceptance/rejection
   - Profile settings

4. **Set up CI/CD Integration**
   - Run validation script on pre-commit
   - Run Playwright tests on PR
   - Generate coverage reports

5. **Visual Regression Testing**
   - Victory Halo states
   - Gated Messaging UI
   - Responsive layouts

---

## 📚 References

- **Feature Registry:** `src/lib/feature-registry.json`
- **Validation Script:** `scripts/validate-features.js`
- **Audit Report:** `feature-audit-report.json`
- **Playwright Config:** `playwright.config.ts`
- **Database Tests:** `packages/database/tests/001-auction-logic.sql`

---

## 🤝 Contributing

When adding new features:

1. Add descriptive `id` attributes to interactive elements
2. Run `node scripts/validate-features.js`
3. Update `feature-registry.json` with new IDs
4. Create corresponding Playwright tests
5. Verify 100% coverage before committing

---

**Maintained by:** Boliyan QA Team  
**Contact:** For questions about the registry or testing infrastructure, refer to this guide or run the validation script.
