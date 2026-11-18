import api from './api'
import { Notification } from '../types'

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  async getNotifications(page = 0, limit = 20): Promise<{ items: Notification[]; total: number }> {
    try {
      const response = await api.get('/notifications', { params: { page, limit } })
      const data = response.data.data || response.data
      if (Array.isArray(data)) {
        return { items: data, total: data.length }
      }
      return data || { items: [], total: 0 }
    } catch {
      return { items: [], total: 0 }
    }
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count')
      const data = response.data.data !== undefined ? response.data.data : response.data
      if (typeof data === 'number') return data
      if (data && typeof data.count === 'number') return data.count
      return 0
    } catch {
      return 0
    }
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id: string): Promise<void> {
    try {
      await api.patch(`/notifications/${id}/read`)
    } catch {
      // Ignore errors
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/read-all')
    } catch {
      // Ignore errors
    }
  },
}

export default notificationService
