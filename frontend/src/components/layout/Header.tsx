import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useRealtimeStore } from '../../stores/realtimeStore'

export default function Header() {
  const { isRunning } = useRealtimeStore((s) => s.testProgress)

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <header className="h-14 dark:bg-surface-1/40 bg-white/60 dark:backdrop-blur-xl backdrop-blur-xl dark:border-b dark:border-border-subtle border-b border-gray-200/60 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm dark:text-accent text-accent-dim font-medium"
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(0,212,255,0.4)', '0 0 0 6px rgba(0,212,255,0)', '0 0 0 0 rgba(0,212,255,0.4)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-accent rounded-full"
            />
            Test running...
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Command palette trigger */}
        <button
          onClick={openCommandPalette}
          aria-label="Open command palette (Ctrl+K)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs dark:text-gray-500 text-gray-400 dark:bg-white/[0.03] bg-gray-100 dark:border dark:border-border-subtle border border-gray-200/60 dark:hover:bg-white/[0.06] hover:bg-gray-200/60 transition-colors cursor-pointer"
        >
          <Search size={13} strokeWidth={1.5} />
          <span>Search...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded dark:bg-white/[0.06] bg-gray-200 text-[10px] font-mono">
            Ctrl+K
          </kbd>
        </button>

        <ThemeToggle />
      </div>
    </header>
  )
}
