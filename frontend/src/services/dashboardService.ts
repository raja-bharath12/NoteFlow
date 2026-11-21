/**
 * dashboardService.ts — Firebase Firestore implementation
 * Replaces the old Spring Boot REST API calls with direct Firestore queries.
 */
import {
  collection, query, where, orderBy, limit,
  getDocs, getCountFromServer,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { auth } from '@/lib/firebase'
import { DashboardStats, Document, Folder, ActivityLog } from '@/types'

const uid = () => auth.currentUser?.uid ?? ''

function docToDocument(d: any): Document {
  const data = d.data()
  return {
    id: d.id,
    title: data.title ?? 'Untitled',
    content: data.content ?? '',
    folderId: data.folderId ?? null,
    ownerId: data.ownerId,
    isStarred: data.isStarred ?? false,
    isTrashed: data.isTrashed ?? false,
    wordCount: data.wordCount ?? 0,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    lastOpenedAt: data.lastOpenedAt?.toDate?.()?.toISOString(),
  } as Document
}

function docToFolder(d: any): Folder {
  const data = d.data()
  return {
    id: d.id,
    name: data.name ?? 'Folder',
    parentFolderId: data.parentFolderId ?? null,
    ownerId: data.ownerId,
    color: data.color ?? '#3b82f6',
    icon: data.icon ?? 'folder',
    isStarred: data.isStarred ?? false,
    isTrashed: data.isTrashed ?? false,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  } as Folder
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const userId = uid()
    if (!userId) return {
      totalDocuments: 0, totalFolders: 0, sharedDocuments: 0,
      starredItems: 0, storageUsed: 0, storageLimit: 10737418240, recentActivityCount: 0,
    }

    const docsCol  = collection(db, 'documents')
    const foldCol  = collection(db, 'folders')

    const [docsSnap, foldSnap, starredDocsSnap, starredFoldSnap] = await Promise.all([
      getCountFromServer(query(docsCol, where('ownerId', '==', userId), where('isTrashed', '==', false))),
      getCountFromServer(query(foldCol, where('ownerId', '==', userId), where('isTrashed', '==', false))),
      getCountFromServer(query(docsCol, where('ownerId', '==', userId), where('isStarred', '==', true))),
      getCountFromServer(query(foldCol, where('ownerId', '==', userId), where('isStarred', '==', true))),
    ])

    return {
      totalDocuments: docsSnap.data().count,
      totalFolders: foldSnap.data().count,
      sharedDocuments: 0,
      starredItems: starredDocsSnap.data().count + starredFoldSnap.data().count,
      storageUsed: 0,
      storageLimit: 10737418240,
      recentActivityCount: 0,
    }
  },

  async getRecentDocuments(n = 6): Promise<Document[]> {
    const userId = uid()
    if (!userId) return []
    const q = query(
      collection(db, 'documents'),
      where('ownerId', '==', userId),
      where('isTrashed', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(n),
    )
    const snap = await getDocs(q)
    return snap.docs.map(docToDocument)
  },

  async getStarredItems(): Promise<{ documents: Document[]; folders: Folder[] }> {
    const userId = uid()
    if (!userId) return { documents: [], folders: [] }

    const [docsSnap, foldSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'documents'),
        where('ownerId', '==', userId),
        where('isStarred', '==', true),
        where('isTrashed', '==', false),
        limit(10),
      )),
      getDocs(query(
        collection(db, 'folders'),
        where('ownerId', '==', userId),
        where('isStarred', '==', true),
        where('isTrashed', '==', false),
        limit(10),
      )),
    ])

    return {
      documents: docsSnap.docs.map(docToDocument),
      folders: foldSnap.docs.map(docToFolder),
    }
  },

  async getRecentActivity(n = 8): Promise<ActivityLog[]> {
    // Activity logs not yet stored in Firestore — return empty
    return []
  },
}

export default dashboardService
