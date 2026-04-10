export function formatSpeed(mbps: number | null | undefined): string {
  if (mbps == null) return '--'
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`
  return `${mbps.toFixed(1)} Mbps`
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return '--'
  return `${ms.toFixed(1)} ms`
}

export function formatPercent(pct: number | null | undefined): string {
  if (pct == null) return '--'
  return `${pct.toFixed(1)}%`
}

export function formatSignal(dbm: number | null | undefined): string {
  if (dbm == null) return '--'
  return `${dbm} dBm`
}
