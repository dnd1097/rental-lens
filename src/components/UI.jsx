import React, { useState, useRef, useEffect } from 'react'

// ── Info icon ────────────────────────────────────────────────────────────────
function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="4.5" r="0.9" fill="currentColor"/>
    </svg>
  )
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
export function Tooltip({ label, tip }) {
  if (!tip) return <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-muted)' }}>{label}</span>
  return (
    <span className="tip-wrap" style={{ gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-muted)' }}>{label}</span>
      <span className="tip-icon"><InfoIcon /></span>
      <span className="tip-box">{tip}</span>
    </span>
  )
}

// ── Dollar Input ─────────────────────────────────────────────────────────────
export function DollarInput({ value, onChange, label, tip, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const display = editing ? raw : (isFinite(value) && value !== '' ? Number(value).toLocaleString('en-US') : '')

  return (
    <div>
      {label && <div className="field-label"><Tooltip label={label} tip={tip} /></div>}
      <div className="input-prefix-wrap">
        <span className="input-prefix">$</span>
        <input
          className="input"
          value={display}
          placeholder={placeholder || '0'}
          onFocus={() => { setEditing(true); setRaw(String(value ?? '')) }}
          onChange={e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
          onBlur={() => {
            setEditing(false)
            const n = parseFloat(raw)
            if (!isNaN(n)) onChange(n)
          }}
        />
      </div>
    </div>
  )
}

// ── Text Input ───────────────────────────────────────────────────────────────
export function TextInput({ value, onChange, label, tip, placeholder }) {
  return (
    <div>
      {label && <div className="field-label"><Tooltip label={label} tip={tip} /></div>}
      <input className="input" value={value} placeholder={placeholder || ''} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

// ── Textarea ─────────────────────────────────────────────────────────────────
export function TextArea({ value, onChange, label, tip, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <div className="field-label"><Tooltip label={label} tip={tip} /></div>}
      <textarea
        className="input"
        style={{ resize: 'vertical', minHeight: rows * 28 }}
        value={value}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────────────────────
export function SelectInput({ value, onChange, label, tip, options }) {
  return (
    <div>
      {label && <div className="field-label"><Tooltip label={label} tip={tip} /></div>}
      <select className="input" value={value} onChange={e => onChange(e.target.value)} style={{ cursor: 'pointer' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Slider ───────────────────────────────────────────────────────────────────
export function SliderInput({ value, onChange, label, tip, min, max, step = 0.1, format = 'pct' }) {
  const pct = ((value - min) / (max - min)) * 100

  const handleChange = e => {
    let v = parseFloat(e.target.value)
    if (format === 'years') {
      const allowed = [10, 15, 20, 25, 30]
      v = allowed.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a)
    }
    onChange(v)
  }

  const displayValue =
    format === 'pct' ? `${Number(value).toFixed(1)}%` :
    format === 'years' ? `${value} yr` : value

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div className="field-label" style={{ margin: 0 }}><Tooltip label={label} tip={tip} /></div>
        <span style={{
          fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700,
          color: 'var(--navy)', background: 'var(--surface-2)',
          padding: '3px 9px', borderRadius: 6, border: '1.5px solid var(--border)',
          minWidth: 54, textAlign: 'center', letterSpacing: '-0.01em'
        }}>{displayValue}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={handleChange}
        style={{ background: `linear-gradient(to right, var(--amber) 0%, var(--amber) ${pct}%, var(--border) ${pct}%, var(--border) 100%)` }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10.5, color: 'var(--navy-subtle)' }}>
          {format === 'pct' ? `${min}%` : format === 'years' ? `${min}yr` : min}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--navy-subtle)' }}>
          {format === 'pct' ? `${max}%` : format === 'years' ? `${max}yr` : max}
        </span>
      </div>
    </div>
  )
}

// ── Row (label + value) ──────────────────────────────────────────────────────
export function ComputedRow({ label, value, tip, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--navy-muted)' }}><Tooltip label={label} tip={tip} /></span>
      <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 13.5, fontWeight: 700, color: accent || 'var(--navy)' }}>{value}</span>
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', disabled, style, size }) {
  const cls = `btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''}`
  return <button className={cls} onClick={onClick} disabled={disabled} style={style}>{children}</button>
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="toast">
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--navy-subtle)', cursor: 'pointer', padding: 0, fontSize: 14 }}>✕</button>
    </div>
  )
}

// ── Dialog ───────────────────────────────────────────────────────────────────
export function Dialog({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="dialog">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy-subtle)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </>
  )
}

// ── Section heading (inline divider style) ───────────────────────────────────
export function SectionHeading({ children, color = 'var(--navy-subtle)' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color, margin: '14px 0 10px'
    }}>
      <div style={{ width: 3, height: 12, background: color, borderRadius: 2, flexShrink: 0 }} />
      {children}
    </div>
  )
}
