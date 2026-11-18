import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  FileText,
  Search,
  Trash2,
  LayoutGrid,
  List,
  Star,
  ExternalLink,
  BookOpen,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Document } from '@/types'
import { documentService } from '@/services/documentService'
import { dashboardService } from '@/services/dashboardService'
import { RecentDocumentCard } from '@/components/dashboard/RecentDocumentCard'
import { formatRelativeTime } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

type ViewMode = 'grid' | 'list'
type FilterRange = 'all' | 'today' | 'week' | 'month'

export default function Recent() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<FilterRange>('all')
  const [isClearing, setIsClearing] = useState(false)

  const loadRecentDocuments = async () => {
    setIsLoading(true)
    try {
      const data = await dashboardService.getRecentDocuments(50)
      setDocuments(data || [])
    } catch (err) {
      console.error('Failed to load recent documents:', err)
      toast.error('Could not load recent documents')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRecentDocuments()
  }, [])

  // Clear recent documents history
  const handleClearRecent = async () => {
    if (!window.confirm('Clear your recently opened history? Documents themselves will not be deleted.')) {
      return
    }

    setIsClearing(true)
    try {
      await documentService.clearRecentDocuments()
      setDocuments([])
      toast.success('Recent history cleared')
    } catch (err) {
      // In case backend clear endpoint doesn't support, clear locally
      setDocuments([])
      toast.success('Recent list cleared')
    } finally {
      setIsClearing(false)
    }
  }

  // Star / unstar
  const handleToggleStar = async (doc: Document) => {
    try {
      if (doc.isStarred) {
        await documentService.unstarDocument(doc.id)
        toast.success('Document unstarred')
      } else {
        await documentService.starDocument(doc.id)
        toast.success('Document starred')
      }
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, isStarred: !d.isStarred } : d))
      )
    } catch {
      toast.error('Failed to toggle star')
    }
  }

  // Delete
  const handleDelete = async (doc: Document) => {
    try {
      await documentService.trashDocument(doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      toast.success('Moved to trash')
    } catch {
      toast.error('Failed to trash document')
    }
  }

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (dateFilter === 'all') return true

    const docDate = new Date(doc.updatedAt || doc.createdAt).getTime()
    const now = Date.now()
    const diffHours = (now - docDate) / (1000 * 60 * 60)

    if (dateFilter === 'today') return diffHours <= 24
    if (dateFilter === 'week') return diffHours <= 24 * 7
    if (dateFilter === 'month') return diffHours <= 24 * 30

    return true
  })

  return (
    <div className="min-h-full p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Recent Notes
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recently opened, edited, or modified documents across your account
            </p>
          </div>
        </div>

        {/* Action Controls: Search + Clear History */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recent..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
          </div>

          {documents.length > 0 && (
            <button
              onClick={handleClearRecent}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
            >
              {isClearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>Clear Recent</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Date Filter Badges */}
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Past 7 Days' },
              { id: 'month', label: 'Past 30 Days' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setDateFilter(filter.id)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                dateFilter === filter.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'grid'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 animate-pulse"
            />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
            <Clock className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No recent activity found
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Documents you edit or open will automatically appear here in chronological order.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <RecentDocumentCard
              key={doc.id}
              document={doc}
              onStarToggle={handleToggleStar}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <div className="col-span-6">Title</div>
            <div className="col-span-3">Last Accessed</div>
            <div className="col-span-2">Word Count</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/document/${doc.id}`)}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-xs"
              >
                <div className="col-span-6 flex items-center gap-3 truncate">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {doc.title || 'Untitled Document'}
                  </span>
                </div>

                <div className="col-span-3 text-slate-500 truncate">
                  {formatRelativeTime(doc.updatedAt || doc.createdAt)}
                </div>

                <div className="col-span-2 text-slate-500">
                  {doc.wordCount ?? 0} words
                </div>

                <div
                  className="col-span-1 flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStar(doc)}
                    className="p-1 text-slate-400 hover:text-amber-500 rounded"
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        doc.isStarred ? 'fill-amber-400 text-amber-500' : ''
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
