import { motion } from 'framer-motion'
import { getSpeedColor } from '../../utils/constants'

interface SpeedGaugeProps {
  label: string
  value: number | null
  maxValue?: number
}

export default function SpeedGauge({ label, value, maxValue = 500 }: SpeedGaugeProps) {
  const displayValue = value ?? 0
  const percentage = Math.min((displayValue / maxValue) * 100, 100)
  const circumference = 2 * Math.PI * 70
  const arcLength = circumference * 0.75
  const strokeDashoffset = circumference - (percentage / 100) * arcLength

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 120" className="w-48 h-36">
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <circle
          cx="80" cy="80" r="70"
          fill="none"
          strokeWidth="6"
          className="dark:stroke-white/[0.06] stroke-gray-200"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          transform="rotate(135 80 80)"
        />

        {/* Value arc */}
        <motion.circle
          cx="80" cy="80" r="70"
          fill="none"
          strokeWidth="7"
          stroke="currentColor"
          className={value != null ? getSpeedColor(value) : 'dark:text-gray-600 text-gray-400'}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          strokeLinecap="round"
          transform="rotate(135 80 80)"
          filter={value != null ? `url(#glow-${label})` : undefined}
        />

        {/* Value text */}
        <text x="80" y="70" textAnchor="middle" className="dark:fill-gray-100 fill-gray-900" fontSize="26" fontWeight="700" style={{ fontFamily: 'Inter, system-ui' }}>
          {value != null ? value.toFixed(1) : '--'}
        </text>
        <text x="80" y="90" textAnchor="middle" className="dark:fill-gray-500 fill-gray-400" fontSize="11" fontWeight="500">
          Mbps
        </text>
      </svg>
      <span className="text-xs font-medium tracking-label dark:text-gray-500 text-gray-400 -mt-2">{label}</span>
    </div>
  )
}
