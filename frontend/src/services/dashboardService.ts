import api from './api'
import { DashboardStats, Document, Folder, ActivityLog, ApiResponse } from '@/types'

export const dashboardService = {
  getDashboardStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard'),

  getRecentDocuments: () =>
    api.get<ApiResponse<Document[]>>('/dashboard/recent'),

  getStarredItems: () =>
    api.get<ApiResponse<{ documents: Document[]; folders: Folder[] }>>('/dashboard/starred'),

  getRecentActivity: () =>
    api.get<ApiResponse<ActivityLog[]>>('/dashboard/activity'),
}
