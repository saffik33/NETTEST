import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PingResult } from '../../api/endpoints'
import { formatTime } from '../../utils/dateUtils'
import { CHART_COLORS, CHART_GRID, CHART_AXIS, CHART_TOOLTIP } from '../../utils/chartTheme'

interface Props {
  data: PingResult[]
}

export default function PingLineChart({ data }: Props) {
  const chartData = [...data].reverse().map((d) => ({
    time: formatTime(d.timestamp),
    latency: d.avg_latency_ms,
    jitter: d.jitter_ms,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="time" {...CHART_AXIS} />
        <YAxis {...CHART_AXIS} unit=" ms" />
        <Tooltip {...CHART_TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
        <Line type="monotone" dataKey="latency" name="Latency" stroke={CHART_COLORS.latency} strokeWidth={2} dot={false} animationDuration={800} />
        <Line type="monotone" dataKey="jitter" name="Jitter" stroke={CHART_COLORS.jitter} strokeWidth={2} dot={false} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  )
}
