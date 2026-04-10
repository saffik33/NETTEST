import { motion } from 'framer-motion'
import clsx from 'clsx'

interface SummaryCardProps {
  label: string
  value: string
  subtitle?: string
  colorClass?: string
  icon?: React.ReactNode
  index?: number
  liveRegion?: boolean
}

export default function SummaryCard({ label, value, subtitle, colorClass, icon, index = 0, liveRegion }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-card p-5"
      {...(liveRegion ? { 'aria-live': 'polite' as const, 'aria-atomic': true } : {})}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-label dark:text-gray-500 text-gray-400">{label}</span>
        {icon && <span className="dark:text-gray-600 text-gray-300">{icon}</span>}
      </div>
      <div className={clsx('text-2xl font-bold tracking-tight', colorClass || 'dark:text-gray-100 text-gray-900')}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs dark:text-gray-500 text-gray-400 mt-1">{subtitle}</div>
      )}
    </motion.div>
  )
}
