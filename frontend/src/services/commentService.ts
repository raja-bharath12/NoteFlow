import api from './api'
import { Comment, ApiResponse } from '@/types'

export const commentService = {
  getComments: (documentId: number) =>
    api.get<ApiResponse<Comment[]>>(`/comments/document/${documentId}`),

  addComment: (documentId: number, content: string, parentCommentId?: number) =>
    api.post<ApiResponse<Comment>>('/comments', { documentId, content, parentCommentId }),

  replyToComment: (documentId: number, parentCommentId: number, content: string) =>
    api.post<ApiResponse<Comment>>('/comments', { documentId, content, parentCommentId }),

  updateComment: (commentId: number, content: string) =>
    api.put<ApiResponse<Comment>>(`/comments/${commentId}`, { content }),

  deleteComment: (commentId: number) =>
    api.delete<ApiResponse<void>>(`/comments/${commentId}`),

  resolveComment: (commentId: number) =>
    api.put<ApiResponse<Comment>>(`/comments/${commentId}/resolve`),

  unresolveComment: (commentId: number) =>
    api.put<ApiResponse<Comment>>(`/comments/${commentId}/unresolve`),
}
