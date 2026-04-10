import api from './client'

// --- Types ---
export interface TestRunRequest {
  include_speed?: boolean
  include_ping?: boolean
  include_dns?: boolean
  include_wifi?: boolean
  include_traceroute?: boolean
  include_device_scan?: boolean
}

export interface TestRunResponse { session_id: number; status: string }
export interface TestSession { id: number; started_at: string; completed_at: string | null; trigger_type: string; status: string; error_message: string | null }
export interface SpeedTestResult { id: number; test_session_id: number; download_mbps: number; upload_mbps: number; server_name: string | null; server_host: string | null; server_id: number | null; timestamp: string }
export interface SpeedStats { avg_download: number; avg_upload: number; min_download: number; max_download: number; min_upload: number; max_upload: number; test_count: number }
export interface PingResult { id: number; test_session_id: number; target_host: string; avg_latency_ms: number; min_latency_ms: number; max_latency_ms: number; jitter_ms: number; packet_loss_pct: number; packets_sent: number; packets_received: number; timestamp: string }
export interface PingStats { avg_latency: number; avg_jitter: number; avg_packet_loss: number; min_latency: number; max_latency: number; test_count: number }
export interface DNSResult { id: number; test_session_id: number; target_domain: string; resolution_time_ms: number; resolved_ip: string | null; dns_server: string | null; success: boolean; timestamp: string }
export interface WiFiCurrent { ssid: string | null; bssid: string | null; rssi_dbm: number | null; signal_pct: number | null; channel: number | null; band: string | null; radio_type: string | null; auth_type: string | null; rx_rate_mbps: number | null; tx_rate_mbps: number | null }
export interface WiFiSnapshot { id: number; test_session_id: number | null; ssid: string | null; rssi_dbm: number | null; signal_pct: number | null; channel: number | null; band: string | null; timestamp: string }
export interface WiFiNetwork { ssid: string; bssid: string; signal_pct: number; channel: number | null; band: string | null }
export interface DeviceInfo { ip_address: string; mac_address: string; hostname: string | null; vendor: string | null; entry_type: string }
export interface DashboardSummary { period: string; speed: { avg_download: number; avg_upload: number; max_download: number; test_count: number }; ping: { avg_latency: number; avg_jitter: number; avg_packet_loss: number } }
export interface HeatmapPoint { day_of_week: number; hour_of_day: number; avg_value: number; sample_count: number }
export interface AlertThreshold { id: number; metric_name: string; condition: string; threshold_value: number; enabled: boolean; notify_browser: boolean; notify_email: boolean; email_address: string | null; cooldown_minutes: number; created_at: string; updated_at: string }
export interface AlertEvent { id: number; threshold_id: number; test_session_id: number | null; metric_name: string; metric_value: number; threshold_value: number; condition: string; message: string; acknowledged: boolean; triggered_at: string }
export interface ScheduleConfig { id: number; name: string; interval_minutes: number; enabled: boolean; include_speed_test: boolean; include_ping_test: boolean; include_dns_test: boolean; include_wifi_scan: boolean; include_traceroute: boolean; include_device_scan: boolean; created_at: string; updated_at: string }

// Health Score
export interface HealthScore { overall: number; breakdown: { download: number; upload: number; latency: number; jitter: number; packet_loss: number; wifi_signal: number | null }; trend_pct: number | null; period: string }
export interface HealthTimeline { days: number; timeline: { date: string; score: number | null }[] }

// Uptime
export interface UptimeStats { period: string; uptime_pct: number | null; total_probes: number; successful_probes: number; avg_probe_latency_ms: number | null; outage_count: number; total_downtime_seconds: number; outages: { id: number; started_at: string; ended_at: string | null; duration_seconds: number | null; resolved: boolean }[] }
export interface UptimeProbe { is_up: boolean; latency_ms: number | null; timestamp: string }

// Channel Analysis
export interface ChannelInfo { channel: number; band: string; network_count: number; networks: { ssid: string; signal_pct: number; channel: number }[]; avg_signal: number; congestion_score: number }
export interface ChannelRecommendation { channel: number; band: string; reason: string; congestion_score: number }
export interface ChannelAnalysis { current_channel: number | null; current_band: string | null; total_networks: number; channels: ChannelInfo[]; recommendations: ChannelRecommendation[] }

// Traceroute Map
export interface TracerouteHopGeo { hop_number: number; ip_address: string | null; hostname: string | null; avg_rtt_ms: number | null; timed_out: boolean; geo: { lat: number; lon: number; city: string | null; country: string | null; isp: string | null; asn: string | null } | null }
export interface TracerouteMapData { id: number; target_host: string; total_hops: number; completed: boolean; timestamp: string; hops: TracerouteHopGeo[] }
export interface TracerouteHistoryItem { id: number; test_session_id: number; target_host: string; total_hops: number; completed: boolean; timestamp: string }

// Test Profiles
export interface TestProfile { id: number; name: string; description: string | null; ping_targets: string[]; dns_targets: string[]; traceroute_target: string; include_speed: boolean; include_ping: boolean; include_dns: boolean; include_wifi: boolean; include_traceroute: boolean; include_device_scan: boolean; is_default: boolean; created_at: string }

// --- API functions ---
export const testsApi = {
  run: (data: TestRunRequest) => api.post<TestRunResponse>('/tests/run', data),
  listSessions: (limit = 50, offset = 0) => api.get<TestSession[]>('/tests/sessions', { params: { limit, offset } }),
  getSession: (id: number) => api.get<TestSession>(`/tests/sessions/${id}`),
  deleteSession: (id: number) => api.delete(`/tests/sessions/${id}`),
}

export const speedApi = {
  history: (limit = 100, offset = 0) => api.get<SpeedTestResult[]>('/speed/history', { params: { limit, offset } }),
  latest: () => api.get<SpeedTestResult | null>('/speed/latest'),
  stats: (period = '24h') => api.get<SpeedStats>('/speed/stats', { params: { period } }),
}

export const pingApi = {
  history: (limit = 100, offset = 0) => api.get<PingResult[]>('/ping/history', { params: { limit, offset } }),
  latest: () => api.get<PingResult | null>('/ping/latest'),
  stats: (period = '24h') => api.get<PingStats>('/ping/stats', { params: { period } }),
}

export const dnsApi = {
  history: (limit = 100, offset = 0) => api.get<DNSResult[]>('/dns/history', { params: { limit, offset } }),
  latest: () => api.get<DNSResult[]>('/dns/latest'),
}

export const wifiApi = {
  current: () => api.get<WiFiCurrent | null>('/wifi/current'),
  history: (limit = 100, offset = 0) => api.get<WiFiSnapshot[]>('/wifi/history', { params: { limit, offset } }),
  channels: () => api.get<WiFiNetwork[]>('/wifi/channels'),
  channelAnalysis: () => api.get<ChannelAnalysis>('/wifi/channel-analysis'),
}

export const devicesApi = {
  current: () => api.get<{ devices: DeviceInfo[]; count: number }>('/devices/current'),
  history: (limit = 20, offset = 0) => api.get('/devices/history', { params: { limit, offset } }),
}

export const dashboardApi = {
  summary: (period = '24h') => api.get<DashboardSummary>('/dashboard/summary', { params: { period } }),
  heatmap: (metric = 'download_mbps', period = '7d') => api.get<{ data: HeatmapPoint[] }>('/dashboard/heatmap', { params: { metric, period } }),
  healthScore: (period = '24h') => api.get<HealthScore>('/dashboard/health-score', { params: { period } }),
  healthTimeline: (days = 7) => api.get<HealthTimeline>('/dashboard/health-timeline', { params: { days } }),
  uptime: (period = '24h') => api.get<UptimeStats>('/dashboard/uptime', { params: { period } }),
  uptimeProbes: (limit = 120) => api.get<UptimeProbe[]>('/dashboard/uptime/probes', { params: { limit } }),
}

export const alertsApi = {
  thresholds: () => api.get<AlertThreshold[]>('/alerts/thresholds'),
  createThreshold: (data: Partial<AlertThreshold>) => api.post<AlertThreshold>('/alerts/thresholds', data),
  updateThreshold: (id: number, data: Partial<AlertThreshold>) => api.put<AlertThreshold>(`/alerts/thresholds/${id}`, data),
  deleteThreshold: (id: number) => api.delete(`/alerts/thresholds/${id}`),
  events: (limit = 50, offset = 0) => api.get<AlertEvent[]>('/alerts/events', { params: { limit, offset } }),
  acknowledgeEvent: (id: number) => api.put<AlertEvent>(`/alerts/events/${id}/acknowledge`),
  acknowledgeAll: () => api.put<{ count: number }>('/alerts/events/acknowledge-all'),
}

export const scheduleApi = {
  list: () => api.get<ScheduleConfig[]>('/schedule'),
  create: (data: Partial<ScheduleConfig>) => api.post<ScheduleConfig>('/schedule', data),
  update: (id: number, data: Partial<ScheduleConfig>) => api.put<ScheduleConfig>(`/schedule/${id}`, data),
  delete: (id: number) => api.delete(`/schedule/${id}`),
}

export const tracerouteApi = {
  run: (target: string) => api.post<{ traceroute_id: number; target: string; total_hops: number; completed: boolean }>('/traceroute/run', { target }),
  history: (limit = 20, offset = 0) => api.get<TracerouteHistoryItem[]>('/traceroute/history', { params: { limit, offset } }),
  map: (id: number) => api.get<TracerouteMapData>(`/traceroute/${id}/map`),
}

export const profilesApi = {
  list: () => api.get<TestProfile[]>('/profiles'),
  create: (data: Partial<TestProfile>) => api.post<TestProfile>('/profiles', data),
  update: (id: number, data: Partial<TestProfile>) => api.put<TestProfile>(`/profiles/${id}`, data),
  delete: (id: number) => api.delete(`/profiles/${id}`),
}
