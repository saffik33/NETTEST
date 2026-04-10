import { motion } from 'framer-motion'
import clsx from 'clsx'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  glow?: boolean
  noPadding?: boolean
  animate?: boolean
}

export default function GlassCard({
  children,
  className,
  elevated = false,
  glow = false,
  noPadding = false,
  animate = true,
}: GlassCardProps) {
  const classes = clsx(
    'glass-card',
    elevated && 'glass-card-elevated',
    glow && 'glass-glow',
    !noPadding && 'p-6',
    className,
  )

  if (!animate) {
    return <div className={classes}>{children}</div>
  }

  return (
    <motion.div
      className={classes}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
