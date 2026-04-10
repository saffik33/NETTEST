import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { WiFiSnapshot } from '../../api/endpoints'
import { formatTime } from '../../utils/dateUtils'
import { CHART_COLORS, CHART_GRID, CHART_AXIS, CHART_TOOLTIP } from '../../utils/chartTheme'

interface Props {
  data: WiFiSnapshot[]
}

export default function SignalStrengthChart({ data }: Props) {
  const chartData = [...data].reverse().map((d) => ({
    time: formatTime(d.timestamp),
    signal: d.signal_pct ?? 0,
    rssi: d.rssi_dbm ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="signalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.signal} stopOpacity={0.25} />
            <stop offset="95%" stopColor={CHART_COLORS.signal} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="time" {...CHART_AXIS} />
        <YAxis {...CHART_AXIS} unit="%" domain={[0, 100]} />
        <Tooltip {...CHART_TOOLTIP} />
        <Area type="monotone" dataKey="signal" name="Signal %" stroke={CHART_COLORS.signal} fill="url(#signalGrad)" strokeWidth={2} animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
