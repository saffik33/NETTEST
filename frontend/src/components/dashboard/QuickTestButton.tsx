import { motion } from 'framer-motion'
import { Play, Loader2 } from 'lucide-react'
import { useTestRunner } from '../../hooks/useTestRunner'
import { useRealtimeStore } from '../../stores/realtimeStore'
import clsx from 'clsx'

export default function QuickTestButton() {
  const { mutate: runTest, isPending } = useTestRunner()
  const isRunning = useRealtimeStore((s) => s.testProgress.isRunning)
  const disabled = isPending || isRunning

  return (
    <motion.button
      onClick={() => runTest({ include_speed: true, include_ping: true, include_dns: true, include_wifi: true })}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={clsx(
        'relative flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all overflow-hidden cursor-pointer',
        disabled
          ? 'dark:bg-gray-800 bg-gray-300 dark:text-gray-500 text-gray-400 cursor-not-allowed'
          : [
              'bg-accent text-gray-950',
              'shadow-[0_0_25px_rgba(0,212,255,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
              'hover:shadow-[0_0_35px_rgba(0,212,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
            ].join(' '),
      )}
    >
      {/* Shimmer sweep */}
      {!disabled && (
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_2.5s_ease-in-out_infinite]"
          aria-hidden="true"
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        {isRunning ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Play size={22} fill="currentColor" />
            Run Speed Test
          </>
        )}
      </span>
    </motion.button>
  )
}
