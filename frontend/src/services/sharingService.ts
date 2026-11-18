import api from './api'
import {
  Document,
  DocumentPermission,
  Folder,
  FolderPermission,
  Invitation,
  PermissionRole,
} from '../types'

export const sharingService = {
  /**
   * Share document with a user by email
   */
  async shareDocument(
    documentId: string,
    email: string,
    role: PermissionRole = 'VIEWER'
  ): Promise<DocumentPermission> {
    const response = await api.post(`/documents/${documentId}/permissions`, { email, role })
    return response.data.data || response.data
  },

  /**
   * Share folder with a user by email
   */
  async shareFolder(
    folderId: string,
    email: string,
    role: 'VIEWER' | 'EDITOR' = 'VIEWER'
  ): Promise<FolderPermission> {
    const response = await api.post(`/folders/${folderId}/permissions`, { email, role })
    return response.data.data || response.data
  },

  /**
   * Get permissions list for a document
   */
  async getDocumentPermissions(documentId: string): Promise<DocumentPermission[]> {
    const response = await api.get(`/documents/${documentId}/permissions`)
    return response.data.data || response.data
  },

  /**
   * Get permissions list for a folder
   */
  async getFolderPermissions(folderId: string): Promise<FolderPermission[]> {
    const response = await api.get(`/folders/${folderId}/permissions`)
    return response.data.data || response.data
  },

  /**
   * Update an existing permission role
   */
  async updatePermission(permissionId: string, role: string): Promise<void> {
    await api.put(`/permissions/${permissionId}`, { role })
  },

  /**
   * Revoke an existing permission
   */
  async revokePermission(permissionId: string): Promise<void> {
    await api.delete(`/permissions/${permissionId}`)
  },

  /**
   * Get documents and folders shared with the current user
   */
  async getSharedWithMe(): Promise<{ documents: Document[]; folders: Folder[] }> {
    const response = await api.get('/sharing/shared-with-me')
    return response.data.data || response.data
  },

  /**
   * Send an invitation to a user by email
   */
  async inviteUser(
    email: string,
    entityType: 'DOCUMENT' | 'FOLDER',
    entityId: string,
    role: string
  ): Promise<Invitation> {
    const response = await api.post('/invitations', { email, entityType, entityId, role })
    return response.data.data || response.data
  },

  /**
   * Accept an invitation using invitation ID or token
   */
  async acceptInvitation(tokenOrId: string): Promise<void> {
    await api.post(`/invitations/${tokenOrId}/accept`)
  },

  /**
   * Reject an invitation using invitation ID or token
   */
  async rejectInvitation(tokenOrId: string): Promise<void> {
    await api.post(`/invitations/${tokenOrId}/reject`)
  },

  /**
   * Get pending invitations for the current user
   */
  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await api.get('/invitations/pending')
    return response.data.data || response.data
  },
}

export default sharingService
