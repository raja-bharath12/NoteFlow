import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Folder as FolderIcon,
  FileText,
  Search,
  Shield,
  Eye,
  MessageSquare,
  Edit3,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Folder, Document, PermissionRole } from '@/types'
import { sharingService } from '@/services/sharingService'
import { formatRelativeTime, getInitials } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

type RoleFilter = 'ALL' | 'VIEWER' | 'COMMENTER' | 'EDITOR'

export default function SharedWithMe() {
  const navigate = useNavigate()
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const loadSharedData = async () => {
    setIsLoading(true)
    try {
      const data = await sharingService.getSharedWithMe()
      setFolders(data.folders || [])
      setDocuments(data.documents || [])
    } catch (err) {
      console.error('Failed to load shared items:', err)
      toast.error('Could not load shared items')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSharedData()
  }, [])

  // Helper badge for permission role
  const getRoleBadge = (role?: PermissionRole | string) => {
    const r = (role || 'VIEWER').toUpperCase()
    if (r === 'EDITOR') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
          <Edit3 className="h-3 w-3" />
          Editor
        </span>
      )
    }
    if (r === 'COMMENTER') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
          <MessageSquare className="h-3 w-3" />
          Commenter
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <Eye className="h-3 w-3" />
        Viewer
      </span>
    )
  }

  // Filter folders
  const filteredFolders = folders.filter((folder) => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    return true
  })

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (roleFilter !== 'ALL' && doc.permissionRole !== roleFilter) return false
    return true
  })

  const totalSharedCount = folders.length + documents.length

  return (
    <div className="min-h-full p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Shared with Me
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Notes and folders that other team members and collaborators have shared with you
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shared items..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Role Filter Bar */}
      <div className="flex items-center gap-2">
        {(
          [
            { id: 'ALL', label: 'All Permissions' },
            { id: 'EDITOR', label: 'Can Edit' },
            { id: 'COMMENTER', label: 'Can Comment' },
            { id: 'VIEWER', label: 'View Only' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            onClick={() => setRoleFilter(filter.id)}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors',
              roleFilter === filter.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-5 animate-pulse"
            />
          ))}
        </div>
      ) : totalSharedCount === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner">
            <Users className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No shared items yet
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            When teammates invite you to view or edit their folders and documents, they will appear
            right here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Shared Folders Section */}
          {filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Shared Folders ({filteredFolders.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredFolders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    whileHover={{ y: -3 }}
                    onClick={() => navigate(`/folder/${folder.id}`)}
                    className="group relative flex flex-col justify-between rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${folder.color || '#3b82f6'}20`,
                            color: folder.color || '#3b82f6',
                          }}
                        >
                          <FolderIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                            {folder.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {(folder.documentCount ?? 0) + (folder.subfolderCount ?? 0)} items
                          </span>
                        </div>
                      </div>

                      {getRoleBadge('EDITOR')}
                    </div>

                    {/* Shared Owner Info */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        {folder.owner?.avatarUrl ? (
                          <img
                            src={folder.owner.avatarUrl}
                            alt={folder.owner.name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                            {getInitials(folder.owner?.name)}
                          </div>
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                          {folder.owner?.name || 'Teammate'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(folder.updatedAt || folder.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Documents Section */}
          {filteredDocuments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Shared Documents ({filteredDocuments.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc.id}
                    whileHover={{ y: -3 }}
                    onClick={() => navigate(`/document/${doc.id}`)}
                    className="group relative flex flex-col justify-between rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg cursor-pointer transition-all border-l-4 border-l-emerald-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                            {doc.title || 'Untitled Document'}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {doc.wordCount ?? 0} words
                          </span>
                        </div>
                      </div>

                      {getRoleBadge(doc.permissionRole)}
                    </div>

                    {/* Shared Owner Info */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        {doc.owner?.avatarUrl ? (
                          <img
                            src={doc.owner.avatarUrl}
                            alt={doc.owner.name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-[10px] font-bold text-white">
                            {getInitials(doc.owner?.name)}
                          </div>
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                          {doc.owner?.name || 'Teammate'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(doc.updatedAt || doc.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
