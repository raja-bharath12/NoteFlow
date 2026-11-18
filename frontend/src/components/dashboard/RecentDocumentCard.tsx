import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Star,
  MoreVertical,
  Share2,
  Trash2,
  ExternalLink,
  Folder as FolderIcon,
  Clock,
  BookOpen,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Document } from '@/types'
import { formatRelativeTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export interface RecentDocumentCardProps {
  document: Document
  onStarToggle?: (document: Document) => void
  onDelete?: (document: Document) => void
  onShare?: (document: Document) => void
}

export const RecentDocumentCard: React.FC<RecentDocumentCardProps> = ({
  document,
  onStarToggle,
  onDelete,
  onShare,
}) => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    // If click originated from the dropdown trigger or inside dropdown, don't navigate
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') || isMenuOpen) {
      return
    }
    navigate(`/document/${document.id}`)
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStarToggle?.(document)
  }

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl p-4 cursor-pointer transition-all duration-200 select-none',
        'border border-slate-200/80 dark:border-slate-800/80',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
        'hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700',
        'border-l-4 border-l-transparent hover:border-l-blue-500'
      )}
    >
      {/* Top Header: Icon + Title + Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4
              className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              title={document.title || 'Untitled Document'}
            >
              {document.title || 'Untitled Document'}
            </h4>
            {document.folder?.name ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                <FolderIcon className="h-3 w-3 shrink-0 text-slate-400" />
                {document.folder.name}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Root folder</span>
            )}
          </div>
        </div>

        {/* Action icons: Star & Dropdown Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleStarClick}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              document.isStarred
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            title={document.isStarred ? 'Remove from starred' : 'Add to starred'}
          >
            <Star
              className={cn('h-4 w-4', document.isStarred ? 'fill-amber-400 text-amber-500' : '')}
            />
          </button>

          <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                data-dropdown-trigger="true"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                title="Document actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-[170px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-80 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu.Item
                  onClick={() => navigate(`/document/${document.id}`)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                  <span>Open in editor</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => onStarToggle?.(document)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
                >
                  <Star className={cn('h-3.5 w-3.5', document.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-400')} />
                  <span>{document.isStarred ? 'Unstar' : 'Star item'}</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => onShare?.(document)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Share</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                <DropdownMenu.Item
                  onClick={() => onDelete?.(document)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer outline-none transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Move to trash</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Footer Info: Relative time + Word count */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatRelativeTime(document.updatedAt || document.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          {document.wordCount ?? 0} words
        </span>
      </div>
    </motion.div>
  )
}

export default RecentDocumentCard
