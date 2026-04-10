import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ChannelInfo } from '../../api/endpoints'
import { CHART_GRID, CHART_AXIS, CHART_TOOLTIP } from '../../utils/chartTheme'

interface Props {
  channels: ChannelInfo[]
  currentChannel: number | null
  band: '2.4 GHz' | '5 GHz'
}

function getCongestionColor(score: number): string {
  if (score === 0) return '#34d399'
  if (score <= 30) return '#a3e635'
  if (score <= 60) return '#fbbf24'
  if (score <= 80) return '#fb923c'
  return '#f87171'
}

export default function ChannelCongestionChart({ channels, currentChannel, band }: Props) {
  const filtered = channels.filter(c => c.band === band)
  const chartData = filtered.map(c => ({
    channel: `Ch ${c.channel}`,
    congestion: c.congestion_score,
    networks: c.network_count,
    isCurrent: c.channel === currentChannel,
    raw: c,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="channel" {...CHART_AXIS} fontSize={10} />
          <YAxis domain={[0, 100]} {...CHART_AXIS} label={{ value: 'Congestion', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
          <Tooltip
            {...CHART_TOOLTIP}
            formatter={(_value, _name, props) => {
              const d = props.payload as typeof chartData[number] | undefined
              if (!d) return ['', '']
              return [`Score: ${d.congestion}, Networks: ${d.networks}${d.isCurrent ? ' (YOUR CHANNEL)' : ''}`, d.raw.band]
            }}
          />
          <Bar dataKey="congestion" radius={[4, 4, 0, 0]} animationDuration={800}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={getCongestionColor(entry.congestion)}
                fillOpacity={0.85}
                stroke={entry.isCurrent ? '#00d4ff' : 'none'}
                strokeWidth={entry.isCurrent ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs dark:text-gray-500 text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Empty</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Congested</span>
        {currentChannel && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded border-2 border-accent" /> Your channel
          </span>
        )}
      </div>
    </div>
  )
}
