import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'
import type { UptimeProbe } from '../../api/endpoints'
import { CHART_COLORS, CHART_TOOLTIP } from '../../utils/chartTheme'

interface Props {
  probes: UptimeProbe[]
}

export default function UptimeTimeline({ probes }: Props) {
  const chartData = probes.map((p, i) => ({
    index: i,
    value: 1,
    is_up: p.is_up,
    latency: p.latency_ms,
    time: new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={chartData} barGap={0} barCategoryGap={0} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="index" hide />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            {...CHART_TOOLTIP}
            formatter={(_value, _name, props) => {
              const d = props.payload as typeof chartData[number] | undefined
              if (!d) return ['', '']
              return [d.is_up ? `UP (${d.latency ?? '?'}ms)` : 'DOWN', d.time]
            }}
            labelFormatter={() => ''}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.is_up ? CHART_COLORS.upGreen : CHART_COLORS.downRed} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-2 text-xs dark:text-gray-500 text-gray-400">
        <span>{chartData.length > 0 ? chartData[0].time : ''}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Up</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Down</span>
        </div>
        <span>{chartData.length > 0 ? chartData[chartData.length - 1].time : ''}</span>
      </div>
    </div>
  )
}
