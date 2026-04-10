export const SPEED_THRESHOLDS = {
  good: 50,
  fair: 25,
  poor: 10,
}

export const LATENCY_THRESHOLDS = {
  good: 30,
  fair: 100,
  poor: 200,
}

export function getSpeedColor(mbps: number): string {
  if (mbps >= SPEED_THRESHOLDS.good) return 'text-green-500'
  if (mbps >= SPEED_THRESHOLDS.fair) return 'text-yellow-500'
  return 'text-red-500'
}

export function getLatencyColor(ms: number): string {
  if (ms <= LATENCY_THRESHOLDS.good) return 'text-green-500'
  if (ms <= LATENCY_THRESHOLDS.fair) return 'text-yellow-500'
  return 'text-red-500'
}
