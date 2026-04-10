import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home, Zap, HeartPulse, Wifi, Smartphone, Route, Bell,
  ShieldCheck, Activity, UserCircle, Settings, Search, Play, Sun, Moon,
} from 'lucide-react'

const pages = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Speed History', path: '/speed', icon: Zap },
  { name: 'Network Health', path: '/network-health', icon: HeartPulse },
  { name: 'WiFi Analysis', path: '/wifi', icon: Wifi },
  { name: 'Devices', path: '/devices', icon: Smartphone },
  { name: 'Traceroute', path: '/traceroute', icon: Route },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Uptime', path: '/uptime', icon: ShieldCheck },
  { name: 'Bandwidth', path: '/bandwidth', icon: Activity },
  { name: 'Profiles', path: '/profiles', icon: UserCircle },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const goTo = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg"
          >
            <Command
              className="dark:bg-surface-0/95 bg-white/95 dark:backdrop-blur-2xl backdrop-blur-2xl dark:border dark:border-border-highlight border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
              label="Command palette"
            >
              <div className="flex items-center gap-3 px-4 dark:border-b dark:border-border-subtle border-b border-gray-100">
                <Search size={16} className="dark:text-gray-500 text-gray-400 flex-shrink-0" />
                <Command.Input
                  placeholder="Search pages and actions..."
                  className="w-full py-3.5 bg-transparent text-sm dark:text-gray-100 text-gray-900 placeholder-gray-500 outline-none"
                />
              </div>
              <Command.List className="max-h-72 overflow-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm dark:text-gray-500 text-gray-400">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:dark:text-gray-500 [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:tracking-label">
                  {pages.map((page) => (
                    <Command.Item
                      key={page.path}
                      value={page.name}
                      onSelect={() => goTo(page.path)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer dark:text-gray-300 text-gray-700 dark:data-[selected=true]:bg-white/[0.06] data-[selected=true]:bg-gray-100 dark:data-[selected=true]:text-accent data-[selected=true]:text-accent-dim transition-colors"
                    >
                      <page.icon size={16} strokeWidth={1.5} />
                      {page.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions" className="mt-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:dark:text-gray-500 [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:tracking-label">
                  <Command.Item
                    value="Run Speed Test"
                    onSelect={() => goTo('/')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer dark:text-gray-300 text-gray-700 dark:data-[selected=true]:bg-white/[0.06] data-[selected=true]:bg-gray-100 dark:data-[selected=true]:text-accent data-[selected=true]:text-accent-dim transition-colors"
                  >
                    <Play size={16} strokeWidth={1.5} />
                    Run Speed Test
                  </Command.Item>
                  <Command.Item
                    value="Toggle Theme"
                    onSelect={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer dark:text-gray-300 text-gray-700 dark:data-[selected=true]:bg-white/[0.06] data-[selected=true]:bg-gray-100 dark:data-[selected=true]:text-accent data-[selected=true]:text-accent-dim transition-colors"
                  >
                    {document.documentElement.classList.contains('dark')
                      ? <Sun size={16} strokeWidth={1.5} />
                      : <Moon size={16} strokeWidth={1.5} />
                    }
                    Toggle Theme
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
