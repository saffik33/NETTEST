import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ShimmerButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

const variantClasses = {
  primary: [
    'bg-accent dark:bg-accent text-gray-950 font-semibold',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_3px_rgba(0,0,0,0.2)]',
    'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_20px_rgba(0,212,255,0.2)]',
  ].join(' '),
  secondary: [
    'dark:bg-white/[0.06] bg-gray-100 dark:text-gray-200 text-gray-700 font-medium',
    'dark:border dark:border-white/[0.1] border border-gray-200',
    'dark:hover:bg-white/[0.1] hover:bg-gray-200',
  ].join(' '),
  ghost: [
    'bg-transparent dark:text-gray-300 text-gray-600 font-medium',
    'dark:hover:bg-white/[0.06] hover:bg-gray-100',
  ].join(' '),
  danger: [
    'bg-red-500/90 dark:bg-red-500/80 text-white font-semibold',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
    'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_15px_rgba(239,68,68,0.15)]',
  ].join(' '),
}

export default function ShimmerButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
}: ShimmerButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={clsx(
        'relative overflow-hidden transition-colors duration-200 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-0',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {/* Shimmer overlay on hover */}
      <span
        className={clsx(
          'absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent',
          'before:animate-[shimmer_1.5s_ease-in-out_infinite]',
        )}
        aria-hidden="true"
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  )
}
