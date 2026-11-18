import React, { useState } from 'react'
import { Comment, User } from '@/types'
import { formatRelativeTime, getInitials } from '@/utils/formatters'
import {
  MessageSquare,
  CornerDownRight,
  CheckCircle,
  RotateCcw,
  Trash2,
  Send,
  MoreVertical,
  Check,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export interface CommentThreadProps {
  comment: Comment
  currentUser: User | null
  onReply: (commentId: string, content: string) => Promise<void>
  onResolve: (commentId: string) => Promise<void>
  onUnresolve: (commentId: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  currentUser,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
}) => {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthor = currentUser?.id === comment.userId
  const isResolved = !!comment.isResolved

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    try {
      setIsSubmitting(true)
      await onReply(comment.id, replyContent.trim())
      setReplyContent('')
      setIsReplying(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Highlight @mentions in comment text
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(@\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded text-[11px]"
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isResolved
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-sm'
      }`}
    >
      {/* Top Comment Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          {comment.user?.avatarUrl ? (
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold text-[10px] flex items-center justify-center shrink-0">
              {getInitials(comment.user?.name || 'User')}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {comment.user?.name || 'Collaborator'}
              </span>
              {isResolved && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-2.5 h-2.5" />
                  Resolved
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {formatRelativeTime(comment.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              className="z-50 min-w-[130px] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-1 text-xs animate-in fade-in-0 zoom-in-95"
            >
              {isResolved ? (
                <DropdownMenu.Item
                  onClick={() => onUnresolve(comment.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reopen Thread</span>
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item
                  onClick={() => onResolve(comment.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer outline-none"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </DropdownMenu.Item>
              )}

              {isAuthor && (
                <DropdownMenu.Item
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Thread</span>
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Main Comment Text */}
      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3 whitespace-pre-wrap pl-9">
        {renderFormattedText(comment.content)}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2.5 ml-7 pl-3 border-l-2 border-slate-100 dark:border-slate-750 mb-3">
          {comment.replies.map((reply) => {
            const isReplyAuthor = currentUser?.id === reply.userId
            return (
              <div key={reply.id} className="group relative text-xs">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    {reply.user?.avatarUrl ? (
                      <img
                        src={reply.user.avatarUrl}
                        alt={reply.user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[9px] flex items-center justify-center shrink-0">
                        {getInitials(reply.user?.name || 'U')}
                      </div>
                    )}
                    <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                      {reply.user?.name || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>

                  {isReplyAuthor && (
                    <button
                      type="button"
                      onClick={() => onDelete(reply.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-opacity"
                      title="Delete reply"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="pl-7 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {renderFormattedText(reply.content)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reply toggle & Form */}
      <div className="pl-9 pt-1">
        {!isReplying ? (
          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>
        ) : (
          <form onSubmit={handleSubmitReply} className="mt-1 space-y-2">
            <textarea
              autoFocus
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply... (use @ to mention)"
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmitting}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-md shadow-sm transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'Sending...' : 'Reply'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CommentThread
