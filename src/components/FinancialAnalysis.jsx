import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ReferenceLine, ResponsiveContainer, ComposedChart
} from 'recharts'
import { buildFullProjection, calcCashToPurchase } from '../utils/finance.js'
import { fmtDollar, fmtPct } from '../utils/format.js'
import { Tooltip } from './UI.jsx'

// ── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTip({ active, payload, label, mode = 'dollar' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--navy)', color: 'white', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-lg)', minWidth: 160 }}>
      <div style={{ fontWeight: 700, marginBottom: 7, color: 'var(--amber)', fontFamily: 'Sora, sans-serif' }}>Year {label}</div>
      {payload.map(p => p.value != null && (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#94A3B8', flex: 1 }}>{p.name}</span>
          <span style={{ fontWeight: 600, fontFamily: 'Sora, sans-serif' }}>
            {mode === 'pct' ? `${Number(p.value).toFixed(1)}%` : fmtDollar(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const axisStyle = { fontSize: 11, fill: 'var(--navy-subtle)' }
const gridStyle = { stroke: '#F1F5F9', strokeDasharray: '3 3' }

// ── Metric card (big) ────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, tip, color = 'var(--navy)' }) {
  return (
    <div className="metric-card">
      <div className="metric-card-label">
        <Tooltip label={label} tip={tip} />
      </div>
      <div className="metric-card-val" style={{ color }}>{value}</div>
      <div className="metric-card-sub">{sub}</div>
    </div>
  )
}

// ── Trend arrow ──────────────────────────────────────────────────────────────
function trend(val, prev) {
  if (!prev || !isFinite(val) || !isFinite(prev)) return null
  const delta = val - prev
  const pct = (delta / Math.abs(prev)) * 100
  const up = delta > 0
  return (
    <span style={{ fontSize: 11, color: up ? 'var(--teal)' : 'var(--red)', marginLeft: 4 }}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

// ── Collapsible table section ────────────────────────────────────────────────
function Collapsible({ title, icon, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <div className="collapse-head" onClick={() => setOpen(o => !o)}>
        <div className="collapse-head-title">
          <span style={{ fontSize: 16 }}>{icon}</span>
          {title}
          {badge && <span style={{ fontSize: 11, color: 'var(--navy-subtle)', fontWeight: 400 }}>{badge}</span>}
        </div>
        <span className={`collapse-caret ${open ? 'open' : ''}`}>▶</span>
      </div>
      {open && <div className="collapse-body">{children}</div>}
    </div>
  )
}

// ── Data table ───────────────────────────────────────────────────────────────
function DataRow({ label, tip, values, years, selYear, fmt = 'dollar', bold, highlight, section }) {
  if (section) {
    return (
      <tr className="t-section">
        <td className="sticky">{label}</td>
        {values.map((_, i) => <td key={i} className={years[i] === selYear ? 'col-sel' : ''} />)}
      </tr>
    )
  }
  return (
    <tr className={highlight ? 't-highlight' : bold ? 't-total' : ''}>
      <td className="sticky">
        {tip ? <Tooltip label={label} tip={tip} /> : label}
      </td>
      {values.map((v, i) => {
        const isSel = years[i] === selYear
        const cls = [isSel ? 'col-sel' : '', isFinite(v) && v > 0 && fmt !== 'label' ? 'pos' : isFinite(v) && v < 0 ? 'neg' : ''].filter(Boolean).join(' ')
        return (
          <td key={i} className={cls}>
            {v === null || v === undefined || !isFinite(v) ? '—' : fmt === 'pct' ? fmtPct(v, 1) : fmtDollar(v)}
          </td>
        )
      })}
    </tr>
  )
}

function AnalysisTable({ rows, years, selYear, get, children }) {
  return (
    <div className="scroll-x">
      <table className="dtable">
        <thead>
          <tr>
            <th className="sticky">Metric</th>
            {years.map(y => (
              <th key={y} style={{ textAlign: 'right', minWidth: 88, background: y === selYear ? 'rgba(245,158,11,0.08)' : undefined, color: y === selYear ? 'var(--amber-dark)' : undefined }}>
                Yr {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

// ── Charts ───────────────────────────────────────────────────────────────────
function CashFlowChart({ rows, selYear }) {
  const data = rows.map(r => ({ year: r.year, 'Annual': Math.round(r.annualCashFlow), 'Monthly': Math.round(r.monthlyCashFlow) }))
  const breakeven = rows.find(r => r.annualCashFlow >= 0)?.year
  return (
    <div className="chart-card">
      <div className="chart-title">Cash Flow</div>
      <div className="chart-sub">Annual & monthly net cash flow over time</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={52} />
          <RTooltip content={<ChartTip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          {breakeven && <ReferenceLine x={breakeven} stroke="var(--teal)" strokeDasharray="4 3" label={{ value: `Y${breakeven}`, fill: 'var(--teal)', fontSize: 10, position: 'insideTopLeft' }} />}
          {selYear && <ReferenceLine x={selYear} stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="3 3" />}
          <Line type="monotone" dataKey="Annual" stroke="var(--amber)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: 'var(--amber)' }} />
          <Line type="monotone" dataKey="Monthly" stroke="var(--teal)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EquityChart({ rows, selYear }) {
  const data = rows.map(r => ({ year: r.year, 'Property Value': Math.round(r.propertyValue), 'Mortgage Balance': Math.round(r.mortgageBalance), 'Equity': Math.round(r.equity) }))
  return (
    <div className="chart-card">
      <div className="chart-title">Equity Growth</div>
      <div className="chart-sub">Property value vs. debt vs. net equity</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gEq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="var(--teal)" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="gDebt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--red)" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="var(--red)" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={58} />
          <RTooltip content={<ChartTip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          {selYear && <ReferenceLine x={selYear} stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="3 3" />}
          <Area type="monotone" dataKey="Property Value" stroke="#CBD5E1" fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          <Area type="monotone" dataKey="Mortgage Balance" stroke="var(--red)" fill="url(#gDebt)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="Equity" stroke="var(--teal)" fill="url(#gEq)" strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function RatesChart({ rows, selYear }) {
  const data = rows.map(r => ({
    year: r.year,
    'Cap Rate': isFinite(r.capRate) ? +(r.capRate * 100).toFixed(2) : null,
    'CoC':      isFinite(r.coc)     ? +(r.coc     * 100).toFixed(2) : null,
    'IRR':      r.irr != null && isFinite(r.irr) ? +(r.irr * 100).toFixed(2) : null,
    'APY':      isFinite(r.apy)     ? +(r.apy     * 100).toFixed(2) : null,
  }))
  return (
    <div className="chart-card">
      <div className="chart-title">Return Rates</div>
      <div className="chart-sub">Cap Rate, CoC, IRR & APY over time</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(0)}%`} width={40} />
          <RTooltip content={<ChartTip mode="pct" />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="var(--border-strong)" />
          {selYear && <ReferenceLine x={selYear} stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="3 3" />}
          <Line type="monotone" dataKey="Cap Rate" stroke="var(--amber)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="CoC" stroke="var(--teal)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="IRR" stroke="#EC4899" strokeWidth={2} dot={false} strokeDasharray="5 3" />
          <Line type="monotone" dataKey="APY" stroke="#6366F1" strokeWidth={2} dot={false} strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ROIChart({ rows, selYear }) {
  const data = rows.map(r => ({
    year: r.year,
    'Cum. Cash Flow': Math.round(r.cumulativeCashFlow),
    'ROI %': isFinite(r.roi) ? +(r.roi * 100).toFixed(1) : null,
  }))
  return (
    <div className="chart-card">
      <div className="chart-title">Cumulative ROI</div>
      <div className="chart-sub">Cash flow accumulated vs. total return %</div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="year" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis yAxisId="l" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={52} />
          <YAxis yAxisId="r" orientation="right" tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={40} />
          <RTooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div style={{ background: 'var(--navy)', color: 'white', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ fontWeight: 700, marginBottom: 7, color: 'var(--amber)', fontFamily: 'Sora, sans-serif' }}>Year {label}</div>
                {payload.map(p => p.value != null && (
                  <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ color: '#94A3B8', flex: 1 }}>{p.name}</span>
                    <span style={{ fontWeight: 600, fontFamily: 'Sora, sans-serif' }}>
                      {p.name === 'ROI %' ? `${Number(p.value).toFixed(1)}%` : fmtDollar(p.value)}
                    </span>
                  </div>
                ))}
              </div>
            )
          }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine yAxisId="r" y={100} stroke="var(--teal)" strokeDasharray="4 3" label={{ value: '100%', fill: 'var(--teal)', fontSize: 10, position: 'insideRight' }} />
          {selYear && <ReferenceLine yAxisId="l" x={selYear} stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="3 3" />}
          <Bar yAxisId="l" dataKey="Cum. Cash Flow" fill="var(--amber)" opacity={0.8} radius={[2, 2, 0, 0]} />
          <Line yAxisId="r" type="monotone" dataKey="ROI %" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main Analysis Tab ────────────────────────────────────────────────────────
export function FinancialAnalysisTab({ state }) {
  const rows = useMemo(() => buildFullProjection(state), [state])
  const years = rows.map(r => r.year)
  const [selYear, setSelYear] = useState(1)

  // Ensure selYear stays in bounds when projection length changes
  const safeYear = Math.min(selYear, years.length)
  const row = rows[safeYear - 1] || rows[0]
  const prevRow = safeYear > 1 ? rows[safeYear - 2] : null

  const get = key => rows.map(r => r[key])

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gap: 24 }}>

      {/* ── Year Selector ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)', marginBottom: 8 }}>
          Select Year
        </div>
        <div className="year-pills">
          {years.map(y => (
            <button key={y} className={`year-pill ${y === safeYear ? 'active' : ''}`} onClick={() => setSelYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ── Big Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <MetricCard
          label="Annual Cash Flow"
          value={fmtDollar(row.annualCashFlow)}
          sub={<>Monthly: <b style={{ color: row.monthlyCashFlow >= 0 ? 'var(--teal)' : 'var(--red)' }}>{fmtDollar(row.monthlyCashFlow)}</b></>}
          color={row.annualCashFlow >= 0 ? 'var(--teal)' : 'var(--red)'}
          tip="Net cash flow after all operating expenses and mortgage payment"
        />
        <MetricCard
          label="Net Operating Income"
          value={fmtDollar(row.noi)}
          sub={<>Cap Rate: <b style={{ color: 'var(--navy)' }}>{fmtPct(row.capRate)}</b></>}
          color="var(--navy)"
          tip="Income minus operating expenses before mortgage — the core profitability measure"
        />
        <MetricCard
          label="Net Equity"
          value={fmtDollar(row.equity)}
          sub={<>Property: <b>{fmtDollar(row.propertyValue)}</b></>}
          color="var(--teal)"
          tip="Property Value minus remaining mortgage balance"
        />
        <MetricCard
          label="Total Return (IRR)"
          value={row.irr != null && isFinite(row.irr) ? fmtPct(row.irr) : '—'}
          sub={<>CoC: <b>{fmtPct(row.coc)}</b> · APY: <b>{fmtPct(row.apy)}</b></>}
          color={row.irr > 0.08 ? 'var(--teal)' : row.irr < 0 ? 'var(--red)' : 'var(--amber-dark)'}
          tip="Internal Rate of Return — gold standard for investment comparison"
        />
      </div>

      {/* ── 2×2 Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <CashFlowChart rows={rows} selYear={safeYear} />
        <EquityChart rows={rows} selYear={safeYear} />
        <RatesChart rows={rows} selYear={safeYear} />
        <ROIChart rows={rows} selYear={safeYear} />
      </div>

      {/* ── Data Tables (collapsible) ── */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--navy-subtle)', marginBottom: 2 }}>
          Detailed Tables
        </div>

        <Collapsible title="Cash Flow" icon="💵" defaultOpen={true} badge={`— Year ${safeYear}: ${fmtDollar(row.annualCashFlow)}/yr`}>
          <AnalysisTable rows={rows} years={years} selYear={safeYear} get={get}>
            <DataRow label="INCOME" years={years} selYear={safeYear} values={years.map(() => null)} section />
            <DataRow label="Gross Scheduled Income" tip="Monthly Rent × 12, escalated annually" years={years} selYear={safeYear} values={get('grossRent')} />
            <DataRow label="Vacancy Allowance" tip="Gross Rent × Vacancy %" years={years} selYear={safeYear} values={get('vacancyAllowance').map(v => -v)} />
            <DataRow label="Total Operating Income" tip="Net income before expenses" years={years} selYear={safeYear} values={get('totalOperatingIncome')} bold />
            <DataRow label="OPERATING EXPENSES" years={years} selYear={safeYear} values={years.map(() => null)} section />
            <DataRow label="Property Taxes" years={years} selYear={safeYear} values={get('propertyTax').map(v => -v)} />
            <DataRow label="Insurance" years={years} selYear={safeYear} values={get('insurance').map(v => -v)} />
            <DataRow label="HOA" years={years} selYear={safeYear} values={get('hoa').map(v => -v)} />
            <DataRow label="Utilities" years={years} selYear={safeYear} values={get('utilities').map(v => -v)} />
            <DataRow label="Misc Expenses" years={years} selYear={safeYear} values={get('misc').map(v => -v)} />
            <DataRow label="Maintenance Reserve" tip="% of operating income" years={years} selYear={safeYear} values={get('maintenanceReserve').map(v => -v)} />
            <DataRow label="Property Management" years={years} selYear={safeYear} values={get('managementFee').map(v => -v)} />
            <DataRow label="Total Operating Expenses" years={years} selYear={safeYear} values={get('totalOpEx').map(v => -v)} bold />
            <DataRow label="CASH FLOW" years={years} selYear={safeYear} values={years.map(() => null)} section />
            <DataRow label="Net Operating Income (NOI)" tip="Operating Income − Operating Expenses" years={years} selYear={safeYear} values={get('noi')} bold />
            <DataRow label="Mortgage Expenses" years={years} selYear={safeYear} values={get('mortgageExpense').map(v => -v)} />
            <DataRow label="Annual Cash Flow" tip="NOI minus mortgage — money in your pocket" years={years} selYear={safeYear} values={get('annualCashFlow')} highlight />
            <DataRow label="Monthly Cash Flow" years={years} selYear={safeYear} values={get('monthlyCashFlow')} />
          </AnalysisTable>
        </Collapsible>

        <Collapsible title="Tax Benefits" icon="🧾" badge={`— Depreciation: ${fmtDollar(row.depreciation)}/yr`}>
          <AnalysisTable rows={rows} years={years} selYear={safeYear} get={get}>
            <DataRow label="Depreciation" tip="(Purchase Price × Building Ratio) ÷ 27.5 — flat each year, non-cash deduction" years={years} selYear={safeYear} values={get('depreciation')} />
            <DataRow label="Mortgage Interest" tip="Interest portion from amortization schedule. $0 for all-cash" years={years} selYear={safeYear} values={get('mortgageInterest')} />
          </AnalysisTable>
        </Collapsible>

        <Collapsible title="Equity Accumulation" icon="📈" badge={`— Yr ${safeYear}: ${fmtDollar(row.equity)}`}>
          <AnalysisTable rows={rows} years={years} selYear={safeYear} get={get}>
            <DataRow label="Property Value" tip="Purchase Price × (1 + Appreciation)^year" years={years} selYear={safeYear} values={get('propertyValue')} />
            <DataRow label="Mortgage Balance" tip="Remaining principal. $0 for all-cash" years={years} selYear={safeYear} values={get('mortgageBalance').map(v => -v)} />
            <DataRow label="Net Equity" tip="Your net wealth in this property" years={years} selYear={safeYear} values={get('equity')} highlight />
          </AnalysisTable>
        </Collapsible>

        <Collapsible title="Financial Performance" icon="⚡" badge={`— IRR: ${row.irr != null && isFinite(row.irr) ? fmtPct(row.irr) : '—'} · CoC: ${fmtPct(row.coc)}`}>
          <AnalysisTable rows={rows} years={years} selYear={safeYear} get={get}>
            <DataRow label="Cap Rate" tip="NOI ÷ Purchase Price. ≥6% = good" years={years} selYear={safeYear} values={get('capRate')} fmt="pct" />
            <DataRow label="Cash on Cash (CoC)" tip="Cash Flow ÷ Total Cash Invested. ≥8% = excellent" years={years} selYear={safeYear} values={get('coc')} fmt="pct" />
            <DataRow label="Return on Equity (ROE)" tip="Cash Flow ÷ Current Equity" years={years} selYear={safeYear} values={get('roe')} fmt="pct" />
            <DataRow label="Annualized Return (APY)" tip="Annualized total return — comparable to stock returns" years={years} selYear={safeYear} values={get('apy')} fmt="pct" />
            <DataRow label="IRR" tip="Internal Rate of Return — gold standard metric" years={years} selYear={safeYear} values={get('irr')} fmt="pct" highlight />
            <DataRow label="Cumulative ROI" tip="(Cumulative Cash Flows + Equity Gain) ÷ Total Cash" years={years} selYear={safeYear} values={get('roi')} fmt="pct" />
          </AnalysisTable>
        </Collapsible>
      </div>
    </div>
  )
}
