import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '../api/endpoints'
import { formatDateTime } from '../utils/dateUtils'
import { useState } from 'react'
import toast from 'react-hot-toast'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import ShimmerButton from '../components/ui/ShimmerButton'

const METRIC_OPTIONS = [
  { value: 'download_mbps', label: 'Download Speed (Mbps)', defaultCondition: 'lt', defaultValue: 25 },
  { value: 'upload_mbps', label: 'Upload Speed (Mbps)', defaultCondition: 'lt', defaultValue: 5 },
  { value: 'avg_latency_ms', label: 'Latency (ms)', defaultCondition: 'gt', defaultValue: 100 },
  { value: 'jitter_ms', label: 'Jitter (ms)', defaultCondition: 'gt', defaultValue: 30 },
  { value: 'packet_loss_pct', label: 'Packet Loss (%)', defaultCondition: 'gt', defaultValue: 2 },
  { value: 'signal_pct', label: 'WiFi Signal (%)', defaultCondition: 'lt', defaultValue: 40 },
]

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const { data: thresholds } = useQuery({
    queryKey: ['alerts', 'thresholds'],
    queryFn: () => alertsApi.thresholds().then((r) => r.data),
  })
  const { data: events } = useQuery({
    queryKey: ['alerts', 'events'],
    queryFn: () => alertsApi.events(50).then((r) => r.data),
  })

  const [newMetric, setNewMetric] = useState(METRIC_OPTIONS[0].value)
  const [newCondition, setNewCondition] = useState('lt')
  const [newValue, setNewValue] = useState(25)

  const createMutation = useMutation({
    mutationFn: () => alertsApi.createThreshold({ metric_name: newMetric, condition: newCondition, threshold_value: newValue }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Threshold created') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => alertsApi.deleteThreshold(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const ackAllMutation = useMutation({
    mutationFn: () => alertsApi.acknowledgeAll(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alerts'] }); toast.success('All alerts acknowledged') },
  })

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Alerts</h2>

      {/* Add threshold form */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">Add Alert Threshold</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm dark:text-gray-500 text-gray-400 mb-1">Metric</label>
            <select
              value={newMetric}
              onChange={(e) => {
                setNewMetric(e.target.value)
                const opt = METRIC_OPTIONS.find((o) => o.value === e.target.value)
                if (opt) { setNewCondition(opt.defaultCondition); setNewValue(opt.defaultValue) }
              }}
              className="glass-input"
            >
              {METRIC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm dark:text-gray-500 text-gray-400 mb-1">Condition</label>
            <select value={newCondition} onChange={(e) => setNewCondition(e.target.value)} className="glass-input">
              <option value="lt">Less than</option>
              <option value="gt">Greater than</option>
            </select>
          </div>
          <div>
            <label className="block text-sm dark:text-gray-500 text-gray-400 mb-1">Value</label>
            <input type="number" value={newValue} onChange={(e) => setNewValue(Number(e.target.value))} className="glass-input w-24" />
          </div>
          <ShimmerButton onClick={() => createMutation.mutate()}>Add</ShimmerButton>
        </div>
      </GlassCard>

      {/* Active thresholds */}
      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
          <h3 className="font-semibold dark:text-gray-100 text-gray-900">Active Thresholds</h3>
        </div>
        <div className="divide-y dark:divide-white/[0.04] divide-gray-100">
          {(!thresholds || thresholds.length === 0) && (
            <div className="px-6 py-6 text-center dark:text-gray-500 text-gray-400">No thresholds configured</div>
          )}
          {thresholds?.map((t) => (
            <div key={t.id} className="px-6 py-3 flex items-center justify-between glass-table-row">
              <span className="text-sm dark:text-gray-300 text-gray-600">
                {METRIC_OPTIONS.find((o) => o.value === t.metric_name)?.label || t.metric_name}{' '}
                <span className="dark:text-gray-500 text-gray-400">{t.condition === 'lt' ? '<' : '>'} {t.threshold_value}</span>
              </span>
              <ShimmerButton variant="danger" size="sm" onClick={() => deleteMutation.mutate(t.id)}>Delete</ShimmerButton>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Alert Events */}
      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold dark:text-gray-100 text-gray-900">Alert History</h3>
          {events && events.length > 0 && (
            <ShimmerButton variant="ghost" size="sm" onClick={() => ackAllMutation.mutate()}>Acknowledge All</ShimmerButton>
          )}
        </div>
        <div className="divide-y dark:divide-white/[0.04] divide-gray-100">
          {(!events || events.length === 0) && (
            <div className="px-6 py-6 text-center dark:text-gray-500 text-gray-400">No alerts triggered yet</div>
          )}
          {events?.map((e) => (
            <div
              key={e.id}
              className={`px-6 py-3 ${e.acknowledged ? 'opacity-50' : 'dark:border-l-2 dark:border-l-accent/40 border-l-2 border-l-accent/40'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-400">{e.message}</span>
                <span className="text-xs dark:text-gray-500 text-gray-400">{formatDateTime(e.triggered_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </AnimatedPage>
  )
}
