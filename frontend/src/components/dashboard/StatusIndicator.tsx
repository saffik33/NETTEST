import { motion } from 'framer-motion'
import clsx from 'clsx'

interface StatusIndicatorProps {
  status: 'good' | 'fair' | 'poor' | 'unknown'
  label?: string
}

const statusConfig = {
  good: { color: 'bg-emerald-400', glow: 'rgba(52,211,153,0.4)', text: 'dark:text-emerald-400 text-emerald-600', label: 'Healthy' },
  fair: { color: 'bg-amber-400', glow: 'rgba(251,191,36,0.4)', text: 'dark:text-amber-400 text-amber-600', label: 'Fair' },
  poor: { color: 'bg-red-400', glow: 'rgba(248,113,113,0.4)', text: 'dark:text-red-400 text-red-600', label: 'Poor' },
  unknown: { color: 'bg-gray-400', glow: 'rgba(156,163,175,0.3)', text: 'dark:text-gray-400 text-gray-500', label: 'No data' },
}

export default function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const config = statusConfig[status]
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{
          boxShadow: [
            `0 0 0 0 ${config.glow}`,
            `0 0 0 5px transparent`,
            `0 0 0 0 ${config.glow}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={clsx('w-2.5 h-2.5 rounded-full', config.color)}
      />
      <span className={clsx('text-sm font-medium', config.text)}>{label || config.label}</span>
    </div>
  )
}
