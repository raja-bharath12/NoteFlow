/**
 * firebaseDb.ts
 * Firestore database service for NoteFlow.
 *
 * Collections:
 *  - users/{uid}
 *  - folders/{folderId}
 *  - documents/{documentId}
 *  - documents/{documentId}/versions/{versionId}
 *  - documents/{documentId}/comments/{commentId}
 *  - notifications/{notificationId}
 *  - activityLogs/{logId}
 *  - invitations/{invitationId}
 *  - documentPermissions/{id}
 *  - folderPermissions/{id}
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  writeBatch,
  increment,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const toDate = (ts: Timestamp | null | undefined): string =>
  ts ? ts.toDate().toISOString() : new Date().toISOString()

// ─── USERS ───────────────────────────────────────────────────────────────────
export const usersCol = collection(db, 'users')

export async function createUserProfile(uid: string, data: {
  email: string
  username: string
  avatarUrl?: string
}) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    isEmailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUserProfile(uid: string, data: Partial<{
  username: string
  avatarUrl: string
  isEmailVerified: boolean
}>) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

// ─── FOLDERS ─────────────────────────────────────────────────────────────────
export const foldersCol = collection(db, 'folders')

export async function createFolder(ownerId: string, data: {
  name: string
  parentFolderId?: string | null
  color?: string
  icon?: string
}) {
  return addDoc(foldersCol, {
    ...data,
    ownerId,
    parentFolderId: data.parentFolderId ?? null,
    color: data.color ?? '#3b82f6',
    icon: data.icon ?? 'folder',
    isStarred: false,
    isTrashed: false,
    trashedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getRootFolders(ownerId: string) {
  const q = query(
    foldersCol,
    where('ownerId', '==', ownerId),
    where('parentFolderId', '==', null),
    where('isTrashed', '==', false),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getChildFolders(ownerId: string, parentFolderId: string) {
  const q = query(
    foldersCol,
    where('ownerId', '==', ownerId),
    where('parentFolderId', '==', parentFolderId),
    where('isTrashed', '==', false),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateFolder(folderId: string, data: Partial<{
  name: string
  color: string
  icon: string
  parentFolderId: string | null
  isStarred: boolean
  isTrashed: boolean
  trashedAt: Timestamp | null
}>) {
  await updateDoc(doc(db, 'folders', folderId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteFolder(folderId: string) {
  await deleteDoc(doc(db, 'folders', folderId))
}

export async function getStarredFolders(ownerId: string) {
  const q = query(foldersCol, where('ownerId', '==', ownerId), where('isStarred', '==', true), where('isTrashed', '==', false))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getTrashedFolders(ownerId: string) {
  const q = query(foldersCol, where('ownerId', '==', ownerId), where('isTrashed', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documentsCol = collection(db, 'documents')

export async function createDocument(ownerId: string, data: {
  title?: string
  folderId?: string | null
  content?: string
}) {
  return addDoc(documentsCol, {
    title: data.title ?? 'Untitled',
    content: data.content ?? '',
    folderId: data.folderId ?? null,
    ownerId,
    isStarred: false,
    isTrashed: false,
    trashedAt: null,
    wordCount: 0,
    lastOpenedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getDocument(documentId: string) {
  const snap = await getDoc(doc(db, 'documents', documentId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getFolderDocuments(ownerId: string, folderId: string) {
  const q = query(
    documentsCol,
    where('ownerId', '==', ownerId),
    where('folderId', '==', folderId),
    where('isTrashed', '==', false),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getRecentDocuments(ownerId: string, maxItems = 10) {
  const q = query(
    documentsCol,
    where('ownerId', '==', ownerId),
    where('isTrashed', '==', false),
    orderBy('lastOpenedAt', 'desc'),
    limit(maxItems)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getStarredDocuments(ownerId: string) {
  const q = query(
    documentsCol,
    where('ownerId', '==', ownerId),
    where('isStarred', '==', true),
    where('isTrashed', '==', false),
    orderBy('updatedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getTrashedDocuments(ownerId: string) {
  const q = query(documentsCol, where('ownerId', '==', ownerId), where('isTrashed', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateDocument(documentId: string, data: Partial<{
  title: string
  content: string
  folderId: string | null
  isStarred: boolean
  isTrashed: boolean
  trashedAt: null
  wordCount: number
  lastOpenedAt: ReturnType<typeof serverTimestamp>
}>) {
  await updateDoc(doc(db, 'documents', documentId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteDocument(documentId: string) {
  await deleteDoc(doc(db, 'documents', documentId))
}

// Real-time listener for a single document
export function subscribeToDocument(documentId: string, cb: (data: any) => void) {
  return onSnapshot(doc(db, 'documents', documentId), snap => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() })
  })
}

// Search documents (basic client-side filter — for production use Algolia / Firebase Extensions)
export async function searchDocuments(ownerId: string, queryText: string) {
  const q = query(documentsCol, where('ownerId', '==', ownerId), where('isTrashed', '==', false))
  const snap = await getDocs(q)
  const lq = queryText.toLowerCase()
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(d => d.title?.toLowerCase().includes(lq) || d.content?.toLowerCase().includes(lq))
}

// ─── DOCUMENT VERSIONS ───────────────────────────────────────────────────────
export function versionsCol(documentId: string) {
  return collection(db, 'documents', documentId, 'versions')
}

export async function saveDocumentVersion(documentId: string, data: {
  title: string
  content: string
  wordCount: number
  createdBy: string
  versionNumber: number
}) {
  return addDoc(versionsCol(documentId), { ...data, createdAt: serverTimestamp() })
}

export async function getDocumentVersions(documentId: string) {
  const q = query(versionsCol(documentId), orderBy('versionNumber', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── COMMENTS ────────────────────────────────────────────────────────────────
export function commentsCol(documentId: string) {
  return collection(db, 'documents', documentId, 'comments')
}

export async function addComment(documentId: string, data: {
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  parentCommentId?: string | null
}) {
  return addDoc(commentsCol(documentId), {
    ...data,
    parentCommentId: data.parentCommentId ?? null,
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getComments(documentId: string) {
  const q = query(commentsCol(documentId), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateComment(documentId: string, commentId: string, content: string) {
  await updateDoc(doc(db, 'documents', documentId, 'comments', commentId), {
    content,
    updatedAt: serverTimestamp(),
  })
}

export async function resolveComment(documentId: string, commentId: string, resolvedBy: string) {
  await updateDoc(doc(db, 'documents', documentId, 'comments', commentId), {
    isResolved: true,
    resolvedBy,
    resolvedAt: serverTimestamp(),
  })
}

export async function deleteComment(documentId: string, commentId: string) {
  await deleteDoc(doc(db, 'documents', documentId, 'comments', commentId))
}

// Real-time comments listener
export function subscribeToComments(documentId: string, cb: (comments: any[]) => void) {
  const q = query(commentsCol(documentId), orderBy('createdAt', 'asc'))
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notificationsCol = collection(db, 'notifications')

export async function createNotification(data: {
  recipientId: string
  senderId: string
  type: string
  message: string
  resourceType?: string
  resourceId?: string
}) {
  return addDoc(notificationsCol, { ...data, isRead: false, createdAt: serverTimestamp() })
}

export async function getUserNotifications(userId: string) {
  const q = query(notificationsCol, where('recipientId', '==', userId), orderBy('createdAt', 'desc'), limit(50))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(notificationsCol, where('recipientId', '==', userId), where('isRead', '==', false))
  const snap = await getDocs(q)
  return snap.size
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), { isRead: true })
}

export async function markAllNotificationsRead(userId: string) {
  const q = query(notificationsCol, where('recipientId', '==', userId), where('isRead', '==', false))
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { isRead: true }))
  await batch.commit()
}

export async function deleteNotification(notificationId: string) {
  await deleteDoc(doc(db, 'notifications', notificationId))
}

// Real-time unread count listener
export function subscribeToUnreadCount(userId: string, cb: (count: number) => void) {
  const q = query(notificationsCol, where('recipientId', '==', userId), where('isRead', '==', false))
  return onSnapshot(q, snap => cb(snap.size))
}

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
export const docPermissionsCol = collection(db, 'documentPermissions')
export const folderPermissionsCol = collection(db, 'folderPermissions')

export async function grantDocumentPermission(data: {
  documentId: string
  userId: string
  permission: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  grantedBy: string
}) {
  // Use a deterministic ID to prevent duplicates
  const id = `${data.documentId}_${data.userId}`
  await setDoc(doc(db, 'documentPermissions', id), { ...data, createdAt: serverTimestamp() })
}

export async function getDocumentPermissions(documentId: string) {
  const q = query(docPermissionsCol, where('documentId', '==', documentId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function revokeDocumentPermission(documentId: string, userId: string) {
  await deleteDoc(doc(db, 'documentPermissions', `${documentId}_${userId}`))
}

export async function getGrantedDocuments(userId: string) {
  const q = query(docPermissionsCol, where('userId', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function grantFolderPermission(data: {
  folderId: string
  userId: string
  permission: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  grantedBy: string
}) {
  const id = `${data.folderId}_${data.userId}`
  await setDoc(doc(db, 'folderPermissions', id), { ...data, createdAt: serverTimestamp() })
}

export async function getFolderPermissions(folderId: string) {
  const q = query(folderPermissionsCol, where('folderId', '==', folderId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function revokeFolderPermission(folderId: string, userId: string) {
  await deleteDoc(doc(db, 'folderPermissions', `${folderId}_${userId}`))
}

// ─── INVITATIONS ─────────────────────────────────────────────────────────────
export const invitationsCol = collection(db, 'invitations')

export async function createInvitation(data: {
  inviterId: string
  inviterName: string
  inviteeEmail: string
  resourceType: 'DOCUMENT' | 'FOLDER'
  resourceId: string
  resourceName: string
  permission: 'VIEWER' | 'COMMENTER' | 'EDITOR'
  token: string
}) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return addDoc(invitationsCol, {
    ...data,
    status: 'PENDING',
    expiresAt,
    createdAt: serverTimestamp(),
  })
}

export async function getInvitationByToken(token: string) {
  const q = query(invitationsCol, where('token', '==', token), limit(1))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function getPendingInvitationsForEmail(email: string) {
  const q = query(invitationsCol, where('inviteeEmail', '==', email), where('status', '==', 'PENDING'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateInvitationStatus(invitationId: string, status: 'ACCEPTED' | 'REJECTED' | 'EXPIRED') {
  await updateDoc(doc(db, 'invitations', invitationId), { status })
}

// ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
export const activityLogsCol = collection(db, 'activityLogs')

export async function logActivity(data: {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  resourceName?: string
  metadata?: Record<string, unknown>
}) {
  return addDoc(activityLogsCol, { ...data, createdAt: serverTimestamp() })
}

export async function getUserActivityLogs(userId: string, maxItems = 20) {
  const q = query(activityLogsCol, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(maxItems))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
