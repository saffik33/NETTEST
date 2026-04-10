import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Zap, HeartPulse, Wifi, MoreHorizontal,
  Smartphone, Route, Bell, ShieldCheck, Activity, UserCircle, Settings, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const primaryItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/speed', label: 'Speed', icon: Zap },
  { to: '/network-health', label: 'Health', icon: HeartPulse },
  { to: '/wifi', label: 'WiFi', icon: Wifi },
]

const moreItems: NavItem[] = [
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/traceroute', label: 'Traceroute', icon: Route },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/uptime', label: 'Uptime', icon: ShieldCheck },
  { to: '/bandwidth', label: 'Bandwidth', icon: Activity },
  { to: '/profiles', label: 'Profiles', icon: UserCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* Bottom sheet overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={clsx(
                'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl pb-safe',
                'dark:bg-surface-1/90 bg-white/90',
                'dark:backdrop-blur-2xl backdrop-blur-2xl',
                'dark:border-t dark:border-border-subtle border-t border-gray-200/60',
              )}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-sm font-semibold dark:text-gray-100 text-gray-900">More</span>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-1.5 rounded-lg dark:hover:bg-white/[0.06] hover:bg-gray-100 dark:text-gray-400 text-gray-500"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="grid grid-cols-4 gap-1 px-3 pb-4">
                {moreItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-medium transition-colors',
                        isActive
                          ? 'dark:text-accent text-accent-dim dark:bg-accent/[0.08] bg-accent/[0.06]'
                          : 'dark:text-gray-400 text-gray-500 dark:hover:bg-white/[0.04] hover:bg-gray-100',
                      )
                    }
                  >
                    <item.icon size={20} strokeWidth={1.8} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav
        className={clsx(
          'md:hidden fixed bottom-0 left-0 right-0 z-30',
          'dark:bg-surface-1/80 bg-white/80',
          'dark:backdrop-blur-xl backdrop-blur-xl',
          'dark:border-t dark:border-border-subtle border-t border-gray-200/60',
          'flex items-center justify-around px-2 pb-safe',
        )}
      >
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors',
                isActive
                  ? 'dark:text-accent text-accent-dim'
                  : 'dark:text-gray-500 text-gray-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium dark:text-gray-500 text-gray-400 transition-colors cursor-pointer"
          aria-label="More navigation options"
        >
          <MoreHorizontal size={20} strokeWidth={1.5} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
