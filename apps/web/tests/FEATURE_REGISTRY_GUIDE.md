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
A comprehensive JSON mapping of **all 179 interactive features** across the application, organized into 9 logical clusters.

### 2. Automated Validation Script (`scripts/validate-features.js`)
A Node.js script that scans the entire codebase to extract IDs and validate against the registry.

### 3. **Advanced Topology Analysis** (`scripts/analyze-topology.ts`)
A sophisticated TypeScript tool that provides deep architectural insights:

**Capabilities:**
- **Dynamic ID Detection**: Tracks template literals like `` id={`item-${id}`} ``
- **Test Coverage Analysis**: Scans test files to show which IDs are tested vs. untested
- **Duplicate Detection**: Finds IDs used in multiple locations
- **Orphan Detection**: Identifies IDs with no interaction handlers
- **State Flow Mapping**: Tracks hook usage (`useApp`, `useBidding`, etc.) and state sharing
- **Route Graph**: Maps navigation flow via `<Link>` components
- **Mermaid Diagrams**: Generates visual component relationship graphs

**Latest Analysis Results:**
```
Total Components:     109
Total IDs:            278 (175 static + 103 dynamic)
Test Coverage:        12% (33 covered, 241 uncovered)
Duplicates:           3 IDs
Orphans:              268 IDs (no handlers)
State Connections:    381 (shared state)
Route Links:          23
```

### 4. Audit Reports
- `feature-audit-report.json` - Simple validation report
- `topology-report.json` - Comprehensive architectural analysis (6,768 lines)
- `topology-diagram.mmd` - Mermaid flowchart of component relationships

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

### Running the Simple Validation Script

```bash
# From apps/web directory
npm run validate-features
```

**Use this when:**
- You want a quick check of registry coverage
- You're adding/removing IDs and need to update the registry
- You want to see missing/unused IDs

**Output:**
```
🔍 Scanning codebase for features...
✅ Scanned 109 files
✅ Found 179 unique IDs
✅ Found 316 interactive elements

Coverage: 100.00%
```

### Running the Advanced Topology Analysis

```bash
# From project root
npx tsx scripts/analyze-topology.ts
```

**Use this when:**
- You need deep architectural insights
- You want to see test coverage breakdown
- You're looking for duplicates or orphans
- You need to understand component relationships
- You want to visualize the component graph

**Output:**
```
==================================================
       TOPOLOGY ANALYSIS COMPLETE
==================================================

 Components:        109
 Total IDs:         278
   - Static:        175
   - Dynamic:       103
 State Connections: 381
 Route Links:       23

 TEST COVERAGE:
   Covered:   33 IDs
   Uncovered: 241 IDs
   Coverage:  12%

 ORPHAN IDs (no handler): 268
   - auth-layout-root (div) at apps\web\src\app\(auth)\layout.tsx:16
   - signin-card (div) at apps\web\src\app\(auth)\signin\page.tsx:134
   ... and 266 more

 Output Files:
   - topology-report.json (Full data)
   - topology-diagram.mmd (Mermaid flowchart)
==================================================
```

### Understanding the Topology Report

The `topology-report.json` contains:

```json
{
  "components": [...],        // All components with metadata
  "features": {...},          // IDs grouped by prefix
  "links": [...],             // Component relationships
  "routes": [...],            // Navigation links
  "diagnostics": {
    "duplicateIds": [...],    // IDs used in multiple places
    "orphanIds": [...],       // IDs with no handlers
    "dynamicIdPatterns": [...] // Template literal IDs
  },
  "testCoverage": {
    "coveredIds": [...],      // IDs with tests
    "uncoveredIds": [...],    // IDs without tests
    "coveragePercent": 12,
    "testSelectors": [...],   // All test selectors found
    "patterns": [...]         // Dynamic ID patterns in tests
  },
  "stats": {...}
}
```

**Key Sections:**
- **components**: Shows each component's IDs, state hooks, and route links
- **diagnostics.duplicateIds**: Find IDs that need to be made unique
- **diagnostics.orphanIds**: Find IDs that may need interaction handlers
- **testCoverage.uncoveredIds**: Prioritize these for test implementation

---

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
   - Bidding states
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
