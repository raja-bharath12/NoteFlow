import api from './api'
import { CreateFolderRequest, Folder, FolderPermission } from '../types'

export const folderService = {
  /**
   * Get all folders or subfolders of a given parent
   */
  async getFolders(parentId?: string | null): Promise<Folder[]> {
    const params = parentId !== undefined ? { parentId } : {}
    const response = await api.get('/folders', { params })
    return response.data.data || response.data
  },

  /**
   * Get root folders (folders without parent)
   */
  async getRootFolders(): Promise<Folder[]> {
    const response = await api.get('/folders/root')
    return response.data.data || response.data
  },

  /**
   * Get a specific folder by ID
   */
  async getFolder(id: string): Promise<Folder> {
    const response = await api.get(`/folders/${id}`)
    return response.data.data || response.data
  },

  /**
   * Create a new folder
   */
  async createFolder(data: CreateFolderRequest): Promise<Folder> {
    const response = await api.post('/folders', data)
    return response.data.data || response.data
  },

  /**
   * Update folder attributes (name, color, icon, etc.)
   */
  async updateFolder(id: string, data: Partial<Folder>): Promise<Folder> {
    const response = await api.put(`/folders/${id}`, data)
    return response.data.data || response.data
  },

  /**
   * Delete folder (soft delete or permanently)
   */
  async deleteFolder(id: string, permanent: boolean = false): Promise<void> {
    await api.delete(`/folders/${id}`, { params: { permanent } })
  },

  /**
   * Move folder to a new parent folder or root (null)
   */
  async moveFolder(id: string, newParentId: string | null): Promise<Folder> {
    const response = await api.patch(`/folders/${id}/move`, { parentId: newParentId })
    return response.data.data || response.data
  },

  /**
   * Duplicate a folder and its contents
   */
  async duplicateFolder(id: string): Promise<Folder> {
    const response = await api.post(`/folders/${id}/duplicate`)
    return response.data.data || response.data
  },

  /**
   * Star a folder
   */
  async starFolder(id: string): Promise<void> {
    await api.post(`/folders/${id}/star`)
  },

  /**
   * Unstar a folder
   */
  async unstarFolder(id: string): Promise<void> {
    await api.delete(`/folders/${id}/star`)
  },

  /**
   * Retrieve all starred folders
   */
  async getStarredFolders(): Promise<Folder[]> {
    const response = await api.get('/folders/starred')
    return response.data.data || response.data
  },

  /**
   * Move folder to trash
   */
  async trashFolder(id: string): Promise<void> {
    await api.post(`/folders/${id}/trash`)
  },

  /**
   * Restore folder from trash
   */
  async restoreFolder(id: string): Promise<Folder> {
    const response = await api.post(`/folders/${id}/restore`)
    return response.data.data || response.data
  },

  /**
   * Get permissions list for a folder
   */
  async getFolderPermissions(id: string): Promise<FolderPermission[]> {
    const response = await api.get(`/folders/${id}/permissions`)
    return response.data.data || response.data
  },

  /**
   * Share folder directly with a user by email
   */
  async shareFolderWithUser(id: string, email: string, role: string): Promise<FolderPermission> {
    const response = await api.post(`/folders/${id}/permissions`, { email, role })
    return response.data.data || response.data
  },

  /**
   * Get all trashed folders
   */
  async getTrashedFolders(): Promise<Folder[]> {
    const response = await api.get('/folders/trash')
    return response.data.data || response.data
  },
}

export default folderService
