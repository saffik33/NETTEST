import { useQuery } from '@tanstack/react-query'
import { devicesApi } from '../api/endpoints'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import ShimmerButton from '../components/ui/ShimmerButton'
import { SkeletonTable } from '../components/ui/Skeleton'

export default function DevicesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['devices', 'current'],
    queryFn: () => devicesApi.current().then((r) => r.data),
  })

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Connected Devices</h2>
        <ShimmerButton onClick={() => refetch()}>Scan Now</ShimmerButton>
      </div>

      {isLoading ? (
        <SkeletonTable />
      ) : (
        <GlassCard noPadding>
          <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
            <span className="text-sm dark:text-gray-500 text-gray-400">{data?.count ?? 0} devices found</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="glass-table-head">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">IP Address</th>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">MAC Address</th>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Hostname</th>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
                {data?.devices?.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center dark:text-gray-500 text-gray-400">No devices found</td></tr>
                )}
                {data?.devices?.map((dev, i) => (
                  <tr key={i} className="glass-table-row transition-colors">
                    <td className="px-4 py-3 font-mono text-xs dark:text-gray-100 text-gray-900">{dev.ip_address}</td>
                    <td className="px-4 py-3 font-mono text-xs dark:text-gray-500 text-gray-400">{dev.mac_address}</td>
                    <td className="px-4 py-3 dark:text-gray-300 text-gray-600">{dev.hostname || '--'}</td>
                    <td className="px-4 py-3 dark:text-gray-500 text-gray-400">{dev.vendor || '--'}</td>
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
