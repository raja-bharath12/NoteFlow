/**
 * useFirestore.ts
 * Custom hooks that expose Firestore collections as reactive React state.
 * Components can use these instead of (or alongside) the axios API services.
 */
import { useState, useEffect, useCallback } from 'react'
import { onSnapshot, query, where, orderBy, limit, collection } from 'firebase/firestore'
import { db } from '@/lib/firebaseDb'
import {
  subscribeToDocument,
  subscribeToComments,
  subscribeToUnreadCount,
  getRootFolders,
  getChildFolders,
  getFolderDocuments,
  getRecentDocuments,
  getStarredDocuments,
  getStarredFolders,
  getTrashedDocuments,
  getTrashedFolders,
  getUserActivityLogs,
  getDocumentPermissions,
  getFolderPermissions,
  getUserNotifications,
} from '@/lib/firebaseDb'
import { useAuth } from '@/contexts/AuthContext'

// ─── Root folders ──────────────────────────────────────────────────────────
export function useRootFolders() {
  const { user } = useAuth()
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getRootFolders(user.uid).then(f => { setFolders(f); setLoading(false) })
  }, [user])

  const refresh = useCallback(() => {
    if (!user) return
    getRootFolders(user.uid).then(setFolders)
  }, [user])

  return { folders, loading, refresh }
}

// ─── Child folders ────────────────────────────────────────────────────────
export function useChildFolders(parentFolderId: string | null) {
  const { user } = useAuth()
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !parentFolderId) { setLoading(false); return }
    getChildFolders(user.uid, parentFolderId).then(f => { setFolders(f); setLoading(false) })
  }, [user, parentFolderId])

  return { folders, loading }
}

// ─── Folder documents ─────────────────────────────────────────────────────
export function useFolderDocuments(folderId: string | null) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !folderId) { setLoading(false); return }
    getFolderDocuments(user.uid, folderId).then(d => { setDocuments(d); setLoading(false) })
  }, [user, folderId])

  return { documents, loading }
}

// ─── Live document (real-time) ─────────────────────────────────────────────
export function useDocument(documentId: string | null) {
  const [document, setDocument] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!documentId) { setLoading(false); return }
    const unsub = subscribeToDocument(documentId, data => {
      setDocument(data)
      setLoading(false)
    })
    return unsub
  }, [documentId])

  return { document, loading }
}

// ─── Live comments (real-time) ────────────────────────────────────────────
export function useComments(documentId: string | null) {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!documentId) { setLoading(false); return }
    const unsub = subscribeToComments(documentId, data => {
      setComments(data)
      setLoading(false)
    })
    return unsub
  }, [documentId])

  return { comments, loading }
}

// ─── Live unread notification count ──────────────────────────────────────
export function useUnreadNotificationCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToUnreadCount(user.uid, setCount)
    return unsub
  }, [user])

  return count
}

// ─── Notifications ────────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getUserNotifications(user.uid).then(n => { setNotifications(n); setLoading(false) })
  }, [user])

  return { notifications, loading }
}

// ─── Recent documents ─────────────────────────────────────────────────────
export function useRecentDocuments(max = 10) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getRecentDocuments(user.uid, max).then(d => { setDocuments(d); setLoading(false) })
  }, [user, max])

  return { documents, loading }
}

// ─── Starred items ────────────────────────────────────────────────────────
export function useStarredItems() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getStarredDocuments(user.uid),
      getStarredFolders(user.uid),
    ]).then(([docs, fols]) => {
      setDocuments(docs)
      setFolders(fols)
      setLoading(false)
    })
  }, [user])

  return { documents, folders, loading }
}

// ─── Trash ────────────────────────────────────────────────────────────────
export function useTrashItems() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getTrashedDocuments(user.uid),
      getTrashedFolders(user.uid),
    ]).then(([docs, fols]) => {
      setDocuments(docs)
      setFolders(fols)
      setLoading(false)
    })
  }, [user])

  return { documents, folders, loading }
}

// ─── Activity log ─────────────────────────────────────────────────────────
export function useActivityLog(max = 20) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getUserActivityLogs(user.uid, max).then(l => { setLogs(l); setLoading(false) })
  }, [user, max])

  return { logs, loading }
}

// ─── Document permissions ─────────────────────────────────────────────────
export function useDocumentPermissions(documentId: string | null) {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!documentId) { setLoading(false); return }
    getDocumentPermissions(documentId).then(p => { setPermissions(p); setLoading(false) })
  }, [documentId])

  return { permissions, loading }
}
