import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, Plus } from 'lucide-react'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
}

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction | { label: string; onClick: () => void }
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = '',
}) => {
  const resolvedAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined)
  const ActionIcon = (resolvedAction as any)?.icon || Plus

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto ${className}`}
    >
      {/* Icon with glowing aura */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-2xl -z-10 scale-150 animate-pulse" />
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-750 border border-blue-100/80 dark:border-slate-700/80 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Icon className="w-10 h-10 stroke-[1.75]" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-sm">
        {description}
      </p>

      {resolvedAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resolvedAction.onClick}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/20"
        >
          <ActionIcon className="w-4 h-4" />
          {resolvedAction.label}
        </motion.button>
      )}
    </motion.div>
  )
}

export default EmptyState
