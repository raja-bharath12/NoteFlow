import React, { useEffect, useState } from 'react'
import { notificationService } from '../services/notificationService'
import { Notification } from '../types'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import { Bell, CheckCheck, Trash2, Mail, MessageSquare, Info, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      toast.success('All marked as read')
      loadNotifications()
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      loadNotifications()
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      loadNotifications()
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'INVITE':
      case 'SHARE':
        return <Mail className="w-4 h-4 text-purple-500" />
      case 'COMMENT':
      case 'MENTION':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-slate-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Activity updates, shares, and invitations
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-slate-300 dark:border-slate-800">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No notifications yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            You're all caught up! New alerts will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`glass-card p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                !n.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/20' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {n.message}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(n.id)
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Delete notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsView
