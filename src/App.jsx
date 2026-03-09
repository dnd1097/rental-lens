import React, { useState, useEffect, useCallback, useRef } from 'react'
import { PropertyIdentityBar, FinancialSummaryTab } from './components/FinancialSummary.jsx'
import { FinancialAnalysisTab } from './components/FinancialAnalysis.jsx'
import { SimulationsDrawer } from './components/SimulationsDrawer.jsx'
import { Button, Toast, Dialog } from './components/UI.jsx'
import { DEFAULT_STATE, calcKPISummary } from './utils/finance.js'
import { fmtPct, fmtDollar } from './utils/format.js'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_PREFIX = 'yieldlens_sim_'
const LAST_STATE_KEY = 'yieldlens_last_state'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadAllSims() {
  const sims = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const sim = JSON.parse(localStorage.getItem(key))
        sims.push(sim)
      } catch (e) {}
    }
  }
  sims.sort((a, b) => new Date(b.meta.savedAt) - new Date(a.meta.savedAt))
  return sims
}

function saveToStorage(state, kpi) {
  const id = state.meta.id || genId()
  const sim = {
    ...state,
    _kpi: kpi,
    meta: { ...state.meta, id, savedAt: new Date().toISOString() },
  }
  localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(sim))
  localStorage.setItem(LAST_STATE_KEY, JSON.stringify(sim))
  return sim
}

function mergeWithDefaults(saved) {
  // Deep merge saved state with defaults to handle new fields added after save
  return {
    meta: { ...DEFAULT_STATE.meta, ...saved.meta },
    purchase: { ...DEFAULT_STATE.purchase, ...saved.purchase },
    mortgage: { ...DEFAULT_STATE.mortgage, ...saved.mortgage },
    assumptions: { ...DEFAULT_STATE.assumptions, ...saved.assumptions },
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setStateRaw] = useState(() => {
    try {
      const last = localStorage.getItem(LAST_STATE_KEY)
      if (last) return mergeWithDefaults(JSON.parse(last))
    } catch (e) {}
    return { ...DEFAULT_STATE }
  })

  const [activeTab, setActiveTab] = useState('summary')
  const [simulations, setSimulations] = useState(() => loadAllSims())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [newSimDialog, setNewSimDialog] = useState(false)
  const [resumePrompt, setResumePrompt] = useState(false)

  const isFirstLoad = useRef(true)

  // Show resume prompt on first load if there are saved sims
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      const sims = loadAllSims()
      if (sims.length > 0 && !localStorage.getItem(LAST_STATE_KEY)) {
        setResumePrompt(true)
      }
    }
  }, [])

  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Auto-save last state
      try {
        localStorage.setItem(LAST_STATE_KEY, JSON.stringify(next))
      } catch (e) {}
      return next
    })
  }, [])

  const reloadSims = () => setSimulations(loadAllSims())

  const handleSave = () => {
    const kpi = calcKPISummary(state)
    const saved = saveToStorage(
      state.meta.id ? state : { ...state, meta: { ...state.meta, id: genId() } },
      kpi
    )
    setStateRaw(s => ({ ...s, meta: saved.meta }))
    reloadSims()
    setToast('Simulation saved successfully')
  }

  const handleLoad = (sim) => {
    setState(mergeWithDefaults(sim))
    setToast(`Loaded: ${sim.meta.simulationName || 'Simulation'}`)
  }

  const handleDelete = (id) => {
    localStorage.removeItem(STORAGE_PREFIX + id)
    reloadSims()
  }

  const handleDuplicate = (sim) => {
    const newId = genId()
    const copy = {
      ...sim,
      _kpi: sim._kpi,
      meta: {
        ...sim.meta,
        id: newId,
        simulationName: (sim.meta.simulationName || 'Simulation') + ' (Copy)',
        savedAt: new Date().toISOString(),
      },
    }
    localStorage.setItem(STORAGE_PREFIX + newId, JSON.stringify(copy))
    reloadSims()
    setToast('Simulation duplicated')
  }

  const handleNew = () => {
    setState({ ...DEFAULT_STATE, meta: { ...DEFAULT_STATE.meta, id: null } })
    setNewSimDialog(false)
    setToast('New simulation started')
  }

  const handlePrint = () => {
    window.print()
  }

  const kpi = calcKPISummary(state)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header className="no-print" style={{
        background: 'var(--navy)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', height: 54, gap: 0,
        position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'linear-gradient(135deg, #F59E0B, #F97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>⬡</div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 16, color: 'white', letterSpacing: '-0.02em' }}>
            Yield<span style={{ color: '#F59E0B' }}>Lens</span>
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 20px' }} />

        {/* Live KPI pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <KpiPill label="Cap Rate" value={fmtPct(kpi.capRate)} good={kpi.capRate >= 0.06} bad={kpi.capRate < 0.04} />
          <KpiPill label="CoC" value={fmtPct(kpi.coc)} good={kpi.coc >= 0.08} bad={kpi.coc < 0.04} />
          <KpiPill label="Mo. CF" value={fmtDollar(kpi.monthlyCashFlow1)} good={kpi.monthlyCashFlow1 > 0} bad={kpi.monthlyCashFlow1 < 0} />
        </div>

        {/* Tab switcher — centered */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {[{ id: 'summary', label: 'Summary' }, { id: 'analysis', label: 'Analysis' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? 'rgba(245,158,11,0.15)' : 'transparent',
              border: 'none', borderRadius: 8,
              color: activeTab === t.id ? '#F59E0B' : 'rgba(255,255,255,0.45)',
              fontWeight: 600, fontSize: 13, padding: '5px 16px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.13s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <HeaderBtn onClick={handlePrint}>Print</HeaderBtn>
          <HeaderBtn onClick={() => setNewSimDialog(true)}>+ New</HeaderBtn>
          <HeaderBtn onClick={() => { reloadSims(); setDrawerOpen(true) }}>
            Simulations {simulations.length > 0 && <span className="badge" style={{ marginLeft: 4 }}>{simulations.length}</span>}
          </HeaderBtn>
          <button onClick={handleSave} style={{
            background: '#F59E0B', border: 'none', color: '#0D1B2A',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            Save
          </button>
        </div>
      </header>

      {/* ── Property Identity Bar ── */}
      <PropertyIdentityBar state={state} setState={setState} />

      {/* ── Tab Content ── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'summary' && <FinancialSummaryTab state={state} setState={setState} />}
        {activeTab === 'analysis' && <FinancialAnalysisTab state={state} />}
      </main>

      {/* ── Print-only Summary ── */}
      <div style={{ display: 'none' }} className="print-section">
        <PrintSummary state={state} kpi={kpi} />
      </div>

      {/* ── Footer ── */}
      <footer className="no-print" style={{
        borderTop: '1px solid var(--border)',
        padding: '9px 28px', fontSize: 11, color: 'var(--navy-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        background: 'var(--surface)',
      }}>
        <span>🔒 All data stays in your browser — nothing sent to any server</span>
        <span>YieldLens · React + Recharts</span>
      </footer>

      {/* ── Drawer ── */}
      <SimulationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        simulations={simulations}
        onLoad={handleLoad}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* ── New Sim Dialog ── */}
      <Dialog
        open={newSimDialog}
        onClose={() => setNewSimDialog(false)}
        title="Start New Simulation?"
      >
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: 20 }}>
          This will clear all current inputs and reset to defaults. Make sure to save your current simulation first if you want to keep it.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setNewSimDialog(false)}>Cancel</Button>
          <Button variant="secondary" onClick={handleNew}>Start Fresh</Button>
        </div>
      </Dialog>

      {/* ── Resume Prompt ── */}
      {resumePrompt && (
        <div className="toast" style={{ bottom: '1.5rem', right: '1.5rem', maxWidth: 340 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Welcome back to YieldLens!</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: 12 }}>
            You have {simulations.length} saved simulation{simulations.length !== 1 ? 's' : ''}. Would you like to load one?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setDrawerOpen(true); setResumePrompt(false) }}
              style={{ background: '#F59E0B', border: 'none', color: '#0F1C2E', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
            >
              Browse Simulations
            </button>
            <button
              onClick={() => setResumePrompt(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94A3B8', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function KpiPill({ label, value, good, bad }) {
  const color = good ? '#0D9488' : bad ? '#EF4444' : 'rgba(255,255,255,0.45)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '4px 10px',
    }}>
      <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13.5, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function HeaderBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '5px 12px',
      cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
    >{children}</button>
  )
}

function PrintSummary({ state, kpi }) {
  return (
    <div style={{ padding: 40, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F1C2E', marginBottom: 4 }}>YieldLens Investment Report</h1>
      <div style={{ color: '#64748B', marginBottom: 24, fontSize: 13 }}>
        Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div><strong>Simulation:</strong> {state.meta.simulationName || '—'}</div>
        <div><strong>Address:</strong> {state.meta.propertyAddress || '—'}</div>
        <div><strong>Type:</strong> {state.meta.propertyType}</div>
        <div><strong>Purchase Price:</strong> ${state.purchase.purchasePrice.toLocaleString()}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Cap Rate', value: fmtPct(kpi.capRate) },
          { label: 'Cash-on-Cash', value: fmtPct(kpi.coc) },
          { label: 'Monthly Cash Flow', value: fmtDollar(kpi.monthlyCashFlow1) },
          { label: 'Equity (Year 5)', value: fmtDollar(kpi.equity5) },
        ].map(k => (
          <div key={k.label} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E' }}>{k.value}</div>
          </div>
        ))}
      </div>
      {state.meta.notes && (
        <div>
          <strong>Notes:</strong>
          <p style={{ color: '#475569', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{state.meta.notes}</p>
        </div>
      )}
    </div>
  )
}
