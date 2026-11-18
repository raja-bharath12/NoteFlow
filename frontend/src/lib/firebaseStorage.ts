/**
 * firebaseStorage.ts
 * Firebase Cloud Storage service for NoteFlow.
 * Handles avatar uploads and document file attachments.
 */
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTaskSnapshot,
} from 'firebase/storage'
import { storage } from './firebase'

// ─── Upload with progress callback ───────────────────────────────────────────
export function uploadFile(
  path: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(Math.round(pct))
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

// ─── Avatar upload ─────────────────────────────────────────────────────────
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `avatars/${userId}/avatar.${ext}`
  return uploadFile(path, file, onProgress)
}

// ─── Document attachment upload ───────────────────────────────────────────
export async function uploadAttachment(
  documentId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now()
  const path = `attachments/${documentId}/${timestamp}_${file.name}`
  const url = await uploadFile(path, file, onProgress)
  return { url, path }
}

// ─── Delete file ──────────────────────────────────────────────────────────
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path)
  return deleteObject(storageRef)
}

// ─── Get download URL ─────────────────────────────────────────────────────
export async function getFileUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path))
}

// ─── List attachments for a document ─────────────────────────────────────
export async function listDocumentAttachments(documentId: string) {
  const listRef = ref(storage, `attachments/${documentId}`)
  const result = await listAll(listRef)
  return Promise.all(
    result.items.map(async item => ({
      name: item.name,
      path: item.fullPath,
      url: await getDownloadURL(item),
    }))
  )
}
