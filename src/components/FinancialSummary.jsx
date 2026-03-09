import React, { useMemo } from 'react'
import { DollarInput, SliderInput, ComputedRow, TextInput, TextArea, SelectInput, Tooltip, SectionHeading, Button } from './UI.jsx'
import { calcMortgage, calcCashToPurchase, calcKPISummary } from '../utils/finance.js'
import { fmtDollar, fmtPct, trafficLight } from '../utils/format.js'

const PROPERTY_TYPES = ['Single Family', 'Duplex', 'Triplex', 'Fourplex', 'Condo', 'Multi-Family']

// ── Property Identity Bar ────────────────────────────────────────────────────
export function PropertyIdentityBar({ state, setState }) {
  const { meta } = state
  const set = (k, v) => setState(s => ({ ...s, meta: { ...s.meta, [k]: v } }))

  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 14, alignItems: 'end' }}>
        <TextInput label="Simulation Name" placeholder='e.g., "Bear Case — low appreciation"' value={meta.simulationName} onChange={v => set('simulationName', v)} tip="Label this scenario for easy comparison (Bull/Bear/Base)" />
        <TextInput label="Property Address" placeholder="123 Main St, Anytown, CA" value={meta.propertyAddress} onChange={v => set('propertyAddress', v)} />
        <SelectInput label="Property Type" value={meta.propertyType} onChange={v => set('propertyType', v)} options={PROPERTY_TYPES} />
      </div>
    </div>
  )
}

// ── Performance Summary KPI card ─────────────────────────────────────────────
function KPICard({ state }) {
  const kpi = useMemo(() => calcKPISummary(state), [state])

  const capCls  = trafficLight(kpi.capRate,  { green: 0.06, yellow: 0.04 })
  const cocCls  = trafficLight(kpi.coc,       { green: 0.08, yellow: 0.04 })
  const cfColor = kpi.monthlyCashFlow1 >= 0 ? 'c-green' : 'c-red'

  let verdictCls = 'verdict-yellow', verdictIcon = '◑', verdictTitle = 'Review Carefully', verdictSub = 'Mixed signals — check all metrics below'
  if (kpi.capRate >= 0.06 && kpi.coc >= 0.06 && kpi.annualCashFlow1 > 0) {
    verdictCls = 'verdict-green'; verdictIcon = '●'; verdictTitle = 'Solid Investment'; verdictSub = 'Cap Rate ≥ 6%, CoC ≥ 6%, positive cash flow'
  } else if (kpi.annualCashFlow1 < 0 || kpi.capRate < 0.04) {
    verdictCls = 'verdict-red'; verdictIcon = '○'; verdictTitle = 'Caution'; verdictSub = 'Negative cash flow or Cap Rate below 4%'
  }

  return (
    <div>
      {/* Verdict */}
      <div className={`verdict ${verdictCls}`} style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2, color: verdictCls === 'verdict-green' ? 'var(--teal)' : verdictCls === 'verdict-red' ? 'var(--red)' : 'var(--amber-dark)' }}>{verdictIcon}</span>
        <div>
          <div className="verdict-title">{verdictTitle}</div>
          <div className="verdict-sub">{verdictSub}</div>
        </div>
      </div>

      {/* 2×2 KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <KPITile label="Cap Rate" value={fmtPct(kpi.capRate)} cls={capCls} sub="Year 1 NOI / Purchase Price" tip="Net Operating Income ÷ Purchase Price. ≥6% is excellent, 4–6% is okay, <4% is weak" />
        <KPITile label="Cash-on-Cash" value={fmtPct(kpi.coc)} cls={cocCls} sub="Annual Cash Flow / Cash In" tip="Annual Cash Flow ÷ Total Cash Invested. ≥8% is excellent" />
        <KPITile label="Monthly Cash Flow" value={fmtDollar(kpi.monthlyCashFlow1)} cls={cfColor} sub="After all expenses" tip="Net monthly income after all operating expenses and mortgage payment" />
        <KPITile label="Equity (Year 5)" value={fmtDollar(kpi.equity5)} cls="c-green" sub="Property Value − Mortgage" tip="Net equity position after 5 years of appreciation and loan paydown" />
      </div>

      {/* Sub-note */}
      <div style={{ fontSize: 11, color: 'var(--navy-subtle)', textAlign: 'center' }}>
        Updates in real time as you adjust inputs
      </div>
    </div>
  )
}

function KPITile({ label, value, cls, sub, tip }) {
  return (
    <div className="kpi-block">
      <div className="kpi-label">
        <Tooltip label={label} tip={tip} />
      </div>
      <div className={`kpi-val ${cls}`}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--navy-subtle)', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

// ── Purchase Card ────────────────────────────────────────────────────────────
function PurchaseCard({ state, setState }) {
  const setPurchase = (k, v) => setState(s => ({ ...s, purchase: { ...s.purchase, [k]: v } }))
  const { mortgage, purchase } = state
  const { downPaymentDollar } = calcMortgage(purchase.purchasePrice, mortgage.downPaymentPct, mortgage.interestRate, mortgage.loanTermYears)

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <DollarInput label="Property Value (Est.)" value={purchase.propertyValueEst} onChange={v => setPurchase('propertyValueEst', v)} tip="Estimated current market value" />
      <DollarInput label="Purchase Price" value={purchase.purchasePrice} onChange={v => setPurchase('purchasePrice', v)} tip="Actual offer price — may differ from estimated value" />
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <ComputedRow label="Down Payment" value={fmtDollar(downPaymentDollar)} tip="Purchase Price × Down Payment %" />
        <ComputedRow label="Equity at Purchase" value={fmtDollar(downPaymentDollar)} tip="Initial equity equals your down payment" />
      </div>
    </div>
  )
}

// ── Mortgage Card ────────────────────────────────────────────────────────────
function MortgageCard({ state, setState }) {
  const setM = (k, v) => setState(s => ({ ...s, mortgage: { ...s.mortgage, [k]: v } }))
  const { mortgage, purchase } = state
  const { loanAmount, monthlyPayment, annualPayment } = calcMortgage(purchase.purchasePrice, mortgage.downPaymentPct, mortgage.interestRate, mortgage.loanTermYears)
  const allCash = mortgage.downPaymentPct >= 100

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SliderInput label="Interest Rate" value={mortgage.interestRate} onChange={v => setM('interestRate', v)} min={3} max={15} step={0.05} tip="Annual interest rate. Market rates as of 2025 ~6.5–7.5%" />
      <SliderInput label="Down Payment" value={mortgage.downPaymentPct} onChange={v => setM('downPaymentPct', Math.min(100, v))} min={0} max={100} step={1} tip="% of purchase price paid in cash. 100% = all-cash, no loan" />
      <SliderInput label="Loan Term" value={mortgage.loanTermYears} onChange={v => setM('loanTermYears', v)} min={10} max={30} step={5} format="years" tip="Fixed loan term. 30yr = lower payments, 15yr = faster equity buildup" />
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <ComputedRow label="Loan Amount" value={allCash ? '$0 — All Cash' : fmtDollar(loanAmount)} />
        <ComputedRow label="Monthly Payment (P&I)" value={allCash ? '$0' : fmtDollar(monthlyPayment, 2)} />
        <ComputedRow label="Annual Payment" value={allCash ? '$0' : fmtDollar(annualPayment, 2)} />
      </div>
    </div>
  )
}

// ── Cash to Purchase ─────────────────────────────────────────────────────────
function CashToPurchaseCard({ state }) {
  const { purchase, mortgage, assumptions } = state
  const { downPaymentDollar, closingCostsDollar, totalCashRequired } = calcCashToPurchase(purchase.purchasePrice, mortgage.downPaymentPct, assumptions.closingCostsBuyPct)

  return (
    <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', borderRadius: 'var(--r-md)', border: '1px solid #FDE68A', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#92400E', marginBottom: 10 }}>Cash to Purchase</div>
      <ComputedRow label="Down Payment" value={fmtDollar(downPaymentDollar)} tip={`${mortgage.downPaymentPct}% of Purchase Price`} />
      <ComputedRow label="Closing Costs" value={fmtDollar(closingCostsDollar)} tip={`${assumptions.closingCostsBuyPct}% — title, lender fees, escrow`} />
      <div style={{ borderTop: '2px solid #F59E0B', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400E' }}>Total Cash Required</span>
        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 800, color: '#92400E' }}>{fmtDollar(totalCashRequired)}</span>
      </div>
    </div>
  )
}

// ── Assumptions Card ─────────────────────────────────────────────────────────
function AssumptionsCard({ state, setState }) {
  const setA = (k, v) => setState(s => ({ ...s, assumptions: { ...s.assumptions, [k]: v } }))
  const a = state.assumptions

  return (
    <div style={{ display: 'grid', gap: 13 }}>
      <SectionHeading color="var(--teal)">Income</SectionHeading>
      <DollarInput label="Rental Income (Monthly)" value={a.monthlyRent} onChange={v => setA('monthlyRent', v)} tip="Monthly gross rent. For multi-unit, enter total of all units" />
      <SliderInput label="Vacancy Allowance" value={a.vacancyPct} onChange={v => setA('vacancyPct', v)} min={0} max={20} step={0.5} tip="% of gross rent lost to vacancy/turnover. 4–8% is typical" />
      <SliderInput label="Annual Rent Increase" value={a.rentalIncreaseRatePct} onChange={v => setA('rentalIncreaseRatePct', v)} min={0} max={10} step={0.1} tip="Annual rent escalation. US avg ~3%. Check local rent control laws" />

      <SectionHeading color="var(--red)">Expenses</SectionHeading>
      <SliderInput label="Maintenance Reserve" value={a.maintenanceReservePct} onChange={v => setA('maintenanceReservePct', v)} min={0} max={10} step={0.5} tip="% of income reserved for repairs. 4–8% standard; older homes need more" />
      <SliderInput label="Management Fee" value={a.managementFeePct} onChange={v => setA('managementFeePct', v)} min={0} max={15} step={0.5} tip="% of income to property manager. 8–12% for full-service management" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <DollarInput label="Property Tax (Mo.)" value={a.monthlyPropertyTax} onChange={v => setA('monthlyPropertyTax', v)} tip="Monthly property tax — check county assessor" />
        <DollarInput label="Insurance (Mo.)" value={a.monthlyInsurance} onChange={v => setA('monthlyInsurance', v)} tip="Landlord/hazard insurance" />
        <DollarInput label="HOA (Mo.)" value={a.monthlyHOA} onChange={v => setA('monthlyHOA', v)} tip="$0 for most SFH; can be $200–$800 for condos" />
        <DollarInput label="Utilities (Mo.)" value={a.monthlyUtilities} onChange={v => setA('monthlyUtilities', v)} tip="Owner-paid utilities. $0 if tenant pays all" />
      </div>
      <DollarInput label="Misc Expenses (Mo.)" value={a.monthlyMisc} onChange={v => setA('monthlyMisc', v)} tip="Other recurring: landscaping, pest control, accounting" />

      <SectionHeading color="#6366F1">Escalation Rates</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SliderInput label="Property Tax ↑" value={a.propertyTaxIncreaseRatePct} onChange={v => setA('propertyTaxIncreaseRatePct', v)} min={0} max={5} step={0.1} tip="Annual property tax growth. 1–3% is common" />
        <SliderInput label="Utilities ↑" value={a.utilitiesIncreaseRatePct} onChange={v => setA('utilitiesIncreaseRatePct', v)} min={0} max={5} step={0.1} tip="Annual utility cost growth" />
        <SliderInput label="Misc Expenses ↑" value={a.miscIncreaseRatePct} onChange={v => setA('miscIncreaseRatePct', v)} min={0} max={10} step={0.1} tip="Annual growth for misc expenses" />
        <SliderInput label="Appreciation" value={a.appreciationRatePct} onChange={v => setA('appreciationRatePct', v)} min={0} max={10} step={0.1} tip="Annual property value growth. US avg ~3.5%. Use 1–2% to be conservative" />
      </div>

      <SectionHeading color="#8B5CF6">Closing & Tax</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SliderInput label="Closing Costs (Buy)" value={a.closingCostsBuyPct} onChange={v => setA('closingCostsBuyPct', v)} min={0} max={8} step={0.1} tip="% for title, lender fees, escrow at purchase. Typically 2–5%" />
        <SliderInput label="Closing Costs (Sell)" value={a.closingCostsSellPct} onChange={v => setA('closingCostsSellPct', v)} min={0} max={10} step={0.1} tip="% deducted at exit for IRR. Agent commissions ~5–6%" />
        <SliderInput label="Building / Land Ratio" value={a.buildingToLandRatioPct} onChange={v => setA('buildingToLandRatioPct', v)} min={50} max={95} step={1} tip="% allocable to building (depreciable over 27.5 years). Land is not depreciable" />
      </div>
    </div>
  )
}

// ── Tab 1 Main ───────────────────────────────────────────────────────────────
export function FinancialSummaryTab({ state, setState }) {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Purchase */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)', marginBottom: 14 }}>Purchase</div>
            <PurchaseCard state={state} setState={setState} />
          </div>

          {/* Mortgage */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)', marginBottom: 14 }}>Financing</div>
            <MortgageCard state={state} setState={setState} />
          </div>

          {/* Cash to Purchase */}
          <CashToPurchaseCard state={state} />

          {/* Notes */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)', marginBottom: 10 }}>Notes</div>
            <TextArea
              value={state.meta.notes}
              onChange={v => setState(s => ({ ...s, meta: { ...s.meta, notes: v } }))}
              placeholder="Investment thesis, assumptions, risks, follow-ups…"
              rows={4}
              tip="Document your deal notes and scenario assumptions"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* KPI card */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)' }}>Performance Summary</div>
              <span style={{ fontSize: 11, color: 'var(--navy-subtle)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>Year 1</span>
            </div>
            <KPICard state={state} />
          </div>

          {/* Assumptions */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)', marginBottom: 4 }}>Assumptions</div>
            <AssumptionsCard state={state} setState={setState} />
          </div>
        </div>

      </div>
    </div>
  )
}
