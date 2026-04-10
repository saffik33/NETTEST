export const CHART_COLORS = {
  download: '#00d4ff',
  upload: '#10b981',
  latency: '#f59e0b',
  jitter: '#f43f5e',
  signal: '#a78bfa',
  health: '#00d4ff',
  upGreen: '#34d399',
  downRed: '#f87171',
} as const

export const CHART_GRID = {
  stroke: 'rgba(255,255,255,0.05)',
  strokeDasharray: '3 3',
}

export const CHART_GRID_LIGHT = {
  stroke: 'rgba(0,0,0,0.06)',
  strokeDasharray: '3 3',
}

export const CHART_AXIS = {
  stroke: 'rgba(255,255,255,0.15)',
  fontSize: 11,
  fontFamily: 'Inter, system-ui',
}

export const CHART_AXIS_LIGHT = {
  stroke: 'rgba(0,0,0,0.2)',
  fontSize: 11,
  fontFamily: 'Inter, system-ui',
}

export const CHART_TOOLTIP = {
  contentStyle: {
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#e5e7eb',
    fontSize: 12,
    padding: '8px 12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
}

export function makeGradient(id: string, color: string, opacity = 0.3) {
  return { id, color, opacity }
}
