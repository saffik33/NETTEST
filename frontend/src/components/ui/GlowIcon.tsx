import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface GlowIconProps {
  icon: LucideIcon
  active?: boolean
  size?: number
  className?: string
}

export default function GlowIcon({ icon: Icon, active = false, size = 20, className }: GlowIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={1.5}
      className={clsx(
        'transition-all duration-300',
        active && 'text-accent drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]',
        className,
      )}
    />
  )
}
