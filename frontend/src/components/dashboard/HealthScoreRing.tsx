import { useMemo } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface Props {
  score: number
  trend_pct: number | null
  breakdown: {
    download: number
    upload: number
    latency: number
    jitter: number
    packet_loss: number
    wifi_signal: number | null
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: 'stroke-emerald-400', text: 'text-emerald-400', label: 'Excellent', glow: 'rgba(52,211,153,0.3)' }
  if (score >= 60) return { ring: 'stroke-blue-400', text: 'text-blue-400', label: 'Good', glow: 'rgba(96,165,250,0.3)' }
  if (score >= 40) return { ring: 'stroke-amber-400', text: 'text-amber-400', label: 'Fair', glow: 'rgba(251,191,36,0.3)' }
  if (score >= 20) return { ring: 'stroke-orange-400', text: 'text-orange-400', label: 'Poor', glow: 'rgba(251,146,60,0.3)' }
  return { ring: 'stroke-red-400', text: 'text-red-400', label: 'Critical', glow: 'rgba(248,113,113,0.3)' }
}

function getBarColor(value: number) {
  if (value >= 80) return 'bg-emerald-400'
  if (value >= 60) return 'bg-blue-400'
  if (value >= 40) return 'bg-amber-400'
  if (value >= 20) return 'bg-orange-400'
  return 'bg-red-400'
}

function BreakdownBar({ label, value, index }: { label: string; value: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
      className="flex items-center gap-2 text-xs"
    >
      <span className="w-16 dark:text-gray-500 text-gray-400 truncate">{label}</span>
      <div className="flex-1 h-1.5 dark:bg-white/[0.06] bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full', getBarColor(value))}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay: 0.2 + index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      <span className="w-7 text-right font-medium dark:text-gray-300 text-gray-600 tabular-nums">{value}</span>
    </motion.div>
  )
}

export default function HealthScoreRing({ score, trend_pct, breakdown }: Props) {
  const colors = useMemo(() => getScoreColor(score), [score])
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="glass-card p-6">
      <div className="flex items-start gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <defs>
              <filter id="health-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="6"
              className="dark:stroke-white/[0.06] stroke-gray-200" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none" strokeWidth="7"
              className={colors.ring}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: 'spring', stiffness: 40, damping: 12 }}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              filter="url(#health-glow)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-3xl font-bold', colors.text)}>{score}</span>
            <span className="text-[10px] font-medium dark:text-gray-500 text-gray-400">{colors.label}</span>
          </div>
        </div>

        {/* Breakdown + trend */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold dark:text-gray-100 text-gray-900">Network Health</h3>
            {trend_pct !== null && (
              <span className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                trend_pct >= 0
                  ? 'dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600'
                  : 'dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-600',
              )}>
                {trend_pct >= 0 ? '+' : ''}{trend_pct}% vs prev
              </span>
            )}
          </div>
          <BreakdownBar label="Download" value={breakdown.download} index={0} />
          <BreakdownBar label="Upload" value={breakdown.upload} index={1} />
          <BreakdownBar label="Latency" value={breakdown.latency} index={2} />
          <BreakdownBar label="Jitter" value={breakdown.jitter} index={3} />
          <BreakdownBar label="Pkt Loss" value={breakdown.packet_loss} index={4} />
          {breakdown.wifi_signal !== null && (
            <BreakdownBar label="WiFi" value={breakdown.wifi_signal} index={5} />
          )}
        </div>
      </div>
    </div>
  )
}
