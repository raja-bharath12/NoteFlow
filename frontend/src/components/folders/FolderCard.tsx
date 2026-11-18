import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Folder as FolderIcon,
  Star,
  FileText,
  Clock,
  Briefcase,
  User,
  Layout,
  Archive,
  Book,
} from 'lucide-react'
import { Folder } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import FolderContextMenu from './FolderContextMenu'

export interface FolderCardProps {
  folder: Folder
  onStarToggle?: (folder: Folder) => void
  onRename?: (folder: Folder) => void
  onDelete?: (folder: Folder) => void
  onDuplicate?: (folder: Folder) => void
  onMove?: (folder: Folder) => void
  onShare?: (folder: Folder) => void
  onDropItem?: (item: { id: string; type: 'document' | 'folder' }, targetFolderId: string) => void
}

function getFolderCustomIcon(iconName?: string) {
  switch (iconName) {
    case 'work':
    case 'briefcase':
      return Briefcase
    case 'personal':
    case 'user':
      return User
    case 'project':
    case 'layout':
      return Layout
    case 'archive':
      return Archive
    case 'book':
      return Book
    default:
      return FolderIcon
  }
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onStarToggle,
  onRename,
  onDelete,
  onDuplicate,
  onMove,
  onShare,
  onDropItem,
}) => {
  const navigate = useNavigate()
  const [isDragOver, setIsDragOver] = React.useState(false)
  const IconComponent = getFolderCustomIcon(folder.icon)

  const folderColor = folder.color || '#3b82f6'
  const totalItems = (folder.documentCount ?? 0) + (folder.subfolderCount ?? 0)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') || (e.target as HTMLElement).closest('button')) {
      return
    }
    navigate(`/folder/${folder.id}`)
  }

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: folder.id, type: 'folder' }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.id !== folder.id) {
        onDropItem?.(data, folder.id)
      }
    } catch {
      // Ignore invalid drag payload
    }
  }

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onClick={handleCardClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl p-4.5 cursor-pointer select-none transition-all duration-200',
        'border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:shadow-lg',
        isDragOver
          ? 'border-blue-500 ring-2 ring-blue-500/30 scale-[1.02]'
          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      )}
    >
      {/* Top Header: Colored Folder Icon + Action icons */}
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundColor: `${folderColor}18`,
            color: folderColor,
          }}
        >
          <IconComponent className="h-6 w-6" style={{ color: folderColor }} />
        </div>

        <div className="flex items-center gap-0.5">
          {/* Star Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStarToggle?.(folder)
            }}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              folder.isStarred
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            title={folder.isStarred ? 'Remove from starred' : 'Add to starred'}
          >
            <Star
              className={cn('h-4 w-4', folder.isStarred ? 'fill-amber-400 text-amber-500' : '')}
            />
          </button>

          {/* Context Menu Dropdown */}
          <FolderContextMenu
            folder={folder}
            onRename={onRename}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMove={onMove}
            onShare={onShare}
            onStar={onStarToggle}
          />
        </div>
      </div>

      {/* Main Content: Folder Name & Items Badge */}
      <div className="mt-3.5">
        <h4
          className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          title={folder.name}
        >
          {folder.name}
        </h4>

        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <FileText className="h-3 w-3" />
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Footer Info: Last Modified Time */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1 truncate">
          <Clock className="h-3 w-3 shrink-0" />
          {formatRelativeTime(folder.updatedAt || folder.createdAt)}
        </span>
      </div>
    </motion.div>
  )
}

export default FolderCard
