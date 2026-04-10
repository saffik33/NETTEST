import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { CHART_COLORS, CHART_GRID, CHART_AXIS, CHART_TOOLTIP } from '../../utils/chartTheme'

interface Props {
  data: { date: string; score: number | null }[]
}

export default function HealthTimelineChart({ data }: Props) {
  const chartData = data.map(d => ({
    date: d.date.slice(5),
    score: d.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.health} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.health} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="date" {...CHART_AXIS} />
        <YAxis domain={[0, 100]} {...CHART_AXIS} />
        <Tooltip
          {...CHART_TOOLTIP}
          formatter={(value) => [`${value}/100`, 'Score']}
        />
        <ReferenceLine y={80} stroke={CHART_COLORS.upGreen} strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={40} stroke={CHART_COLORS.downRed} strokeDasharray="3 3" strokeOpacity={0.4} />
        <Area
          type="monotone"
          dataKey="score"
          stroke={CHART_COLORS.health}
          strokeWidth={2}
          fill="url(#healthGrad)"
          connectNulls
          dot={{ r: 3, fill: CHART_COLORS.health, strokeWidth: 0 }}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
