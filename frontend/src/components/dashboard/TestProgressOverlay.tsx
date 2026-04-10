import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeStore } from '../../stores/realtimeStore'

export default function TestProgressOverlay() {
  const { isRunning, currentPhase, phaseDescription, speedProgress, speedPhase } =
    useRealtimeStore((s) => s.testProgress)

  const phaseLabels: Record<string, string> = {
    finding_server: 'Finding best server...',
    testing_download: 'Testing download speed...',
    testing_upload: 'Testing upload speed...',
    complete: 'Speed test complete!',
    speed: 'Running speed test...',
    ping: 'Running ping test...',
    dns: 'Testing DNS resolution...',
    wifi: 'Scanning WiFi info...',
    traceroute: 'Running traceroute...',
    device_scan: 'Scanning devices...',
  }

  const progressPct = Math.round(speedProgress * 100)

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-card dark:glass-glow p-4 dark:border-accent/20 border-accent/20"
          role="alert"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{
                boxShadow: ['0 0 0 0 rgba(0,212,255,0.4)', '0 0 0 6px rgba(0,212,255,0)', '0 0 0 0 rgba(0,212,255,0.4)'],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2.5 h-2.5 bg-accent rounded-full flex-shrink-0"
            />
            <span className="font-medium text-sm dark:text-accent text-accent-dim">
              {phaseLabels[speedPhase] || phaseLabels[currentPhase] || phaseDescription || 'Running test...'}
            </span>
          </div>
          {speedProgress > 0 && speedProgress < 1 && (
            <div className="w-full dark:bg-white/[0.06] bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              >
                {/* Shimmer on progress bar */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
