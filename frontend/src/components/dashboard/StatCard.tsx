import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: 'blue' | 'purple' | 'green' | 'yellow'
  trend?: {
    value: number
    isPositive?: boolean
    text?: string
  }
  link?: string
  isLoading?: boolean
  subtitle?: string
}

const colorStyles = {
  blue: {
    bg: 'from-blue-500/10 via-blue-500/5 to-transparent',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badge: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    glow: 'group-hover:shadow-blue-500/10',
    ring: 'focus-visible:ring-blue-500',
  },
  purple: {
    bg: 'from-purple-500/10 via-purple-500/5 to-transparent',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    badge: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    glow: 'group-hover:shadow-purple-500/10',
    ring: 'focus-visible:ring-purple-500',
  },
  green: {
    bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    glow: 'group-hover:shadow-emerald-500/10',
    ring: 'focus-visible:ring-emerald-500',
  },
  yellow: {
    bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    badge: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    glow: 'group-hover:shadow-amber-500/10',
    ring: 'focus-visible:ring-amber-500',
  },
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  trend,
  link,
  isLoading = false,
  subtitle,
}) => {
  const styles = colorStyles[color]

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="mt-4">
          <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="mt-2 h-3 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    )
  }

  const content = (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white/70 dark:bg-slate-900/70 p-5 backdrop-blur-md transition-all duration-300',
        'shadow-sm hover:shadow-xl',
        styles.border,
        styles.glow,
        'before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-100 before:pointer-events-none',
        styles.bg
      )}
    >
      {/* Top row: Label & Icon */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl shadow-inner transition-transform duration-300 group-hover:scale-110',
            styles.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Main Stat Value */}
      <div className="relative z-10 mt-3">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Subtitle or Trend */}
        <div className="mt-2 flex items-center gap-2">
          {trend ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                trend.isPositive !== false
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {trend.isPositive !== false ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
              {trend.text && <span className="opacity-80">({trend.text})</span>}
            </span>
          ) : subtitle ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</span>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">Updated recently</span>
          )}
        </div>
      </div>

      {/* Subtle corner light indicator */}
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-current opacity-5 blur-2xl pointer-events-none" />
    </motion.div>
  )

  if (link) {
    return (
      <Link to={link} className="block outline-none focus-visible:ring-2 rounded-2xl">
        {content}
      </Link>
    )
  }

  return content
}

export default StatCard
