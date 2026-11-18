import api from './api'
import {
  CreateDocumentRequest,
  Document,
  DocumentFilterParams,
  DocumentVersion,
} from '../types'

export const documentService = {
  /**
   * Get documents, optionally filtered by folder or query params
   */
  async getDocuments(folderId?: string | null, params?: DocumentFilterParams): Promise<Document[]> {
    const queryParams: Record<string, unknown> = { ...params }
    if (folderId !== undefined) {
      queryParams.folderId = folderId
    }
    const response = await api.get('/documents', { params: queryParams })
    return response.data.data || response.data
  },

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`)
    return response.data.data || response.data
  },

  /**
   * Create a new document
   */
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const response = await api.post('/documents', data)
    return response.data.data || response.data
  },

  /**
   * Update document content or metadata
   */
  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const response = await api.put(`/documents/${id}`, data)
    return response.data.data || response.data
  },

  /**
   * Delete document (soft delete or permanently)
   */
  async deleteDocument(id: string, permanent: boolean = false): Promise<void> {
    await api.delete(`/documents/${id}`, { params: { permanent } })
  },

  /**
   * Duplicate a document
   */
  async duplicateDocument(id: string): Promise<Document> {
    const response = await api.post(`/documents/${id}/duplicate`)
    return response.data.data || response.data
  },

  /**
   * Move document to a folder or root (null)
   */
  async moveDocument(id: string, folderId: string | null): Promise<Document> {
    const response = await api.patch(`/documents/${id}/move`, { folderId })
    return response.data.data || response.data
  },

  /**
   * Star a document
   */
  async starDocument(id: string): Promise<void> {
    await api.post(`/documents/${id}/star`)
  },

  /**
   * Unstar a document
   */
  async unstarDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}/star`)
  },

  /**
   * Get all starred documents
   */
  async getStarredDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/starred')
    return response.data.data || response.data
  },

  /**
   * Move document to trash
   */
  async trashDocument(id: string): Promise<void> {
    await api.post(`/documents/${id}/trash`)
  },

  /**
   * Restore document from trash
   */
  async restoreDocument(id: string): Promise<Document> {
    const response = await api.post(`/documents/${id}/restore`)
    return response.data.data || response.data
  },

  /**
   * Get version history for a document
   */
  async getVersions(id: string): Promise<DocumentVersion[]> {
    const response = await api.get(`/documents/${id}/versions`)
    return response.data.data || response.data
  },

  /**
   * Restore document to a specific historical version
   */
  async restoreVersion(documentId: string, versionId: string): Promise<Document> {
    const response = await api.post(`/documents/${documentId}/versions/${versionId}/restore`)
    return response.data.data || response.data
  },

  /**
   * Get recently edited or accessed documents
   */
  async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    const response = await api.get('/documents/recent', { params: { limit } })
    return response.data.data || response.data
  },

  /**
   * Export document as PDF file Blob
   */
  async exportPdf(id: string): Promise<Blob> {
    const response = await api.get(`/documents/${id}/export/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Export document as DOCX file Blob
   */
  async exportDocx(id: string): Promise<Blob> {
    const response = await api.get(`/documents/${id}/export/docx`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get all trashed documents
   */
  async getTrashedDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/trash')
    return response.data.data || response.data
  },

  /**
   * Clear recent documents history
   */
  async clearRecentDocuments(): Promise<void> {
    await api.delete('/documents/recent')
  },

  /**
   * Permanently empty trash items
   */
  async emptyTrash(): Promise<void> {
    await api.delete('/trash/empty')
  },
}

export default documentService
