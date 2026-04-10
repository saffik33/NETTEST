import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { scheduleApi } from '../api/endpoints'
import { useState } from 'react'
import toast from 'react-hot-toast'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import ShimmerButton from '../components/ui/ShimmerButton'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: schedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleApi.list().then((r) => r.data),
  })

  const [name, setName] = useState('Default Schedule')
  const [interval, setInterval] = useState(30)

  const createMutation = useMutation({
    mutationFn: () => scheduleApi.create({ name, interval_minutes: interval }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Schedule created') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scheduleApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => scheduleApi.update(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  })

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Settings</h2>

      {/* Create Schedule */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">Add Test Schedule</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm dark:text-gray-500 text-gray-400 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-48" />
          </div>
          <div>
            <label className="block text-sm dark:text-gray-500 text-gray-400 mb-1">Interval (minutes)</label>
            <input type="number" value={interval} onChange={(e) => setInterval(Number(e.target.value))} min={1} className="glass-input w-24" />
          </div>
          <ShimmerButton onClick={() => createMutation.mutate()}>Create</ShimmerButton>
        </div>
      </GlassCard>

      {/* Schedules List */}
      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
          <h3 className="font-semibold dark:text-gray-100 text-gray-900">Active Schedules</h3>
        </div>
        <div className="divide-y dark:divide-white/[0.04] divide-gray-100">
          {(!schedules || schedules.length === 0) && (
            <div className="px-6 py-6 text-center dark:text-gray-500 text-gray-400">No schedules configured</div>
          )}
          {schedules?.map((s) => (
            <div key={s.id} className="px-6 py-3 flex items-center justify-between glass-table-row">
              <div>
                <span className="font-medium dark:text-gray-100 text-gray-900">{s.name}</span>
                <span className="text-sm dark:text-gray-500 text-gray-400 ml-2">Every {s.interval_minutes} min</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMutation.mutate({ id: s.id, enabled: !s.enabled })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    s.enabled
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'dark:bg-white/[0.04] bg-gray-100 dark:text-gray-500 text-gray-400'
                  }`}
                >
                  {s.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <ShimmerButton variant="danger" size="sm" onClick={() => deleteMutation.mutate(s.id)}>Delete</ShimmerButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Notification settings */}
      <GlassCard glow className="dark:border-accent/15 border-accent/15">
        <div className="flex items-center gap-2 mb-2">
          <Info size={18} className="text-accent" />
          <h3 className="text-lg font-semibold dark:text-accent text-accent-dim">Email Notifications</h3>
        </div>
        <p className="text-sm dark:text-gray-400 text-gray-500">Configure SMTP settings in the .env file to enable email alert notifications.</p>
      </GlassCard>
    </AnimatedPage>
  )
}
