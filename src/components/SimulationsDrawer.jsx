import React, { useState } from 'react'
import { Button, Dialog } from './UI.jsx'
import { fmtDollar, fmtPct } from '../utils/format.js'
import { calcKPISummary } from '../utils/finance.js'

function groupByAddress(sims) {
  const groups = {}
  sims.forEach(sim => {
    const addr = sim.meta.propertyAddress || 'No Address'
    if (!groups[addr]) groups[addr] = []
    groups[addr].push(sim)
  })
  return groups
}

export function SimulationsDrawer({ open, onClose, simulations, onLoad, onDelete, onDuplicate }) {
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!open) return null

  const groups = groupByAddress(simulations)

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F1C2E' }}>
              Saved Simulations
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
              {simulations.length} simulation{simulations.length !== 1 ? 's' : ''} saved locally
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
          {simulations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '48px 0', fontSize: '0.875rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📂</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No saved simulations</div>
              <div>Use the Save button to store your current simulation</div>
            </div>
          ) : (
            Object.entries(groups).map(([addr, sims]) => (
              <div key={addr} style={{ marginBottom: 24 }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700, color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #F1F5F9'
                }}>
                  📍 {addr}
                </div>
                {sims.map(sim => {
                  const kpi = sim._kpi || ((() => {
                    try { return calcKPISummary(sim) } catch { return null }
                  })())
                  return (
                    <SimCard
                      key={sim.meta.id || sim.meta.savedAt}
                      sim={sim}
                      kpi={kpi}
                      onLoad={() => { onLoad(sim); onClose() }}
                      onDelete={() => setConfirmDelete(sim)}
                      onDuplicate={() => onDuplicate(sim)}
                    />
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #E2E8F0',
          fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center',
          flexShrink: 0
        }}>
          🔒 Simulations are saved locally in your browser and persist between sessions
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete Simulation?"
      >
        <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: 20 }}>
          Are you sure you want to delete <strong>{confirmDelete?.meta.simulationName || 'this simulation'}</strong>?
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            onDelete(confirmDelete.meta.id || confirmDelete.meta.savedAt)
            setConfirmDelete(null)
          }}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  )
}

function SimCard({ sim, kpi, onLoad, onDelete, onDuplicate }) {
  const name = sim.meta.simulationName || 'Unnamed Simulation'
  const date = sim.meta.savedAt
    ? new Date(sim.meta.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const capRate = kpi?.capRate
  const coc = kpi?.coc
  const monthlyCF = kpi?.monthlyCashFlow1

  return (
    <div style={{
      background: '#F8F9FB', borderRadius: 10, padding: '14px 16px',
      marginBottom: 10, border: '1px solid #E2E8F0',
      transition: 'border-color 0.15s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F1C2E', marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{sim.meta.propertyType} · Saved {date}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="ghost" onClick={onDuplicate}>Copy</Button>
          <Button size="sm" variant="primary" onClick={onLoad}>Load</Button>
        </div>
      </div>

      {/* KPIs */}
      {kpi && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <KpiPill label="Cap Rate" value={fmtPct(capRate)} color={capRate >= 0.06 ? '#0D9488' : capRate >= 0.04 ? '#D97706' : '#EF4444'} />
          <KpiPill label="CoC" value={fmtPct(coc)} color={coc >= 0.08 ? '#0D9488' : coc >= 0.04 ? '#D97706' : '#EF4444'} />
          <KpiPill label="Mo. CF" value={fmtDollar(monthlyCF)} color={monthlyCF >= 0 ? '#0D9488' : '#EF4444'} />
        </div>
      )}

      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: '#EF4444', cursor: 'pointer', padding: 0 }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function KpiPill({ label, value, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 6, padding: '6px 8px', border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color, fontFamily: 'Sora, sans-serif' }}>{value}</div>
    </div>
  )
}
