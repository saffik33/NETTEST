import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { wsClient, type WSMessage } from '../api/websocket'
import { CHART_COLORS, CHART_GRID, CHART_AXIS, CHART_TOOLTIP } from '../utils/chartTheme'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import SummaryCard from '../components/dashboard/SummaryCard'
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react'

interface DataPoint {
  time: string
  download: number
  upload: number
}

const MAX_POINTS = 120

export default function BandwidthPage() {
  const [data, setData] = useState<DataPoint[]>([])
  const [interfaces, setInterfaces] = useState<Record<string, { download_mbps: number; upload_mbps: number }>>({})
  const [peakDown, setPeakDown] = useState(0)
  const [peakUp, setPeakUp] = useState(0)

  const handleMessage = useCallback((msg: WSMessage) => {
    if (msg.type !== 'bandwidth_update') return
    const payload = msg.payload as {
      total_download_mbps: number
      total_upload_mbps: number
      interfaces: Record<string, { download_mbps: number; upload_mbps: number }>
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dl = payload.total_download_mbps
    const ul = payload.total_upload_mbps

    setData(prev => {
      const next = [...prev, { time: now, download: dl, upload: ul }]
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
    })
    setInterfaces(payload.interfaces)
    setPeakDown(prev => Math.max(prev, dl))
    setPeakUp(prev => Math.max(prev, ul))
  }, [])

  useEffect(() => {
    const unsub = wsClient.onMessage(handleMessage)
    return unsub
  }, [handleMessage])

  const latestDown = data.length > 0 ? data[data.length - 1].download : 0
  const latestUp = data.length > 0 ? data[data.length - 1].upload : 0

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Live Bandwidth</h2>

      {/* Current throughput cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Download" value={`${latestDown.toFixed(2)} Mbps`} icon={<ArrowDown size={18} />} index={0} liveRegion />
        <SummaryCard label="Upload" value={`${latestUp.toFixed(2)} Mbps`} icon={<ArrowUp size={18} />} index={1} liveRegion />
        <SummaryCard label="Peak Download" value={`${peakDown.toFixed(2)} Mbps`} icon={<TrendingUp size={18} />} index={2} />
        <SummaryCard label="Peak Upload" value={`${peakUp.toFixed(2)} Mbps`} icon={<TrendingUp size={18} />} index={3} />
      </div>

      {/* Live chart */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">Real-Time Throughput</h3>
        {data.length > 1 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="bwDlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.download} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.download} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bwUlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.upload} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.upload} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="time" {...CHART_AXIS} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis {...CHART_AXIS} tick={{ fontSize: 11 }} unit=" Mbps" />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="download" name="Download" stroke={CHART_COLORS.download} strokeWidth={2} fill="url(#bwDlGrad)" animationDuration={800} />
              <Area type="monotone" dataKey="upload" name="Upload" stroke={CHART_COLORS.upload} strokeWidth={2} fill="url(#bwUlGrad)" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center dark:text-gray-500 text-gray-400">
            Waiting for bandwidth data... updates every 1.5 seconds
          </div>
        )}
      </GlassCard>

      {/* Per-interface breakdown */}
      {Object.keys(interfaces).length > 0 && (
        <GlassCard noPadding>
          <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
            <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">Per-Interface</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="glass-table-head">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Interface</th>
                  <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Download</th>
                  <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Upload</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
                {Object.entries(interfaces).map(([name, stats]) => (
                  <tr key={name} className="glass-table-row transition-colors">
                    <td className="px-4 py-3 dark:text-gray-100 text-gray-900 font-mono text-xs">{name}</td>
                    <td className="px-4 py-3 text-right text-accent font-medium tabular-nums">{stats.download_mbps.toFixed(3)} Mbps</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium tabular-nums">{stats.upload_mbps.toFixed(3)} Mbps</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </AnimatedPage>
  )
}
