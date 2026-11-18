import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Folder,
  Share2,
  Trash2,
  Star,
  Edit3,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { ActivityLog } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export interface ActivityFeedProps {
  activities: ActivityLog[]
  isLoading?: boolean
  className?: string
  maxItems?: number
}

function getActivityIcon(action: string, entityType: string) {
  const act = (action || '').toLowerCase()
  if (act.includes('create') || act.includes('new')) {
    return {
      icon: PlusCircle,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    }
  }
  if (act.includes('edit') || act.includes('update')) {
    return {
      icon: Edit3,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    }
  }
  if (act.includes('share') || act.includes('invite')) {
    return {
      icon: Share2,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    }
  }
  if (act.includes('star')) {
    return {
      icon: Star,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    }
  }
  if (act.includes('trash') || act.includes('delete')) {
    return {
      icon: Trash2,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    }
  }

  return entityType === 'FOLDER'
    ? { icon: Folder, bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
    : { icon: FileText, bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' }
}

function getResourceLink(activity: ActivityLog): string | null {
  if (activity.entityType === 'DOCUMENT' && activity.entityId) {
    return `/document/${activity.entityId}`
  }
  if (activity.entityType === 'FOLDER' && activity.entityId) {
    return `/folder/${activity.entityId}`
  }
  return null
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  isLoading = false,
  className,
  maxItems = 8,
}) => {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-2.5 w-1/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const items = activities.slice(0, maxItems)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400">
          <Clock className="h-6 w-6" />
        </div>
        <h4 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          No recent activity
        </h4>
        <p className="mt-1 text-xs text-slate-400 max-w-xs">
          Your changes, shared notes, and document creations will appear in this timeline.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative space-y-4', className)}>
      {/* Vertical timeline guide line */}
      <div className="absolute left-4 top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-800" />

      {items.map((activity) => {
        const { icon: Icon, bg } = getActivityIcon(activity.action, activity.entityType)
        const targetLink = getResourceLink(activity)
        const title = activity.entityTitle || 'Untitled Item'

        return (
          <div
            key={activity.id}
            className="group relative flex items-start gap-3 transition-colors rounded-xl p-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
          >
            {/* Action Icon Badge */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-105',
                bg
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {activity.user?.name ? activity.user.name : 'You'}
                </span>{' '}
                <span className="text-slate-500 dark:text-slate-400">
                  {activity.action.toLowerCase()}{' '}
                </span>
                {targetLink ? (
                  <Link
                    to={targetLink}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    {title}
                    <ArrowRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {title}
                  </span>
                )}
              </p>

              {activity.details && (
                <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                  {activity.details}
                </p>
              )}

              <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
                {formatRelativeTime(activity.createdAt)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ActivityFeed
