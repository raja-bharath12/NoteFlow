import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Folder as FolderIcon,
  Plus,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { Folder } from '@/types'
import { folderService } from '@/services/folderService'
import { cn } from '@/utils/cn'
import FolderContextMenu from './FolderContextMenu'

export interface FolderTreeProps {
  parentId?: string | null
  level?: number
  userId?: string | number
  currentFolderId?: string
  onSelectFolder?: (folder: Folder) => void
  onCreateSubfolder?: (parentId: string) => void
  onFolderUpdated?: () => void
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  parentId = null,
  level = 0,
  currentFolderId,
  onSelectFolder,
  onCreateSubfolder,
  onFolderUpdated,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Fetch folders for this parent level
  useEffect(() => {
    let isMounted = true
    const fetchChildren = async () => {
      setIsLoading(true)
      try {
        const data = await folderService.getFolders(parentId)
        if (isMounted) {
          setFolders(data || [])
        }
      } catch (err) {
        console.error('Failed to load child folders for parent:', parentId, err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchChildren()
    return () => {
      isMounted = false
    }
  }, [parentId])

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const handleSelect = (folder: Folder) => {
    if (onSelectFolder) {
      onSelectFolder(folder)
    } else {
      navigate(`/folder/${folder.id}`)
    }
  }

  const handleDelete = async (folder: Folder) => {
    try {
      await folderService.trashFolder(folder.id)
      setFolders((prev) => prev.filter((f) => f.id !== folder.id))
      onFolderUpdated?.()
    } catch (err) {
      console.error('Failed to trash folder', err)
    }
  }

  if (isLoading && folders.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-400" style={{ paddingLeft: `${level * 16 + 12}px` }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 select-none">
      {folders.map((folder) => {
        const isExpanded = !!expandedFolders[folder.id]
        const isActive =
          currentFolderId === folder.id || location.pathname === `/folder/${folder.id}`
        const folderColor = folder.color || '#3b82f6'

        return (
          <div key={folder.id}>
            {/* Tree Item Row */}
            <div
              onClick={() => handleSelect(folder)}
              className={cn(
                'group relative flex items-center justify-between rounded-xl py-1.5 pr-2 transition-all cursor-pointer text-xs font-medium',
                isActive
                  ? 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              )}
              style={{ paddingLeft: `${level * 14 + 8}px` }}
            >
              {/* Left: Expand Caret + Icon + Name */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => toggleExpand(folder.id, e)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-transform"
                >
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isExpanded ? 'rotate-90' : ''
                    )}
                  />
                </button>

                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                  style={{ color: folderColor }}
                >
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <FolderIcon className="h-4 w-4" />
                  )}
                </div>

                <span className="truncate">{folder.name}</span>
              </div>

              {/* Right: Quick Subfolder Add Button + Context Menu */}
              <div
                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {onCreateSubfolder && (
                  <button
                    type="button"
                    onClick={() => onCreateSubfolder(folder.id)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Add subfolder"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}

                <FolderContextMenu
                  folder={folder}
                  onDelete={handleDelete}
                  onShare={() => navigate(`/folder/${folder.id}`)}
                />
              </div>
            </div>

            {/* Recursive Subfolders (animated collapsible) */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <FolderTree
                    parentId={folder.id}
                    level={level + 1}
                    currentFolderId={currentFolderId}
                    onSelectFolder={onSelectFolder}
                    onCreateSubfolder={onCreateSubfolder}
                    onFolderUpdated={onFolderUpdated}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default FolderTree
