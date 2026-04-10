import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import ErrorBoundary from '../ui/ErrorBoundary'
import CommandPalette from '../ui/CommandPalette'
import { useWebSocket } from '../../hooks/useWebSocket'

export default function MainLayout() {
  useWebSocket()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: hidden on mobile, visible md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <div key={location.pathname}>
                <Outlet />
              </div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Bottom nav: visible on mobile only */}
      <BottomNav />

      <CommandPalette />
    </div>
  )
}
