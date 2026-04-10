import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Zap, HeartPulse, Wifi, Smartphone, Route, Bell,
  ShieldCheck, Activity, UserCircle, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import GlowIcon from '../ui/GlowIcon'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/speed', label: 'Speed History', icon: Zap },
  { to: '/network-health', label: 'Network Health', icon: HeartPulse },
  { to: '/wifi', label: 'WiFi Analysis', icon: Wifi },
  { to: '/devices', label: 'Devices', icon: Smartphone },
  { to: '/traceroute', label: 'Traceroute', icon: Route },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/uptime', label: 'Uptime', icon: ShieldCheck },
  { to: '/bandwidth', label: 'Bandwidth', icon: Activity },
  { to: '/profiles', label: 'Profiles', icon: UserCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={clsx(
        'relative flex flex-col h-full overflow-hidden',
        'dark:bg-surface-1/60 bg-white/80',
        'dark:backdrop-blur-xl backdrop-blur-xl',
        'dark:border-r dark:border-border-subtle border-r border-gray-200/60',
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 h-14">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Wifi size={18} className="text-accent" strokeWidth={2} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-bold tracking-display dark:text-gray-100 text-gray-900 whitespace-nowrap"
            >
              NetTest
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onMouseEnter={() => setHoveredItem(item.to)}
            onMouseLeave={() => setHoveredItem(null)}
            className={({ isActive }) =>
              clsx(
                'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200',
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                isActive
                  ? 'dark:bg-accent/[0.08] bg-accent/[0.08] dark:text-accent text-accent-dim'
                  : 'dark:text-gray-400 text-gray-600 dark:hover:bg-white/[0.04] hover:bg-gray-100 dark:hover:text-gray-200 hover:text-gray-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent shadow-[0_0_8px_rgba(0,212,255,0.4)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <GlowIcon icon={item.icon} active={isActive} size={20} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip when collapsed */}
                {collapsed && hoveredItem === item.to && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className={clsx(
                      'absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50',
                      'dark:bg-gray-800 bg-gray-900 dark:text-gray-200 text-white',
                      'shadow-lg',
                    )}
                  >
                    {item.label}
                  </motion.div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={clsx(
          'mx-2 mb-3 flex items-center justify-center rounded-xl p-2 transition-colors cursor-pointer',
          'dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600',
          'dark:hover:bg-white/[0.04] hover:bg-gray-100',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  )
}
