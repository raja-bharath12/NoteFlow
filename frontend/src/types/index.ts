export type Role = 'USER' | 'ADMIN' | 'MANAGER'
export type PermissionRole = 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'OWNER'
export type NotificationType = 'INVITE' | 'COMMENT' | 'MENTION' | 'SHARE' | 'SYSTEM'
export type EntityType = 'DOCUMENT' | 'FOLDER' | 'AUTH' | 'PERMISSION'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  role: Role
  bio?: string | null
  jobTitle?: string | null
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  parentId?: string | null
  ownerId: string
  owner?: User
  color?: string
  icon?: string
  isStarred?: boolean
  isTrashed?: boolean
  trashedAt?: string | null
  createdAt: string
  updatedAt: string
  documentCount?: number
  subfolderCount?: number
}

export interface Document {
  id: string
  title: string
  content: string
  folderId?: string | null
  folder?: Folder | null
  ownerId: string
  owner?: User
  isStarred?: boolean
  isTrashed?: boolean
  trashedAt?: string | null
  isArchived?: boolean
  tags: string[]
  wordCount: number
  characterCount: number
  lastEditedById?: string | null
  lastEditedBy?: User | null
  permissionRole?: PermissionRole
  createdAt: string
  updatedAt: string
}

export interface DocumentPermission {
  id: string
  documentId: string
  document?: Document
  userId: string
  user: User
  role: PermissionRole
  grantedBy: string
  createdAt: string
  updatedAt?: string
}

export interface FolderPermission {
  id: string
  folderId: string
  folder?: Folder
  userId: string
  user: User
  role: 'VIEWER' | 'EDITOR' | 'OWNER'
  grantedBy: string
  createdAt: string
  updatedAt?: string
}

export interface Comment {
  id: string
  documentId: string
  userId: string
  user: User
  parentId?: string | null
  content: string
  position?: string | null
  isResolved: boolean
  resolvedById?: string | null
  resolvedBy?: User | null
  resolvedAt?: string | null
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: number
  title: string
  content: string
  createdById: string
  createdBy?: User
  user?: User
  summary?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  link?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  user?: User
  entityType: EntityType
  entityId: string
  entityTitle?: string
  action: string
  details?: string
  createdAt: string
}

export interface DocumentAttachment {
  id: string
  documentId: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedById: string
  uploadedBy?: User
  createdAt: string
}

export interface DocumentStar {
  id: string
  documentId: string
  document?: Document
  userId: string
  createdAt: string
}

export interface FolderStar {
  id: string
  folderId: string
  folder?: Folder
  userId: string
  createdAt: string
}

export interface Invitation {
  id: string
  email: string
  inviterId: string
  inviter: User
  entityType: 'DOCUMENT' | 'FOLDER'
  entityId: string
  entityName: string
  role: PermissionRole
  status: InvitationStatus
  token?: string
  expiresAt: string
  createdAt: string
}

export interface DashboardStats {
  totalDocuments: number
  totalFolders: number
  sharedDocuments: number
  starredItems: number
  storageUsed: number // in bytes
  storageLimit: number // in bytes
  recentActivityCount: number
}

export interface SearchResult {
  id: string
  title: string
  snippet: string
  type: 'document' | 'folder'
  folderName?: string
  folderId?: string | null
  updatedAt: string
  tags?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
}

export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// Request and Auth Types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface CreateFolderRequest {
  name: string
  parentId?: string | null
  color?: string
  icon?: string
}

export interface CreateDocumentRequest {
  title: string
  content?: string
  folderId?: string | null
  tags?: string[]
}

export interface DocumentFilterParams {
  folderId?: string | null
  isStarred?: boolean
  isTrashed?: boolean
  isArchived?: boolean
  search?: string
  sortBy?: 'updatedAt' | 'title' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchFilters {
  type?: 'all' | 'document' | 'folder'
  folderId?: string
  tags?: string[]
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all'
}
