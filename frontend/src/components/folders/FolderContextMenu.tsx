import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Edit2,
  Copy,
  FolderInput,
  Share2,
  Star,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Folder } from '@/types'
import { cn } from '@/utils/cn'

export interface FolderContextMenuProps {
  folder: Folder
  children?: React.ReactNode
  triggerButton?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onRename?: (folder: Folder) => void
  onDelete?: (folder: Folder) => void
  onDuplicate?: (folder: Folder) => void
  onMove?: (folder: Folder) => void
  onShare?: (folder: Folder) => void
  onStar?: (folder: Folder) => void
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  folder,
  children,
  triggerButton = true,
  isOpen,
  onOpenChange,
  onRename,
  onDelete,
  onDuplicate,
  onMove,
  onShare,
  onStar,
}) => {
  const navigate = useNavigate()

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>
        {children ? (
          children
        ) : triggerButton ? (
          <button
            type="button"
            data-dropdown-trigger="true"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Folder actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        ) : null}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          onClick={(e) => e.stopPropagation()}
          className="z-50 min-w-[190px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-80 zoom-in-95"
        >
          {/* Open Folder */}
          <DropdownMenu.Item
            onClick={() => navigate(`/folder/${folder.id}`)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
          >
            <FolderOpen className="h-4 w-4 text-blue-500" />
            <span>Open folder</span>
          </DropdownMenu.Item>

          {/* Star / Unstar */}
          <DropdownMenu.Item
            onClick={() => onStar?.(folder)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
          >
            <Star
              className={cn(
                'h-4 w-4',
                folder.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
              )}
            />
            <span>{folder.isStarred ? 'Unstar folder' : 'Add to starred'}</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

          {/* Rename */}
          <DropdownMenu.Item
            onClick={() => onRename?.(folder)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
          >
            <Edit2 className="h-4 w-4 text-slate-500" />
            <span>Rename</span>
          </DropdownMenu.Item>

          {/* Duplicate */}
          <DropdownMenu.Item
            onClick={() => onDuplicate?.(folder)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
          >
            <Copy className="h-4 w-4 text-indigo-500" />
            <span>Duplicate</span>
          </DropdownMenu.Item>

          {/* Move */}
          <DropdownMenu.Item
            onClick={() => onMove?.(folder)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
          >
            <FolderInput className="h-4 w-4 text-cyan-500" />
            <span>Move to...</span>
          </DropdownMenu.Item>

          {/* Share */}
          <DropdownMenu.Item
            onClick={() => onShare?.(folder)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
          >
            <Share2 className="h-4 w-4 text-emerald-500" />
            <span>Share folder</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

          {/* Trash */}
          <DropdownMenu.Item
            onClick={() => onDelete?.(folder)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer outline-none transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Move to trash</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default FolderContextMenu
