# YieldLens — Rental Property Investment Analyzer

A fast, fully client-side rental property investment analyzer. Model any scenario — purchase price, financing terms, operating expenses, appreciation — and get instant year-by-year projections with IRR, Cap Rate, Cash-on-Cash, and equity growth.

> **All calculations happen in your browser. No data ever leaves your device.**

---

## Features

### Financial Summary Tab
- **Live KPI header** — Cap Rate, CoC Return, and Monthly Cash Flow update in real time as you adjust any input
- **Traffic-light verdict** — instant Solid / Review / Caution signal based on heuristic thresholds
- **Full mortgage modeling** — standard amortization with configurable rate, term, and down payment; handles 100% all-cash purchases cleanly
- **Comprehensive assumptions** — vacancy, maintenance reserve, management fee, property taxes, insurance, HOA, utilities, misc; all with individual annual escalation rates
- **Cash to Purchase summary** — down payment + closing costs = total cash required

### Financial Analysis Tab
- **Year selector** — click any year (1–30) to highlight that column across all tables and charts
- **4 live metric cards** — Annual Cash Flow, NOI, Net Equity, and IRR for the selected year
- **4 Recharts visualizations:**
  - Cash Flow over time (annual + monthly, breakeven reference line)
  - Equity growth (property value vs. mortgage balance vs. net equity wedge)
  - Return rates (Cap Rate, CoC, IRR, APY)
  - Cumulative ROI (bar + line combo)
- **Collapsible data tables** — Cash Flow, Tax Benefits, Equity Accumulation, and Financial Performance; expand only what you need

### Simulation Management
- **Save / Load / Duplicate** simulations via `localStorage` — persists across browser sessions
- **Grouped by property address** — run Bull / Base / Bear scenarios on the same property side by side
- **Auto-resume** — last session state is restored on next visit
- **Print-ready** — clean one-page summary via `window.print()`

---

## Financial Formulas

| Metric | Formula |
|---|---|
| Cap Rate | NOI Year 1 / Purchase Price |
| Cash-on-Cash | Annual Cash Flow / Total Cash Required |
| Net Equity | Property Value − Mortgage Balance |
| Depreciation | (Purchase Price × Building Ratio) / 27.5 |
| IRR | Newton-Raphson on `[−TotalCash, CF₁…CFₙ + EquityExit]` |
| APY | `(1 + ROI)^(1/n) − 1` annualized |
| ROI | (Cumulative Cash Flows + Equity Gain) / Total Cash Required |

Income, property taxes, utilities, and misc expenses escalate annually at independent configurable rates. Insurance and HOA are flat.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Build tool | Vite 7 |
| Persistence | `localStorage` (no backend) |
| Fonts | Plus Jakarta Sans · Sora (Google Fonts) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build
npm run build
