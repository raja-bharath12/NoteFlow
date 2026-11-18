import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder as FolderIcon,
  FileText,
  Plus,
  FolderPlus,
  LayoutGrid,
  List,
  ChevronRight,
  ArrowUpDown,
  Star,
  Share2,
  Trash2,
  Clock,
  MoreVertical,
  BookOpen,
  User,
  Shield,
  Loader2,
  Home,
} from 'lucide-react'
import { Folder, Document } from '@/types'
import { folderService } from '@/services/folderService'
import { documentService } from '@/services/documentService'
import { FolderCard } from '@/components/folders/FolderCard'
import { RecentDocumentCard } from '@/components/dashboard/RecentDocumentCard'
import { CreateFolderModal } from '@/components/folders/CreateFolderModal'
import { MoveFolderModal } from '@/components/folders/MoveFolderModal'
import { formatRelativeTime } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'date' | 'size'
type SortOrder = 'asc' | 'desc'

export default function FolderView() {
  const { folderId } = useParams<{ folderId: string }>()
  const navigate = useNavigate()

  const isRoot = !folderId || folderId === 'root'
  const currentFolderId = isRoot ? null : folderId

  // Data State
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [subfolders, setSubfolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Layout & Sorting
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Modals & Action State
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null)
  const [moveModalItem, setMoveModalItem] = useState<{
    item: Folder | Document
    type: 'folder' | 'document'
  } | null>(null)
  const [isCreatingDoc, setIsCreatingDoc] = useState(false)

  // Fetch Folder info, subfolders, and documents
  const loadFolderContent = async () => {
    setIsLoading(true)
    try {
      if (isRoot) {
        setCurrentFolder({
          id: 'root',
          name: 'Home / All Notes',
          ownerId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        setBreadcrumbs([{ id: 'root', name: 'Home' }])

        const [fetchedFolders, fetchedDocs] = await Promise.all([
          folderService.getFolders(null),
          documentService.getDocuments(null),
        ])
        setSubfolders(fetchedFolders || [])
        setDocuments(fetchedDocs || [])
      } else {
        const [folderData, fetchedFolders, fetchedDocs] = await Promise.all([
          folderService.getFolder(folderId!),
          folderService.getFolders(folderId!),
          documentService.getDocuments(folderId!),
        ])

        setCurrentFolder(folderData)
        setSubfolders(fetchedFolders || [])
        setDocuments(fetchedDocs || [])

        // Build breadcrumb trace (can be extended with parents)
        setBreadcrumbs([
          { id: 'root', name: 'Home' },
          { id: folderData.id, name: folderData.name },
        ])
      }
    } catch (err) {
      console.error('Failed to load folder view:', err)
      toast.error('Could not load folder contents')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFolderContent()
  }, [folderId])

  // Sorting
  const sortedSubfolders = [...subfolders].sort((a, b) => {
    if (sortField === 'name') {
      const cmp = a.name.localeCompare(b.name)
      return sortOrder === 'asc' ? cmp : -cmp
    }
    const dateA = new Date(a.updatedAt || a.createdAt).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortField === 'name') {
      const cmp = (a.title || 'Untitled').localeCompare(b.title || 'Untitled')
      return sortOrder === 'asc' ? cmp : -cmp
    }
    if (sortField === 'size') {
      const sizeA = a.wordCount ?? 0
      const sizeB = b.wordCount ?? 0
      return sortOrder === 'asc' ? sizeA - sizeB : sizeB - sizeA
    }
    const dateA = new Date(a.updatedAt || a.createdAt).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  // New Document in current folder
  const handleCreateDocument = async () => {
    setIsCreatingDoc(true)
    try {
      const newDoc = await documentService.createDocument({
        title: 'Untitled Note',
        content: '',
        folderId: currentFolderId,
      })
      toast.success('Document created')
      navigate(`/document/${newDoc.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create document'
      toast.error(msg)
      setIsCreatingDoc(false)
    }
  }

  // Star Folder
  const handleToggleStarFolder = async (f: Folder) => {
    try {
      if (f.isStarred) {
        await folderService.unstarFolder(f.id)
        toast.success('Folder unstarred')
      } else {
        await folderService.starFolder(f.id)
        toast.success('Folder starred')
      }
      setSubfolders((prev) =>
        prev.map((item) => (item.id === f.id ? { ...item, isStarred: !item.isStarred } : item))
      )
      if (currentFolder?.id === f.id) {
        setCurrentFolder((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : null))
      }
    } catch {
      toast.error('Failed to star folder')
    }
  }

  // Star Document
  const handleToggleStarDoc = async (doc: Document) => {
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
      toast.error('Failed to star document')
    }
  }

  // Trash Folder
  const handleDeleteFolder = async (f: Folder) => {
    try {
      await folderService.trashFolder(f.id)
      toast.success(`Folder "${f.name}" moved to trash`)
      setSubfolders((prev) => prev.filter((item) => item.id !== f.id))
    } catch {
      toast.error('Failed to trash folder')
    }
  }

  // Trash Document
  const handleDeleteDocument = async (doc: Document) => {
    try {
      await documentService.trashDocument(doc.id)
      toast.success(`Document "${doc.title}" moved to trash`)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch {
      toast.error('Failed to trash document')
    }
  }

  // Drag and Drop move item into a subfolder
  const handleDropItem = async (
    itemData: { id: string; type: 'document' | 'folder' },
    targetFolderId: string
  ) => {
    try {
      if (itemData.type === 'folder') {
        await folderService.moveFolder(itemData.id, targetFolderId)
        setSubfolders((prev) => prev.filter((f) => f.id !== itemData.id))
        toast.success('Folder moved')
      } else {
        await documentService.moveDocument(itemData.id, targetFolderId)
        setDocuments((prev) => prev.filter((d) => d.id !== itemData.id))
        toast.success('Document moved')
      }
    } catch {
      toast.error('Could not move item')
    }
  }

  const totalItemsCount = subfolders.length + documents.length

  return (
    <div className="min-h-full p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to="/folder/root"
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>

        {breadcrumbs.slice(1).map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {idx === breadcrumbs.length - 2 ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                {crumb.name}
              </span>
            ) : (
              <Link
                to={`/folder/${crumb.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xs"
              >
                {crumb.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Folder Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: currentFolder?.color ? `${currentFolder.color}20` : '#3b82f620',
              color: currentFolder?.color || '#3b82f6',
            }}
          >
            <FolderIcon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {currentFolder?.name || 'Loading...'}
              </h1>

              {!isRoot && currentFolder && (
                <button
                  type="button"
                  onClick={() => handleToggleStarFolder(currentFolder)}
                  className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={currentFolder.isStarred ? 'Unstar folder' : 'Star folder'}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      currentFolder.isStarred ? 'fill-amber-400 text-amber-500' : ''
                    )}
                  />
                </button>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {formatRelativeTime(currentFolder?.updatedAt || currentFolder?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: New Subfolder & New Document */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setFolderToEdit(null)
              setIsCreateFolderModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <span>New Folder</span>
          </button>

          <button
            onClick={handleCreateDocument}
            disabled={isCreatingDoc}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
          >
            {isCreatingDoc ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 stroke-[2.5]" />
            )}
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Toolbar: View Toggle & Sort Options */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="date">Date Modified</option>
              <option value="name">Name</option>
              <option value="size">Word Count</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="ml-1 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {sortOrder}
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : subfolders.length === 0 && documents.length === 0 ? (
        /* Empty State with custom illustration */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
            <FolderIcon className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            This folder is empty
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Drag items into this folder or start by creating a new document or subfolder.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => {
                setFolderToEdit(null)
                setIsCreateFolderModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5 text-blue-500" />
              New Subfolder
            </button>

            <button
              onClick={handleCreateDocument}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Document
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Subfolders Section */}
          {sortedSubfolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Folders ({sortedSubfolders.length})
              </h2>

              <div
                className={cn(
                  'grid gap-4',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1'
                )}
              >
                {sortedSubfolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onStarToggle={handleToggleStarFolder}
                    onRename={(f) => {
                      setFolderToEdit(f)
                      setIsCreateFolderModalOpen(true)
                    }}
                    onDelete={handleDeleteFolder}
                    onMove={(f) => setMoveModalItem({ item: f, type: 'folder' })}
                    onDropItem={handleDropItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          {sortedDocuments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Documents ({sortedDocuments.length})
              </h2>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedDocuments.map((doc) => (
                    <RecentDocumentCard
                      key={doc.id}
                      document={doc}
                      onStarToggle={handleToggleStarDoc}
                      onDelete={handleDeleteDocument}
                      onShare={() => toast.success(`Sharing link for "${doc.title}" copied`)}
                    />
                  ))}
                </div>
              ) : (
                /* List View Table */
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-3">Modified</div>
                    <div className="col-span-2">Word Count</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {sortedDocuments.map((doc) => (
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
                            onClick={() => handleToggleStarDoc(doc)}
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
                            onClick={() => handleDeleteDocument(doc)}
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
          )}
        </div>
      )}

      {/* Create / Edit Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => {
          setIsCreateFolderModalOpen(false)
          setFolderToEdit(null)
        }}
        parentFolderId={currentFolderId}
        folderToEdit={folderToEdit}
        availableFolders={subfolders}
        onSuccess={() => loadFolderContent()}
      />

      {/* Move Folder / Document Modal */}
      {moveModalItem && (
        <MoveFolderModal
          isOpen={!!moveModalItem}
          onClose={() => setMoveModalItem(null)}
          item={moveModalItem.item}
          itemType={moveModalItem.type}
          onSuccess={() => loadFolderContent()}
        />
      )}
    </div>
  )
}
