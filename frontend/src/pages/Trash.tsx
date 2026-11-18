import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Folder as FolderIcon,
  FileText,
  Clock,
  CheckSquare,
  Square,
  Loader2,
  X,
  Search,
  Check,
} from 'lucide-react'
import { Folder, Document } from '@/types'
import { folderService } from '@/services/folderService'
import { documentService } from '@/services/documentService'
import { formatRelativeTime } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

type TrashTab = 'all' | 'folders' | 'documents'

export default function Trash() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TrashTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Multi-selection state
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'emptyAll' | 'deletePermanent' | 'deleteSelected'
    targetItem?: { id: string; name: string; type: 'folder' | 'document' }
  }>({
    isOpen: false,
    type: 'emptyAll',
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const loadTrash = async () => {
    setIsLoading(true)
    try {
      const [trashedFolders, trashedDocs] = await Promise.allSettled([
        folderService.getTrashedFolders(),
        documentService.getTrashedDocuments(),
      ])

      if (trashedFolders.status === 'fulfilled') {
        setFolders(trashedFolders.value || [])
      } else {
        setFolders([])
      }

      if (trashedDocs.status === 'fulfilled') {
        setDocuments(trashedDocs.value || [])
      } else {
        setDocuments([])
      }
    } catch (err) {
      console.error('Failed to load trash items', err)
      toast.error('Could not load trash')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTrash()
  }, [])

  // Restore single folder
  const handleRestoreFolder = async (folder: Folder) => {
    try {
      await folderService.restoreFolder(folder.id)
      setFolders((prev) => prev.filter((f) => f.id !== folder.id))
      setSelectedFolderIds((prev) => {
        const next = new Set(prev)
        next.delete(folder.id)
        return next
      })
      toast.success(`Restored "${folder.name}"`)
    } catch {
      toast.error('Failed to restore folder')
    }
  }

  // Restore single document
  const handleRestoreDoc = async (doc: Document) => {
    try {
      await documentService.restoreDocument(doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      setSelectedDocIds((prev) => {
        const next = new Set(prev)
        next.delete(doc.id)
        return next
      })
      toast.success(`Restored "${doc.title}"`)
    } catch {
      toast.error('Failed to restore document')
    }
  }

  // Permanent Delete Single Item
  const handlePermanentDelete = async (id: string, type: 'folder' | 'document') => {
    setIsProcessing(true)
    try {
      if (type === 'folder') {
        await folderService.deleteFolder(id, true)
        setFolders((prev) => prev.filter((f) => f.id !== id))
        setSelectedFolderIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      } else {
        await documentService.deleteDocument(id, true)
        setDocuments((prev) => prev.filter((d) => d.id !== id))
        setSelectedDocIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
      toast.success('Permanently deleted')
      setConfirmModal({ isOpen: false, type: 'deletePermanent' })
    } catch {
      toast.error('Failed to permanently delete')
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk Restore Selected
  const handleBulkRestore = async () => {
    setIsProcessing(true)
    try {
      const folderPromises = Array.from(selectedFolderIds).map((id) =>
        folderService.restoreFolder(id)
      )
      const docPromises = Array.from(selectedDocIds).map((id) =>
        documentService.restoreDocument(id)
      )

      await Promise.allSettled([...folderPromises, ...docPromises])

      setFolders((prev) => prev.filter((f) => !selectedFolderIds.has(f.id)))
      setDocuments((prev) => prev.filter((d) => !selectedDocIds.has(d.id)))
      setSelectedFolderIds(new Set())
      setSelectedDocIds(new Set())
      toast.success('Selected items restored')
    } catch {
      toast.error('Failed to restore all items')
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk Permanent Delete Selected
  const handleBulkPermanentDelete = async () => {
    setIsProcessing(true)
    try {
      const folderPromises = Array.from(selectedFolderIds).map((id) =>
        folderService.deleteFolder(id, true)
      )
      const docPromises = Array.from(selectedDocIds).map((id) =>
        documentService.deleteDocument(id, true)
      )

      await Promise.allSettled([...folderPromises, ...docPromises])

      setFolders((prev) => prev.filter((f) => !selectedFolderIds.has(f.id)))
      setDocuments((prev) => prev.filter((d) => !selectedDocIds.has(d.id)))
      setSelectedFolderIds(new Set())
      setSelectedDocIds(new Set())
      toast.success('Selected items permanently deleted')
      setConfirmModal({ isOpen: false, type: 'deletePermanent' })
    } catch {
      toast.error('Failed to delete selected items')
    } finally {
      setIsProcessing(false)
    }
  }

  // Empty Entire Trash
  const handleEmptyTrash = async () => {
    setIsProcessing(true)
    try {
      await documentService.emptyTrash()
      setFolders([])
      setDocuments([])
      setSelectedFolderIds(new Set())
      setSelectedDocIds(new Set())
      toast.success('Trash has been emptied')
      setConfirmModal({ isOpen: false, type: 'emptyAll' })
    } catch {
      // In case endpoint doesn't exist, bulk delete remaining
      const folderPromises = folders.map((f) => folderService.deleteFolder(f.id, true))
      const docPromises = documents.map((d) => documentService.deleteDocument(d.id, true))
      await Promise.allSettled([...folderPromises, ...docPromises])
      setFolders([])
      setDocuments([])
      toast.success('Trash emptied')
      setConfirmModal({ isOpen: false, type: 'emptyAll' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Multi-select toggle helpers
  const toggleSelectFolder = (id: string) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedFolderIds(new Set(folders.map((f) => f.id)))
    setSelectedDocIds(new Set(documents.map((d) => d.id)))
  }

  const deselectAll = () => {
    setSelectedFolderIds(new Set())
    setSelectedDocIds(new Set())
  }

  const totalTrashedCount = folders.length + documents.length
  const totalSelectedCount = selectedFolderIds.size + selectedDocIds.size
  const isAllSelected = totalTrashedCount > 0 && totalSelectedCount === totalTrashedCount

  // Search filter
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDocuments = documents.filter((d) =>
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-full p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-sm">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Trash & Bin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Items in the trash can be restored or permanently removed
            </p>
          </div>
        </div>

        {/* Empty Trash Button */}
        {totalTrashedCount > 0 && (
          <button
            onClick={() => setConfirmModal({ isOpen: true, type: 'emptyAll' })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            )}
          >
            All Items ({totalTrashedCount})
          </button>

          <button
            onClick={() => setActiveTab('folders')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeTab === 'folders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            )}
          >
            Folders ({folders.length})
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeTab === 'documents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            )}
          >
            Documents ({documents.length})
          </button>
        </div>

        {totalTrashedCount > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={isAllSelected ? deselectAll : selectAll}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              {isAllSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              <span>{isAllSelected ? 'Deselect all' : 'Select all'}</span>
            </button>

            <div className="relative w-48">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trash..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Selection Bar */}
      <AnimatePresence>
        {totalSelectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-white shadow-2xl backdrop-blur-md"
          >
            <span className="text-xs font-medium">
              <strong className="text-blue-400">{totalSelectedCount}</strong> item
              {totalSelectedCount === 1 ? '' : 's'} selected
            </span>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkRestore}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore</span>
              </button>

              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'deleteSelected' })}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Permanently</span>
              </button>

              <button
                onClick={deselectAll}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
                title="Cancel selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 animate-pulse"
            />
          ))}
        </div>
      ) : totalTrashedCount === 0 ? (
        /* Empty Trash State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
            <Check className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Trash is empty
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Everything is clean! When you delete folders or documents, they will safely wait here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders in Trash */}
          {(activeTab === 'all' || activeTab === 'folders') && filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Trashed Folders ({filteredFolders.length})
              </h2>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredFolders.map((folder) => {
                  const isSelected = selectedFolderIds.has(folder.id)
                  return (
                    <div
                      key={folder.id}
                      className={cn(
                        'flex items-center justify-between p-4 transition-colors',
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectFolder(folder.id)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                          <FolderIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {folder.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Trashed {formatRelativeTime(folder.trashedAt || folder.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreFolder(folder)}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              type: 'deletePermanent',
                              targetItem: { id: folder.id, name: folder.name, type: 'folder' },
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents in Trash */}
          {(activeTab === 'all' || activeTab === 'documents') && filteredDocuments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Trashed Documents ({filteredDocuments.length})
              </h2>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDocuments.map((doc) => {
                  const isSelected = selectedDocIds.has(doc.id)
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        'flex items-center justify-between p-4 transition-colors',
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectDoc(doc.id)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {doc.title || 'Untitled Document'}
                          </h4>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Trashed {formatRelativeTime(doc.trashedAt || doc.updatedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestoreDoc(doc)}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              type: 'deletePermanent',
                              targetItem: { id: doc.id, name: doc.title, type: 'document' },
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ isOpen: false, type: 'emptyAll' })}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mx-auto mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <h3 className="text-center text-base font-bold text-slate-800 dark:text-slate-100">
                {confirmModal.type === 'emptyAll'
                  ? 'Empty Entire Trash?'
                  : confirmModal.type === 'deleteSelected'
                  ? 'Delete Selected Items?'
                  : `Delete "${confirmModal.targetItem?.name}"?`}
              </h3>

              <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                This action is irreversible. All contents will be permanently erased from your
                database.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, type: 'emptyAll' })}
                  disabled={isProcessing}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.type === 'emptyAll') {
                      handleEmptyTrash()
                    } else if (confirmModal.type === 'deleteSelected') {
                      handleBulkPermanentDelete()
                    } else if (confirmModal.targetItem) {
                      handlePermanentDelete(
                        confirmModal.targetItem.id,
                        confirmModal.targetItem.type
                      )
                    }
                  }}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Permanent Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
