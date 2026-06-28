# Task ID: 6+11 — Full-Stack Developer Work Record

## Summary
Implemented 2 features: Global Transaction Search and Bills & Subscriptions Tracker.

## Files Modified
1. **`/src/components/layout/app-shell.tsx`** — Added `GlobalSearch` component with functional search dropdown replacing the placeholder search input. Added `FileText` icon import. Added Bills nav item and page title.
2. **`/src/store/use-app-store.ts`** — Added `'bills'` to `ViewType` union.
3. **`/src/app/page.tsx`** — Imported `BillsPage` and added `{currentView === 'bills' && <BillsPage />}` rendering.

## Files Created
1. **`/src/components/bills/bills-page.tsx`** — Complete Bills & Subscriptions tracker with summary cards, potential savings analysis, category-grouped collapsible sections, overdue detection.

## Key Implementation Details
- **Search**: Combines expenses + incomes from Zustand store, filters by title/category/description, max 8 results, staggered framer-motion animations, "/" keyboard shortcut, Escape and click-outside to close.
- **Bills**: Filters `isRecurring === true`, calculates next payment date by adding months, groups by category with Radix Collapsible, identifies Entertainment/Subscriptions for potential savings card.
- **Lint**: 0 errors, 0 warnings. Dev server compiles successfully.