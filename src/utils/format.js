/**
 * Formatting helpers for YieldLens
 */

export function fmtDollar(value, decimals = 0) {
  if (value === null || value === undefined || !isFinite(value)) return '—'
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return value < 0 ? `-$${formatted}` : `$${formatted}`
}

export function fmtPct(value, decimals = 1) {
  if (value === null || value === undefined || !isFinite(value)) return '—'
  return `${(value * 100).toFixed(decimals)}%`
}

export function fmtPctRaw(value, decimals = 1) {
  // value is already in percent (e.g. 7.5 for 7.5%)
  if (value === null || value === undefined || !isFinite(value)) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

export function fmtDollarCompact(value) {
  if (!isFinite(value)) return '—'
  if (Math.abs(value) >= 1_000_000) {
    return `${value < 0 ? '-' : ''}$${(Math.abs(value) / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${value < 0 ? '-' : ''}$${(Math.abs(value) / 1_000).toFixed(0)}K`
  }
  return fmtDollar(value)
}

export function numClass(value) {
  if (!isFinite(value) || value === 0) return ''
  return value > 0 ? 'num-positive' : 'num-negative'
}

export function trafficLight(value, thresholds) {
  // thresholds = { green: x, yellow: y } — value >= green → green, >= yellow → yellow, else red
  if (!isFinite(value)) return 'kpi-neutral'
  if (value >= thresholds.green) return 'kpi-green'
  if (value >= thresholds.yellow) return 'kpi-yellow'
  return 'kpi-red'
}
