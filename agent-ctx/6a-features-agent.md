---
Task ID: 6a
Agent: Features Agent
Task: Add Net Worth Tracker + Smart Insights Panel

Work Log:
- Read worklog.md and use-app-store.ts to understand project structure, data model, and existing patterns
- Read dashboard-page.tsx (622 lines) to understand layout, AnimatedCard wrapper pattern, CATEGORY_COLORS, formatCurrency, and section ordering
- Created `/src/components/dashboard/net-worth-tracker.tsx` — full-width dashboard card with:
  - Net worth calculation (income - expenses) per month for last 6 months
  - Large current net worth display with emerald/rose color based on positive/negative
  - Trend indicator (TrendingUp/TrendingDown icon + percentage change from previous month)
  - BarChart (recharts) showing monthly net worth with dark tooltip styling
  - Glass card styling (`glass border-0`), motion.div animation, number-tick class
- Created `/src/components/dashboard/smart-insights.tsx` — 6-card grid with:
  - Savings Rate: progress bar, color-coded (emerald ≥20%, amber 10-20%, rose <10%)
  - Top Spending Category: shows category name, amount, % of total
  - Budget Health: counts over-limit and near-limit (>80%) budgets
  - Income vs Expenses Trend: month-over-month net savings % change
  - Goal Progress: goal closest to completion with progress percentage
  - Recurring Cost Ratio: % of monthly spending that is recurring
  - Each card: lucide icon, title, metric, description, status color (emerald/amber/rose)
  - Framer Motion staggered entry animations (containerVariants/itemVariants)
  - Grid layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Integrated into `dashboard-page.tsx`:
  - Added imports for NetWorthTracker and SmartInsights
  - Net Worth Tracker as AnimatedCard index 14, full-width, placed above "Bottom Row" (line 320)
  - Smart Insights as AnimatedCard index 15, full-width with Card wrapper, placed after Spending Patterns (line 540)
  - Smart Insights section has emerald Sparkles icon header and "AI Powered" badge
- Lint: 0 errors, 0 warnings. Dev server compiled successfully.

Stage Summary:
- 2 new dashboard components: Net Worth Tracker + Smart Insights Panel
- Net Worth Tracker: 6-month bar chart + trend indicator + large currency display
- Smart Insights: 6 data-driven insight cards with progress bars and color-coded status
- Both use existing design patterns (glass, CATEGORY_COLORS, formatCurrency, motion animations)
- Full integration into dashboard layout between Charts Row and Bottom Row, and after Spending Patterns