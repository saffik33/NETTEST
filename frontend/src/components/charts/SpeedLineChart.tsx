import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { SpeedTestResult } from '../../api/endpoints'
import { formatTime } from '../../utils/dateUtils'
import { CHART_COLORS, CHART_GRID, CHART_AXIS, CHART_TOOLTIP } from '../../utils/chartTheme'

interface Props {
  data: SpeedTestResult[]
}

export default function SpeedLineChart({ data }: Props) {
  const chartData = [...data].reverse().map((d) => ({
    time: formatTime(d.timestamp),
    download: d.download_mbps,
    upload: d.upload_mbps,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.download} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.download} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.upload} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.upload} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="time" {...CHART_AXIS} />
        <YAxis {...CHART_AXIS} unit=" Mbps" />
        <Tooltip {...CHART_TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
        <Area type="monotone" dataKey="download" name="Download" stroke={CHART_COLORS.download} strokeWidth={2} fill="url(#dlGrad)" dot={false} animationDuration={800} />
        <Area type="monotone" dataKey="upload" name="Upload" stroke={CHART_COLORS.upload} strokeWidth={2} fill="url(#ulGrad)" dot={false} animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
