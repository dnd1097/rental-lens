import { useState, useEffect, useCallback } from 'react'

const STORAGE_PREFIX = 'yieldlens_sim_'
const LAST_STATE_KEY = 'yieldlens_last_state'

export function useSimulations() {
  const [simulations, setSimulations] = useState([])

  const loadAll = useCallback(() => {
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
    setSimulations(sims)
    return sims
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const save = useCallback((state, kpiSummary) => {
    const sim = {
      ...state,
      _kpi: kpiSummary,
      meta: {
        ...state.meta,
        savedAt: new Date().toISOString(),
      },
    }
    const key = STORAGE_PREFIX + (sim.meta.id || Date.now())
    localStorage.setItem(key, JSON.stringify(sim))
    saveLastState(state)
    loadAll()
    return sim
  }, [loadAll])

  const deleteSim = useCallback((id) => {
    localStorage.removeItem(STORAGE_PREFIX + id)
    loadAll()
  }, [loadAll])

  const duplicate = useCallback((sim) => {
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const copy = {
      ...sim,
      meta: {
        ...sim.meta,
        id: newId,
        simulationName: (sim.meta.simulationName || 'Simulation') + ' (Copy)',
        savedAt: new Date().toISOString(),
      },
    }
    localStorage.setItem(STORAGE_PREFIX + newId, JSON.stringify(copy))
    loadAll()
    return copy
  }, [loadAll])

  return { simulations, save, deleteSim, duplicate, reload: loadAll }
}

export function saveLastState(state) {
  localStorage.setItem(LAST_STATE_KEY, JSON.stringify(state))
}

export function loadLastState() {
  try {
    const raw = localStorage.getItem(LAST_STATE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return null
}

export function hasAnySaved() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) return true
  }
  return false
}
