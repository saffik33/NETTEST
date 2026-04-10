import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Star } from 'lucide-react'
import { profilesApi } from '../api/endpoints'
import type { TestProfile } from '../api/endpoints'
import toast from 'react-hot-toast'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import ShimmerButton from '../components/ui/ShimmerButton'

const PRESET_PROFILES = [
  { name: 'Gaming', description: 'Low-latency focus for gaming', ping_targets: ['8.8.8.8', '1.1.1.1'], dns_targets: ['google.com'], traceroute_target: '8.8.8.8', include_speed: false, include_ping: true, include_dns: true, include_wifi: true, include_traceroute: true, include_device_scan: false },
  { name: 'Work / VPN', description: 'Upload speed + connectivity check', ping_targets: ['8.8.8.8'], dns_targets: ['google.com', 'github.com', 'outlook.com'], traceroute_target: '8.8.8.8', include_speed: true, include_ping: true, include_dns: true, include_wifi: true, include_traceroute: false, include_device_scan: false },
  { name: 'Streaming', description: 'Download bandwidth + stability', ping_targets: ['8.8.8.8'], dns_targets: ['netflix.com', 'youtube.com', 'twitch.tv'], traceroute_target: '8.8.8.8', include_speed: true, include_ping: true, include_dns: true, include_wifi: true, include_traceroute: false, include_device_scan: false },
  { name: 'Full Diagnostic', description: 'All tests enabled', ping_targets: ['8.8.8.8', '1.1.1.1'], dns_targets: ['google.com', 'cloudflare.com', 'github.com'], traceroute_target: '8.8.8.8', include_speed: true, include_ping: true, include_dns: true, include_wifi: true, include_traceroute: true, include_device_scan: true },
]

export default function ProfilesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPingTargets, setFormPingTargets] = useState('8.8.8.8')
  const [formDnsTargets, setFormDnsTargets] = useState('google.com, cloudflare.com, github.com')
  const [formTraceroute, setFormTraceroute] = useState('8.8.8.8')

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<TestProfile>) => profilesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); toast.success('Profile created'); setShowForm(false) },
    onError: () => toast.error('Failed to create profile'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profilesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profiles'] }); toast.success('Profile deleted') },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => profilesApi.update(id, { is_default: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  })

  const handleCreatePreset = (preset: typeof PRESET_PROFILES[0]) => {
    createMutation.mutate(preset)
  }

  const handleCreateCustom = () => {
    createMutation.mutate({
      name: formName,
      description: formDesc || null,
      ping_targets: formPingTargets.split(',').map(s => s.trim()).filter(Boolean),
      dns_targets: formDnsTargets.split(',').map(s => s.trim()).filter(Boolean),
      traceroute_target: formTraceroute,
    })
  }

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Test Profiles</h2>
        <ShimmerButton onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Profile'}
        </ShimmerButton>
      </div>

      {/* Quick presets */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100 text-gray-900">Quick Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESET_PROFILES.map(preset => (
            <button
              key={preset.name}
              onClick={() => handleCreatePreset(preset)}
              className="p-4 rounded-lg dark:bg-surface-2 bg-gray-50 dark:border dark:border-white/[0.06] border border-gray-200 dark:hover:border-accent/30 hover:border-accent/30 transition-colors text-left"
            >
              <div className="font-medium dark:text-gray-100 text-gray-900">{preset.name}</div>
              <div className="text-xs dark:text-gray-500 text-gray-400 mt-1">{preset.description}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Custom form */}
      {showForm && (
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">Custom Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className="glass-input w-full" placeholder="My Profile" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Description</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} className="glass-input w-full" placeholder="Optional description" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Ping Targets (comma-separated)</label>
              <input value={formPingTargets} onChange={e => setFormPingTargets(e.target.value)} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">DNS Targets (comma-separated)</label>
              <input value={formDnsTargets} onChange={e => setFormDnsTargets(e.target.value)} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Traceroute Target</label>
              <input value={formTraceroute} onChange={e => setFormTraceroute(e.target.value)} className="glass-input w-full" />
            </div>
          </div>
          <div className="mt-4">
            <ShimmerButton onClick={handleCreateCustom} disabled={!formName}>Create Profile</ShimmerButton>
          </div>
        </GlassCard>
      )}

      {/* Saved profiles */}
      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
          <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">Saved Profiles</h3>
        </div>
        {(!profiles || profiles.length === 0) ? (
          <div className="px-6 py-8 text-center dark:text-gray-500 text-gray-400">No profiles yet. Create one above or use a quick preset.</div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04] divide-gray-100">
            {profiles.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between glass-table-row">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-gray-100 text-gray-900">{p.name}</span>
                    {p.is_default && (
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  {p.description && <div className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">{p.description}</div>}
                  <div className="text-xs dark:text-gray-500 text-gray-400 mt-1">
                    Ping: {p.ping_targets.join(', ')} | DNS: {p.dns_targets.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDefaultMutation.mutate(p.id)}
                    title="Set as default"
                    className="p-1.5 rounded-lg dark:hover:bg-white/[0.04] hover:bg-gray-100 transition-colors"
                  >
                    <Star size={16} className={p.is_default ? 'text-amber-400 fill-amber-400' : 'dark:text-gray-500 text-gray-400'} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </AnimatedPage>
  )
}
