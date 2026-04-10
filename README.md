# YieldLens — Rental Property Investment Analyzer

A fast, fully client-side rental property investment analyzer. Enter a purchase price, financing terms, and operating expenses — and get instant year-by-year projections with Cap Rate, Cash-on-Cash, IRR, and equity growth.

> **All calculations run in your browser. No account required. No data ever leaves your device.**

---

## What It Does

YieldLens helps you evaluate whether a rental property is a good investment before you buy it. You can model different scenarios (Bull / Base / Bear), save them, and compare side by side.

**Summary Tab** — fill in your numbers, get an instant verdict:
- Purchase price, financing terms (rate, down payment, loan term), and all operating expenses
- Traffic-light verdict: **Solid / Review / Caution** based on standard investment thresholds
- Live KPI header: Cap Rate, Cash-on-Cash Return, and Monthly Cash Flow update as you type
- Cash-to-Purchase summary: down payment + closing costs = total cash required

**Analysis Tab** — deep-dive into 30-year projections:
- P&L breakdown and performance metrics for any selected year
- 4 charts: Cash Flow, Equity Growth, Return Rates (Cap Rate / CoC / IRR / APY), Cumulative ROI
- Milestone snapshot table: key metrics at Years 1, 3, 5, 10, 15, 20, 25, 30

**Simulation Management** — run multiple scenarios on the same property:
- Save, load, duplicate, and delete simulations via browser `localStorage`
- Simulations persist across sessions — resume where you left off
- Print-ready one-page summary via the Print button

---

## Financial Metrics Explained

| Metric | How It's Calculated |
|---|---|
| Cap Rate | NOI Year 1 ÷ Purchase Price |
| Cash-on-Cash (CoC) | Annual Cash Flow ÷ Total Cash Invested |
| Net Equity | Property Value − Mortgage Balance |
| IRR | Newton-Raphson on `[−TotalCash, CF₁…CFₙ + EquityExit]` |
| Depreciation | (Purchase Price × Building %) ÷ 27.5 years |
| APY | `(1 + ROI)^(1/n) − 1` annualized |
| ROI | (Cumulative Cash Flows + Equity Gain) ÷ Total Cash Required |

Income, property taxes, utilities, and misc expenses escalate annually at independent configurable rates. Insurance and HOA are held flat.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI Framework | React 19 |
| Charts | Recharts |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Persistence | `localStorage` (no backend) |
| Fonts | Plus Jakarta Sans · Sora (Google Fonts) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node)

Check your version:
```bash
node -v
```

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/dnd1097/rental-lens.git
cd rental-lens

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Building for Production

```bash
# Create an optimized build in the /dist folder
npm run build

# Preview the production build locally
npm run preview
```

To deploy, upload the contents of the `dist/` folder to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

---

## How to Use

1. **Enter property details** — set the simulation name, property address, and type in the bar at the top
2. **Fill in Purchase + Financing** — purchase price, interest rate, down payment, and loan term
3. **Set Assumptions** — monthly rent, vacancy rate, property taxes, insurance, HOA, and any expense escalation rates
4. **Read the verdict** — the Performance Summary card gives an instant Solid / Review / Caution signal
5. **Explore projections** — switch to the Analysis tab and drag the year slider to see P&L, metrics, and charts for any year
6. **Save your scenario** — click **Save** in the header to store it, then click **Simulations** to load or compare saved runs
7. **Model alternatives** — click **+ New** to start a Bear or Bull case without losing your Base scenario

---

## Project Structure

```
src/
├── App.jsx                  # Root app, routing between tabs, simulation management
├── components/
│   ├── FinancialSummary.jsx # Summary tab: Purchase, Mortgage, Assumptions, KPI cards
│   ├── FinancialAnalysis.jsx# Analysis tab: charts, P&L breakdown, milestone table
│   ├── SimulationsDrawer.jsx# Side drawer for saved simulations
│   └── UI.jsx               # Shared input components (sliders, dollar inputs, tooltips)
└── utils/
    ├── finance.js           # All financial formulas (mortgage, amortization, IRR, projections)
    └── format.js            # Number formatting helpers
```
