import { useQuery } from '@tanstack/react-query'
import { speedApi } from '../api/endpoints'
import { formatSpeed } from '../utils/formatters'
import { formatDateTime } from '../utils/dateUtils'
import { getSpeedColor } from '../utils/constants'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import { SkeletonChart, SkeletonTable } from '../components/ui/Skeleton'
import SpeedLineChart from '../components/charts/SpeedLineChart'

export default function SpeedHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['speed', 'history'],
    queryFn: () => speedApi.history(50).then((r) => r.data),
  })

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">Speed History</h2>

      {isLoading ? (
        <SkeletonChart />
      ) : (
        <GlassCard>
          {history && history.length > 0 ? (
            <SpeedLineChart data={history} />
          ) : (
            <div className="h-64 flex items-center justify-center dark:text-gray-500 text-gray-400">
              No speed tests yet. Run a test from the dashboard!
            </div>
          )}
        </GlassCard>
      )}

      {isLoading ? (
        <SkeletonTable />
      ) : (
        <GlassCard noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="glass-table-head">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Time</th>
                  <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Download</th>
                  <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Upload</th>
                  <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Server</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
                {history?.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center dark:text-gray-500 text-gray-400">No tests yet</td></tr>
                )}
                {history?.map((row) => (
                  <tr key={row.id} className="glass-table-row transition-colors">
                    <td className="px-4 py-3 dark:text-gray-300 text-gray-600">{formatDateTime(row.timestamp)}</td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${getSpeedColor(row.download_mbps)}`}>{formatSpeed(row.download_mbps)}</td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${getSpeedColor(row.upload_mbps)}`}>{formatSpeed(row.upload_mbps)}</td>
                    <td className="px-4 py-3 dark:text-gray-500 text-gray-400">{row.server_name || '--'}</td>
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
