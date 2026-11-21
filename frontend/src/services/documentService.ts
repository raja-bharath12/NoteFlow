/**
 * documentService.ts — Firebase Firestore implementation
 * Replaces the old Spring Boot REST API calls with direct Firestore queries.
 */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Document, CreateDocumentRequest, DocumentFilterParams, DocumentVersion } from '../types'

const uid = () => auth.currentUser?.uid ?? ''
const docsCol = collection(db, 'documents')

function snap2Doc(d: any): Document {
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
    permissions: [],
  } as Document
}

export const documentService = {
  async getDocuments(folderId?: string | null, params?: DocumentFilterParams): Promise<Document[]> {
    const userId = uid()
    if (!userId) return []

    const constraints: any[] = [
      where('ownerId', '==', userId),
      where('isTrashed', '==', false),
      orderBy('updatedAt', 'desc'),
    ]
    if (folderId !== undefined) {
      constraints.unshift(where('folderId', '==', folderId ?? null))
    }
    const snap = await getDocs(query(docsCol, ...constraints))
    return snap.docs.map(snap2Doc)
  },

  async getDocument(id: string): Promise<Document> {
    const snap = await getDoc(doc(db, 'documents', id))
    if (!snap.exists()) throw new Error('Document not found')
    // Update lastOpenedAt
    updateDoc(doc(db, 'documents', id), { lastOpenedAt: serverTimestamp() }).catch(() => {})
    return snap2Doc(snap)
  },

  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const userId = uid()
    const ref = await addDoc(docsCol, {
      title: data.title ?? 'Untitled',
      content: data.content ?? '',
      folderId: data.folderId ?? null,
      ownerId: userId,
      isStarred: false,
      isTrashed: false,
      wordCount: 0,
      lastOpenedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    return snap2Doc(snap)
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const wordCount = data.content
      ? data.content.trim().split(/\s+/).filter(Boolean).length
      : undefined
    await updateDoc(doc(db, 'documents', id), {
      ...data,
      ...(wordCount !== undefined && { wordCount }),
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(doc(db, 'documents', id))
    return snap2Doc(snap)
  },

  async deleteDocument(id: string, permanent = false): Promise<void> {
    if (permanent) {
      await deleteDoc(doc(db, 'documents', id))
    } else {
      await updateDoc(doc(db, 'documents', id), {
        isTrashed: true,
        trashedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  },

  async duplicateDocument(id: string): Promise<Document> {
    const snap = await getDoc(doc(db, 'documents', id))
    if (!snap.exists()) throw new Error('Document not found')
    const data = snap.data()
    const ref = await addDoc(docsCol, {
      ...data,
      title: `${data.title ?? 'Untitled'} (copy)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastOpenedAt: serverTimestamp(),
    })
    const newSnap = await getDoc(ref)
    return snap2Doc(newSnap)
  },

  async starDocument(id: string): Promise<void> {
    await updateDoc(doc(db, 'documents', id), { isStarred: true, updatedAt: serverTimestamp() })
  },

  async unstarDocument(id: string): Promise<void> {
    await updateDoc(doc(db, 'documents', id), { isStarred: false, updatedAt: serverTimestamp() })
  },

  async getStarredDocuments(): Promise<Document[]> {
    const userId = uid()
    if (!userId) return []
    const q = query(
      docsCol,
      where('ownerId', '==', userId),
      where('isStarred', '==', true),
      where('isTrashed', '==', false),
    )
    const snap = await getDocs(q)
    return snap.docs.map(snap2Doc)
  },

  async trashDocument(id: string): Promise<void> {
    await updateDoc(doc(db, 'documents', id), {
      isTrashed: true,
      trashedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async restoreDocument(id: string): Promise<Document> {
    await updateDoc(doc(db, 'documents', id), {
      isTrashed: false,
      trashedAt: null,
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(doc(db, 'documents', id))
    return snap2Doc(snap)
  },

  async getTrashedDocuments(): Promise<Document[]> {
    const userId = uid()
    if (!userId) return []
    const q = query(docsCol, where('ownerId', '==', userId), where('isTrashed', '==', true))
    const snap = await getDocs(q)
    return snap.docs.map(snap2Doc)
  },

  async moveDocument(id: string, folderId: string | null): Promise<Document> {
    await updateDoc(doc(db, 'documents', id), { folderId, updatedAt: serverTimestamp() })
    const snap = await getDoc(doc(db, 'documents', id))
    return snap2Doc(snap)
  },

  async getDocumentVersions(id: string): Promise<DocumentVersion[]> {
    const snap = await getDocs(
      query(collection(db, 'documents', id, 'versions'), orderBy('createdAt', 'desc'))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentVersion))
  },

  async searchDocuments(q: string): Promise<Document[]> {
    // Client-side search (Firestore has no full-text search natively)
    const userId = uid()
    if (!userId || !q.trim()) return []
    const snap = await getDocs(
      query(docsCol, where('ownerId', '==', userId), where('isTrashed', '==', false))
    )
    const lower = q.toLowerCase()
    return snap.docs
      .map(snap2Doc)
      .filter(d => d.title?.toLowerCase().includes(lower) || d.content?.toLowerCase().includes(lower))
  },

  // Stubs for permissions (not yet implemented in Firestore)
  async getDocumentPermissions(id: string) { return [] },
  async shareDocumentWithUser(id: string, email: string, role: string) {
    throw new Error('Sharing not yet implemented')
  },
}

export default documentService
