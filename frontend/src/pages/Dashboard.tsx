import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Folder as FolderIcon,
  FileText,
  Share2,
  Star,
  Clock,
  ArrowRight,
  Upload,
  Sparkles,
  TrendingUp,
  FolderPlus,
  Loader2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { dashboardService } from '@/services/dashboardService'
import { folderService } from '@/services/folderService'
import { documentService } from '@/services/documentService'
import { DashboardStats, Folder as FolderType, Document, ActivityLog } from '@/types'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentDocumentCard } from '@/components/dashboard/RecentDocumentCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { CreateFolderModal } from '@/components/folders/CreateFolderModal'
import { FolderCard } from '@/components/folders/FolderCard'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [starredItems, setStarredItems] = useState<{ documents: Document[]; folders: FolderType[] }>({
    documents: [],
    folders: [],
  })
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingDoc, setIsCreatingDoc] = useState(false)
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)

  // Fetch all dashboard data concurrently
  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes, starredRes, activityRes] = await Promise.allSettled([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentDocuments(6),
        dashboardService.getStarredItems(),
        dashboardService.getRecentActivity(8),
      ])

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value)
      } else {
        // Fallback default statistics if endpoint is empty
        setStats({
          totalDocuments: 0,
          totalFolders: 0,
          sharedDocuments: 0,
          starredItems: 0,
          storageUsed: 0,
          storageLimit: 10737418240, // 10 GB
          recentActivityCount: 0,
        })
      }

      if (recentRes.status === 'fulfilled') {
        setRecentDocs(recentRes.value || [])
      }

      if (starredRes.status === 'fulfilled') {
        setStarredItems(starredRes.value || { documents: [], folders: [] })
      }

      if (activityRes.status === 'fulfilled') {
        setActivities(activityRes.value || [])
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      toast.error('Failed to update some dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Quick action: New Document
  const handleCreateDocument = async () => {
    setIsCreatingDoc(true)
    try {
      const newDoc = await documentService.createDocument({
        title: 'Untitled Note',
        content: '',
      })
      toast.success('New note created')
      navigate(`/document/${newDoc.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create document'
      toast.error(msg)
      setIsCreatingDoc(false)
    }
  }

  // Quick action: Upload File
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      toast.loading(`Importing ${file.name}...`, { id: 'upload-toast' })
      const textContent = await file.text()
      const title = file.name.replace(/\.[^/.]+$/, '')
      const newDoc = await documentService.createDocument({
        title,
        content: textContent,
      })
      toast.success(`"${file.name}" imported as a document`, { id: 'upload-toast' })
      navigate(`/document/${newDoc.id}`)
    } catch (err) {
      toast.error('Failed to import file', { id: 'upload-toast' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Document actions
  const handleToggleStar = async (doc: Document) => {
    try {
      if (doc.isStarred) {
        await documentService.unstarDocument(doc.id)
        toast.success('Removed from starred')
      } else {
        await documentService.starDocument(doc.id)
        toast.success('Added to starred')
      }
      // Re-fetch or update local state
      setRecentDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, isStarred: !d.isStarred } : d))
      )
      setStarredItems((prev) => ({
        ...prev,
        documents: doc.isStarred
          ? prev.documents.filter((d) => d.id !== doc.id)
          : [...prev.documents, { ...doc, isStarred: true }],
      }))
    } catch (err) {
      toast.error('Failed to toggle star')
    }
  }

  const handleDeleteDocument = async (doc: Document) => {
    try {
      await documentService.trashDocument(doc.id)
      toast.success('Document moved to trash')
      setRecentDocs((prev) => prev.filter((d) => d.id !== doc.id))
      setStarredItems((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== doc.id),
      }))
    } catch (err) {
      toast.error('Failed to move document to trash')
    }
  }

  // Greetings logic based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <div className="min-h-full p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hidden file input for Upload quick action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.json,.html"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header & Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{getGreeting()}, {user?.name || 'Explorer'}</span>
            <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back to your second brain. Here is what is happening across your notes today.
          </p>
        </div>

        {/* Quick action buttons row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm transition-all"
          >
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <span>New Folder</span>
          </button>

          <button
            onClick={handleUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm transition-all"
          >
            <Upload className="h-4 w-4 text-cyan-500" />
            <span>Upload File</span>
          </button>

          <button
            onClick={handleCreateDocument}
            disabled={isCreatingDoc}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 transition-all disabled:opacity-60"
          >
            {isCreatingDoc ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>New Document</span>
          </button>
        </div>
      </motion.div>

      {/* 4 Stat Cards in Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            icon={FolderIcon}
            label="Total Folders"
            value={stats?.totalFolders ?? 0}
            color="blue"
            link="/folder/root"
            isLoading={isLoading}
            subtitle="Organized workspaces"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            icon={FileText}
            label="Total Documents"
            value={stats?.totalDocuments ?? 0}
            color="purple"
            link="/recent"
            isLoading={isLoading}
            subtitle="Notes & thoughts created"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            icon={Share2}
            label="Shared Items"
            value={stats?.sharedDocuments ?? 0}
            color="green"
            link="/shared"
            isLoading={isLoading}
            subtitle="Collaborative workspaces"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            icon={Star}
            label="Starred Items"
            value={stats?.starredItems ?? (starredItems.documents.length + starredItems.folders.length)}
            color="yellow"
            link="/starred"
            isLoading={isLoading}
            subtitle="Marked as high priority"
          />
        </motion.div>
      </motion.div>

      {/* Main Content Bento: Left (Recent Docs & Starred) + Right (Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recent Documents & Starred Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Recent Documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Recent Documents
                </h2>
              </div>
              <Link
                to="/recent"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 animate-pulse"
                  />
                ))}
              </div>
            ) : recentDocs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentDocs.map((doc) => (
                  <RecentDocumentCard
                    key={doc.id}
                    document={doc}
                    onStarToggle={handleToggleStar}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No documents yet
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Get started by creating your first document or taking notes from any meeting.
                </p>
                <button
                  onClick={handleCreateDocument}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Note
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Starred Items Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Starred Shortcuts
                </h2>
              </div>
              <Link
                to="/starred"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 animate-pulse"
                  />
                ))}
              </div>
            ) : starredItems.folders.length > 0 || starredItems.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {starredItems.folders.slice(0, 2).map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onStarToggle={async (f) => {
                      await folderService.unstarFolder(f.id)
                      setStarredItems((prev) => ({
                        ...prev,
                        folders: prev.folders.filter((item) => item.id !== f.id),
                      }))
                    }}
                  />
                ))}
                {starredItems.documents.slice(0, 2).map((doc) => (
                  <RecentDocumentCard
                    key={doc.id}
                    document={doc}
                    onStarToggle={handleToggleStar}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-6 text-center">
                <p className="text-xs text-slate-400">
                  Star important documents and folders to pin them here for instant 1-click access.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Activity Feed Glass Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Activity Feed
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Live</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-5 backdrop-blur-md shadow-sm">
            <ActivityFeed activities={activities} isLoading={isLoading} maxItems={8} />
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData()
        }}
      />
    </div>
  )
}
