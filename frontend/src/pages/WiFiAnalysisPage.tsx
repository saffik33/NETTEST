import { useQuery } from '@tanstack/react-query'
import { Lightbulb, Wifi, Globe } from 'lucide-react'
import { wifiApi } from '../api/endpoints'
import { formatSignal } from '../utils/formatters'
import { useConnectionInfo } from '../hooks/useConnectionInfo'
import AnimatedPage from '../components/ui/AnimatedPage'
import GlassCard from '../components/ui/GlassCard'
import SummaryCard from '../components/dashboard/SummaryCard'
import SignalStrengthChart from '../components/charts/SignalStrengthChart'
import ChannelCongestionChart from '../components/charts/ChannelCongestionChart'

export default function WiFiAnalysisPage() {
  const connectionInfo = useConnectionInfo()

  const { data: current } = useQuery({
    queryKey: ['wifi', 'current'],
    queryFn: () => wifiApi.current().then((r) => r.data),
    refetchInterval: 10_000,
  })

  const { data: history } = useQuery({
    queryKey: ['wifi', 'history'],
    queryFn: () => wifiApi.history(50).then((r) => r.data),
  })

  const { data: networks } = useQuery({
    queryKey: ['wifi', 'channels'],
    queryFn: () => wifiApi.channels().then((r) => r.data),
  })

  const { data: channelAnalysis } = useQuery({
    queryKey: ['wifi', 'channel-analysis'],
    queryFn: () => wifiApi.channelAnalysis().then((r) => r.data),
  })

  return (
    <AnimatedPage>
      <h2 className="text-2xl font-bold tracking-display dark:text-gray-100 text-gray-900">WiFi Analysis</h2>

      {/* Browser Connection Info — works even on cloud deployment */}
      {connectionInfo && (
        <GlassCard glow className="dark:border-accent/15 border-accent/15">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-accent" />
            <h3 className="text-sm font-semibold dark:text-accent text-accent-dim">Your Connection (Browser)</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs dark:text-gray-500 text-gray-400">Connection Type</div>
              <div className="text-lg font-semibold dark:text-gray-100 text-gray-900 flex items-center gap-1.5">
                <Wifi size={16} className="text-accent" />
                {connectionInfo.type !== 'unknown' ? connectionInfo.type : connectionInfo.effectiveType.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs dark:text-gray-500 text-gray-400">Effective Type</div>
              <div className="text-lg font-semibold dark:text-gray-100 text-gray-900">{connectionInfo.effectiveType.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-xs dark:text-gray-500 text-gray-400">Est. Bandwidth</div>
              <div className="text-lg font-semibold dark:text-gray-100 text-gray-900">{connectionInfo.downlink} Mbps</div>
            </div>
            <div>
              <div className="text-xs dark:text-gray-500 text-gray-400">Est. RTT</div>
              <div className="text-lg font-semibold dark:text-gray-100 text-gray-900">{connectionInfo.rtt} ms</div>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="SSID" value={current?.ssid || '--'} index={0} />
        <SummaryCard label="Signal" value={current?.signal_pct != null ? `${current.signal_pct}%` : '--'} index={1} />
        <SummaryCard label="RSSI" value={formatSignal(current?.rssi_dbm)} index={2} />
        <SummaryCard label="Channel" value={current?.channel?.toString() || '--'} subtitle={current?.band || ''} index={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <div className="text-xs font-medium tracking-label dark:text-gray-500 text-gray-400 mb-1">Radio Type</div>
          <div className="text-lg font-semibold dark:text-gray-100 text-gray-900">{current?.radio_type || '--'}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs font-medium tracking-label dark:text-gray-500 text-gray-400 mb-1">Link Speed</div>
          <div className="text-lg font-semibold dark:text-gray-100 text-gray-900">
            {current?.rx_rate_mbps && current?.tx_rate_mbps ? `${current.rx_rate_mbps} / ${current.tx_rate_mbps} Mbps` : '--'}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">Signal History</h3>
        {history && history.length > 0 ? (
          <SignalStrengthChart data={history} />
        ) : (
          <div className="h-48 flex items-center justify-center dark:text-gray-500 text-gray-400">No WiFi history yet</div>
        )}
      </GlassCard>

      {channelAnalysis && (
        <>
          {channelAnalysis.recommendations.length > 0 && (
            <GlassCard glow className="dark:border-accent/15 border-accent/15">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={18} className="text-accent" />
                <h3 className="text-sm font-semibold dark:text-accent text-accent-dim">Recommendations</h3>
              </div>
              <ul className="space-y-1">
                {channelAnalysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm dark:text-gray-300 text-gray-600">
                    <span className="font-medium dark:text-accent text-accent-dim">Channel {r.channel} ({r.band})</span> — {r.reason}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">
              2.4 GHz Channel Congestion
              <span className="text-sm font-normal dark:text-gray-500 text-gray-400 ml-2">({channelAnalysis.total_networks} networks detected)</span>
            </h3>
            <ChannelCongestionChart channels={channelAnalysis.channels} currentChannel={channelAnalysis.current_channel} band="2.4 GHz" />
          </GlassCard>

          {channelAnalysis.channels.some(c => c.band === '5 GHz') && (
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 text-gray-900">5 GHz Channel Congestion</h3>
              <ChannelCongestionChart channels={channelAnalysis.channels} currentChannel={channelAnalysis.current_channel} band="5 GHz" />
            </GlassCard>
          )}
        </>
      )}

      <GlassCard noPadding>
        <div className="px-6 py-4 dark:border-b dark:border-white/[0.04] border-b border-gray-100">
          <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">Nearby Networks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-table-head">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">SSID</th>
                <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Signal</th>
                <th className="text-right px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Channel</th>
                <th className="text-left px-4 py-3 font-medium text-xs tracking-label dark:text-gray-500 text-gray-400">Band</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/[0.04] divide-gray-100">
              {(!networks || networks.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-8 text-center dark:text-gray-500 text-gray-400">No nearby networks found</td></tr>
              )}
              {networks?.map((n, i) => (
                <tr key={n.ssid || i} className="glass-table-row transition-colors">
                  <td className="px-4 py-3 dark:text-gray-100 text-gray-900">{n.ssid || '(hidden)'}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{n.signal_pct}%</td>
                  <td className="px-4 py-3 text-right dark:text-gray-500 text-gray-400 tabular-nums">{n.channel || '--'}</td>
                  <td className="px-4 py-3 dark:text-gray-500 text-gray-400">{n.band || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </AnimatedPage>
  )
}
