import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { tracerouteApi } from '../api/endpoints'
import TracerouteMap from '../components/charts/TracerouteMap'
import { formatDateTime } from '../utils/dateUtils'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import ShimmerButton from '../components/ui/ShimmerButton'

export default function TraceroutePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [target, setTarget] = useState('8.8.8.8')
  const queryClient = useQueryClient()

  const { data: history } = useQuery({
    queryKey: ['traceroute', 'history'],
    queryFn: () => tracerouteApi.history(20).then(r => r.data),
  })

  const { data: mapData, isLoading: mapLoading } = useQuery({
    queryKey: ['traceroute', 'map', selectedId],
    queryFn: () => selectedId ? tracerouteApi.map(selectedId).then(r => r.data) : null,
    enabled: !!selectedId,
  })

  const runMutation = useMutation({
    mutationFn: (t: string) => tracerouteApi.run(t).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['traceroute', 'history'] })
      setSelectedId(data.traceroute_id)
    },
  })

  const handleRun = () => {
    if (!target.trim() || runMutation.isPending) return
    runMutation.mutate(target.trim())
  }

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Traceroute</h2>

      {/* Run Traceroute */}
      <GlassCard>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">
              Target Host
            </label>
            <input
              type="text"
              value={target}
              onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRun()}
              placeholder="8.8.8.8 or google.com"
              className="glass-input w-full"
              disabled={runMutation.isPending}
            />
          </div>
          <ShimmerButton onClick={handleRun} disabled={runMutation.isPending || !target.trim()}>
            {runMutation.isPending ? 'Tracing...' : 'Run Traceroute'}
          </ShimmerButton>
        </div>
        {runMutation.isPending && (
          <div className="mt-3 text-sm dark:text-gray-400 text-gray-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-accent" />
            Running traceroute to {target}... this may take 15-30 seconds
          </div>
        )}
        {runMutation.isError && (
          <div className="mt-3 text-sm text-red-400">
            Traceroute failed: {(runMutation.error as Error).message}
          </div>
        )}
      </GlassCard>

      {/* Map */}
      <GlassCard noPadding>
        {mapData ? (
          <TracerouteMap data={mapData} />
        ) : (
          <div className="h-[400px] flex items-center justify-center dark:text-gray-500 text-gray-400">
            {mapLoading ? 'Loading map data...' : 'Run a traceroute or select one from the history below'}
          </div>
        )}
      </GlassCard>

      {/* Hop table for selected traceroute */}
      {mapData && (
        <GlassCard noPadding>
          <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
            <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">
              Route to {mapData.target_host} — {mapData.total_hops} hops
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="glass-table-head">
                <tr>
                  <th className="text-center px-3 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400 w-12">#</th>
                  <th className="text-left px-3 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Host</th>
                  <th className="text-left px-3 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">IP</th>
                  <th className="text-right px-3 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">RTT</th>
                  <th className="text-left px-3 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Location</th>
                  <th className="text-left px-3 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">ISP</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
                {mapData.hops.map(hop => (
                  <tr key={hop.hop_number} className={hop.timed_out ? 'opacity-40' : 'glass-table-row transition-colors'}>
                    <td className="px-3 py-2 text-center dark:text-gray-500 text-gray-400 font-mono">{hop.hop_number}</td>
                    <td className="px-3 py-2 dark:text-gray-100 text-gray-900 font-mono text-xs">
                      {hop.timed_out ? '* * *' : hop.hostname || '--'}
                    </td>
                    <td className="px-3 py-2 dark:text-gray-500 text-gray-400 font-mono text-xs">{hop.ip_address || '--'}</td>
                    <td className="px-3 py-2 text-right font-medium dark:text-gray-100 text-gray-900 tabular-nums">
                      {hop.avg_rtt_ms != null ? `${hop.avg_rtt_ms} ms` : '--'}
                    </td>
                    <td className="px-3 py-2 dark:text-gray-500 text-gray-400 text-xs">
                      {hop.geo ? `${hop.geo.city || '?'}, ${hop.geo.country || '?'}` : '--'}
                    </td>
                    <td className="px-3 py-2 dark:text-gray-500 text-gray-400 text-xs truncate max-w-[200px]">
                      {hop.geo?.isp || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* History list */}
      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
          <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">Traceroute History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-table-head">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Target</th>
                <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Hops</th>
                <th className="text-center px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Time</th>
                <th className="text-center px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center dark:text-gray-500 text-gray-400">
                    No traceroute results yet. Use the form above to run one.
                  </td>
                </tr>
              )}
              {history?.map(tr => (
                <tr key={tr.id} className="glass-table-row transition-colors">
                  <td className="px-4 py-3 dark:text-gray-100 text-gray-900 font-mono">{tr.target_host}</td>
                  <td className="px-4 py-3 text-right dark:text-gray-500 text-gray-400 tabular-nums">{tr.total_hops}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      tr.completed
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tr.completed ? 'Complete' : 'Partial'}
                    </span>
                  </td>
                  <td className="px-4 py-3 dark:text-gray-500 text-gray-400 text-xs">{formatDateTime(tr.timestamp)}</td>
                  <td className="px-4 py-3 text-center">
                    <ShimmerButton
                      size="sm"
                      variant={selectedId === tr.id ? 'primary' : 'secondary'}
                      onClick={() => setSelectedId(tr.id)}
                    >
                      View Map
                    </ShimmerButton>
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
