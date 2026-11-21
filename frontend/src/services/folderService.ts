/**
 * folderService.ts — Firebase Firestore implementation
 * Replaces the old Spring Boot REST API calls with direct Firestore queries.
 */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Folder, CreateFolderRequest, FolderPermission } from '../types'

const uid = () => auth.currentUser?.uid ?? ''
const foldersCol = collection(db, 'folders')

function snap2Folder(d: any): Folder {
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

export const folderService = {
  async getFolders(parentId?: string | null): Promise<Folder[]> {
    const userId = uid()
    if (!userId) return []
    const constraints: any[] = [
      where('ownerId', '==', userId),
      where('isTrashed', '==', false),
      orderBy('createdAt', 'desc'),
    ]
    if (parentId !== undefined) {
      constraints.unshift(where('parentFolderId', '==', parentId ?? null))
    }
    const snap = await getDocs(query(foldersCol, ...constraints))
    return snap.docs.map(snap2Folder)
  },

  async getRootFolders(): Promise<Folder[]> {
    const userId = uid()
    if (!userId) return []
    const q = query(
      foldersCol,
      where('ownerId', '==', userId),
      where('parentFolderId', '==', null),
      where('isTrashed', '==', false),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map(snap2Folder)
  },

  async getFolder(id: string): Promise<Folder> {
    const snap = await getDoc(doc(db, 'folders', id))
    if (!snap.exists()) throw new Error('Folder not found')
    return snap2Folder(snap)
  },

  async createFolder(data: CreateFolderRequest): Promise<Folder> {
    const userId = uid()
    const ref = await addDoc(foldersCol, {
      name: data.name,
      ownerId: userId,
      parentFolderId: data.parentFolderId ?? null,
      color: data.color ?? '#3b82f6',
      icon: data.icon ?? 'folder',
      isStarred: false,
      isTrashed: false,
      trashedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    return snap2Folder(snap)
  },

  async updateFolder(id: string, data: Partial<Folder>): Promise<Folder> {
    await updateDoc(doc(db, 'folders', id), { ...data, updatedAt: serverTimestamp() })
    const snap = await getDoc(doc(db, 'folders', id))
    return snap2Folder(snap)
  },

  async deleteFolder(id: string, permanent = false): Promise<void> {
    if (permanent) {
      await deleteDoc(doc(db, 'folders', id))
    } else {
      await updateDoc(doc(db, 'folders', id), {
        isTrashed: true,
        trashedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  },

  async moveFolder(id: string, newParentId: string | null): Promise<Folder> {
    await updateDoc(doc(db, 'folders', id), {
      parentFolderId: newParentId,
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(doc(db, 'folders', id))
    return snap2Folder(snap)
  },

  async duplicateFolder(id: string): Promise<Folder> {
    const snap = await getDoc(doc(db, 'folders', id))
    if (!snap.exists()) throw new Error('Folder not found')
    const data = snap.data()
    const ref = await addDoc(foldersCol, {
      ...data,
      name: `${data.name} (copy)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const newSnap = await getDoc(ref)
    return snap2Folder(newSnap)
  },

  async starFolder(id: string): Promise<void> {
    await updateDoc(doc(db, 'folders', id), { isStarred: true, updatedAt: serverTimestamp() })
  },

  async unstarFolder(id: string): Promise<void> {
    await updateDoc(doc(db, 'folders', id), { isStarred: false, updatedAt: serverTimestamp() })
  },

  async getStarredFolders(): Promise<Folder[]> {
    const userId = uid()
    if (!userId) return []
    const q = query(
      foldersCol,
      where('ownerId', '==', userId),
      where('isStarred', '==', true),
      where('isTrashed', '==', false),
    )
    const snap = await getDocs(q)
    return snap.docs.map(snap2Folder)
  },

  async trashFolder(id: string): Promise<void> {
    await updateDoc(doc(db, 'folders', id), {
      isTrashed: true,
      trashedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async restoreFolder(id: string): Promise<Folder> {
    await updateDoc(doc(db, 'folders', id), {
      isTrashed: false,
      trashedAt: null,
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(doc(db, 'folders', id))
    return snap2Folder(snap)
  },

  async getTrashedFolders(): Promise<Folder[]> {
    const userId = uid()
    if (!userId) return []
    const q = query(foldersCol, where('ownerId', '==', userId), where('isTrashed', '==', true))
    const snap = await getDocs(q)
    return snap.docs.map(snap2Folder)
  },

  // Permissions not stored in Firestore yet — stubs
  async getFolderPermissions(id: string): Promise<FolderPermission[]> { return [] },
  async shareFolderWithUser(id: string, email: string, role: string): Promise<FolderPermission> {
    throw new Error('Sharing via Firestore not yet implemented')
  },
}

export default folderService
