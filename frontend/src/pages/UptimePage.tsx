import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { dashboardApi } from '../api/endpoints'
import SummaryCard from '../components/dashboard/SummaryCard'
import UptimeTimeline from '../components/charts/UptimeTimeline'
import { formatDateTime } from '../utils/dateUtils'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import { SkeletonCard } from '../components/ui/Skeleton'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export default function UptimePage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['uptime', 'stats', '24h'],
    queryFn: () => dashboardApi.uptime('24h').then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: stats7d } = useQuery({
    queryKey: ['uptime', 'stats', '7d'],
    queryFn: () => dashboardApi.uptime('7d').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: probes } = useQuery({
    queryKey: ['uptime', 'probes'],
    queryFn: () => dashboardApi.uptimeProbes(120).then(r => r.data),
    refetchInterval: 30_000,
  })

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Uptime Monitor</h2>

      {/* Summary Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Uptime (24h)"
            value={stats?.uptime_pct != null ? `${stats.uptime_pct}%` : '--'}
            subtitle={stats?.total_probes ? `${stats.total_probes} probes` : ''}
            icon={<ShieldCheck size={18} />}
            index={0}
          />
          <SummaryCard
            label="Uptime (7d)"
            value={stats7d?.uptime_pct != null ? `${stats7d.uptime_pct}%` : '--'}
            subtitle={stats7d?.total_probes ? `${stats7d.total_probes} probes` : ''}
            icon={<ShieldCheck size={18} />}
            index={1}
          />
          <SummaryCard
            label="Outages (24h)"
            value={stats?.outage_count?.toString() ?? '--'}
            subtitle={stats?.total_downtime_seconds ? formatDuration(stats.total_downtime_seconds) + ' total' : ''}
            icon={<AlertTriangle size={18} />}
            index={2}
          />
          <SummaryCard
            label="Avg Latency"
            value={stats?.avg_probe_latency_ms != null ? `${stats.avg_probe_latency_ms} ms` : '--'}
            subtitle="Probe average"
            index={3}
          />
        </div>
      )}

      {/* Probe Timeline Visualization */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">Probe History (Last ~1h)</h3>
        {probes && probes.length > 0 ? (
          <UptimeTimeline probes={probes} />
        ) : (
          <div className="h-24 flex items-center justify-center dark:text-gray-500 text-gray-400">
            Collecting uptime data... probes run every 30 seconds
          </div>
        )}
      </GlassCard>

      {/* Outage Log */}
      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
          <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">Outage Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-table-head">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Started</th>
                <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Ended</th>
                <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Duration</th>
                <th className="text-center px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
              {(!stats?.outages || stats.outages.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center dark:text-gray-500 text-gray-400">
                    No outages detected
                  </td>
                </tr>
              )}
              {stats?.outages?.map(o => (
                <tr key={o.id} className="glass-table-row transition-colors">
                  <td className="px-4 py-3 dark:text-gray-100 text-gray-900">{formatDateTime(o.started_at)}</td>
                  <td className="px-4 py-3 dark:text-gray-500 text-gray-400">{o.ended_at ? formatDateTime(o.ended_at) : '--'}</td>
                  <td className="px-4 py-3 text-right font-medium dark:text-gray-100 text-gray-900 tabular-nums">
                    {o.duration_seconds ? formatDuration(o.duration_seconds) : 'Ongoing'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      o.resolved
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {o.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </AnimatedPage>
  )
}
