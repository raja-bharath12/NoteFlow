import React, { useEffect, useState } from 'react'
import { documentService } from '../services/documentService'
import { Document } from '../types'
import { formatDate } from '../utils/formatters'
import { Trash2, RotateCcw, XCircle, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const TrashView: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTrash = async () => {
    try {
      setIsLoading(true)
      const data = await documentService.getDocuments(null, { isTrashed: true })
      setDocs(data || [])
    } catch {
      setDocs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTrash()
  }, [])

  const handleRestore = async (id: string) => {
    try {
      await documentService.restoreDocument(id)
      toast.success('Note restored!')
      loadTrash()
    } catch {
      toast.error('Failed to restore note')
    }
  }

  const handleDeletePermanent = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this note? This cannot be undone.')) {
      return
    }
    try {
      await documentService.deleteDocument(id, true)
      toast.success('Permanently deleted')
      loadTrash()
    } catch {
      toast.error('Failed to delete note')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
          <Trash2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Trash</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Deleted notes can be restored or permanently removed
          </p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-slate-300 dark:border-slate-800">
          <Trash2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Trash is empty
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Items in the trash will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="glass-card p-4 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {doc.title || 'Untitled Note'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Deleted on {formatDate(doc.trashedAt || doc.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(doc.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button
                  onClick={() => handleDeletePermanent(doc.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrashView
