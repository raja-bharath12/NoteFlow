import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt?: Date | string | null
  onRetry?: () => void
  className?: string
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSavedAt,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center text-xs font-medium select-none ${className}`}>
      <AnimatePresence mode="wait">
        {status === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Saving...</span>
          </motion.div>
        )}

        {status === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/40"
            title={lastSavedAt ? `Last saved ${formatRelativeTime(lastSavedAt)}` : 'All changes saved to cloud'}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Saved</span>
          </motion.div>
        )}

        {status === 'unsaved' && (
          <motion.div
            key="unsaved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-900/40"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Unsaved changes</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full border border-red-200/60 dark:border-red-900/40"
          >
            <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save failed</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-1 underline font-semibold hover:text-red-800 dark:hover:text-red-300 flex items-center gap-0.5"
                title="Retry saving document"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Retry</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SaveStatusIndicator
