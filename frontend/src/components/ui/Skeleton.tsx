import clsx from 'clsx'

const shimmerBg = [
  'relative overflow-hidden',
  'dark:bg-white/[0.04] bg-gray-200/60',
  'rounded-lg',
  'after:absolute after:inset-0',
  'after:bg-gradient-to-r after:from-transparent after:via-white/[0.06] after:to-transparent',
  'after:animate-[shimmer-sweep_2s_ease-in-out_infinite]',
  'after:bg-[length:200%_100%]',
].join(' ')

export function SkeletonLine({ className, width }: { className?: string; width?: string }) {
  return (
    <div className={clsx(shimmerBg, 'h-4', className)} style={{ width: width || '100%' }} />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('glass-card p-6 space-y-4', className)}>
      <SkeletonLine width="40%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="55%" />
    </div>
  )
}

export function SkeletonChart({ className, height = 300 }: { className?: string; height?: number }) {
  return (
    <div
      className={clsx('glass-card p-6', className)}
      style={{ height }}
    >
      <SkeletonLine width="30%" className="mb-4" />
      <div className="flex items-end gap-2 h-[calc(100%-3rem)]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={clsx(shimmerBg, 'flex-1 rounded-t-md')}
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx('glass-card p-6 space-y-3', className)}>
      <SkeletonLine width="25%" className="mb-4 h-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <SkeletonLine width="20%" />
          <SkeletonLine width="30%" />
          <SkeletonLine width="25%" />
          <SkeletonLine width="15%" />
        </div>
      ))}
    </div>
  )
}
