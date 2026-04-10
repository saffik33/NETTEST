import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'
import DashboardPage from './pages/DashboardPage'
import SpeedHistoryPage from './pages/SpeedHistoryPage'
import NetworkHealthPage from './pages/NetworkHealthPage'
import WiFiAnalysisPage from './pages/WiFiAnalysisPage'
import DevicesPage from './pages/DevicesPage'
import TraceroutePage from './pages/TraceroutePage'
import AlertsPage from './pages/AlertsPage'
import UptimePage from './pages/UptimePage'
import BandwidthPage from './pages/BandwidthPage'
import ProfilesPage from './pages/ProfilesPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/speed" element={<SpeedHistoryPage />} />
          <Route path="/network-health" element={<NetworkHealthPage />} />
          <Route path="/wifi" element={<WiFiAnalysisPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/traceroute" element={<TraceroutePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/uptime" element={<UptimePage />} />
          <Route path="/bandwidth" element={<BandwidthPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
