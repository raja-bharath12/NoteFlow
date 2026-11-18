import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Folder as FolderIcon,
  FileText,
  Search,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'
import { Folder, Document } from '@/types'
import { folderService } from '@/services/folderService'
import { documentService } from '@/services/documentService'
import { dashboardService } from '@/services/dashboardService'
import { FolderCard } from '@/components/folders/FolderCard'
import { RecentDocumentCard } from '@/components/dashboard/RecentDocumentCard'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

type TabType = 'all' | 'folders' | 'documents'

export default function Starred() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadStarredItems = async () => {
    setIsLoading(true)
    try {
      const data = await dashboardService.getStarredItems()
      setFolders((data.folders || []).map((f) => ({ ...f, isStarred: true })))
      setDocuments((data.documents || []).map((d) => ({ ...d, isStarred: true })))
    } catch (err) {
      console.error('Failed to load starred items:', err)
      toast.error('Could not load starred items')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStarredItems()
  }, [])

  // Unstar folder
  const handleUnstarFolder = async (folder: Folder) => {
    try {
      await folderService.unstarFolder(folder.id)
      setFolders((prev) => prev.filter((f) => f.id !== folder.id))
      toast.success(`Removed "${folder.name}" from starred`)
    } catch {
      toast.error('Failed to unstar folder')
    }
  }

  // Unstar document
  const handleUnstarDoc = async (doc: Document) => {
    try {
      await documentService.unstarDocument(doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      toast.success(`Removed "${doc.title}" from starred`)
    } catch {
      toast.error('Failed to unstar document')
    }
  }

  // Filter items by search query
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDocuments = documents.filter((d) =>
    (d.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStarredCount = folders.length + documents.length

  return (
    <div className="min-h-full p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-sm">
            <Star className="h-6 w-6 fill-amber-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Starred Notes & Folders
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalStarredCount} priority items pinned for fast access
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search starred items..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors',
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          All ({totalStarredCount})
        </button>

        <button
          onClick={() => setActiveTab('folders')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors',
            activeTab === 'folders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
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
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          Documents ({documents.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 animate-pulse"
            />
          ))}
        </div>
      ) : totalStarredCount === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mb-4 shadow-inner">
            <Star className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No starred items yet
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Click the star icon on any document or folder to bookmark it here for immediate access.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders Section */}
          {(activeTab === 'all' || activeTab === 'folders') && filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Starred Folders ({filteredFolders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onStarToggle={handleUnstarFolder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {(activeTab === 'all' || activeTab === 'documents') && filteredDocuments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Starred Documents ({filteredDocuments.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <RecentDocumentCard
                    key={doc.id}
                    document={doc}
                    onStarToggle={handleUnstarDoc}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
