import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sharingService } from '../services/sharingService'
import { Document, Folder } from '../types'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import { Users, FileText, Folder as FolderIcon, Loader2 } from 'lucide-react'

export const SharedView: React.FC = () => {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadShared = async () => {
      try {
        const data = await sharingService.getSharedWithMe()
        if (isMounted) {
          setDocs(data.documents || [])
          setFolders(data.folders || [])
        }
      } catch {
        // Fallback gracefully
        if (isMounted) {
          setDocs([])
          setFolders([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    loadShared()
    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Shared with Me</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Notes and folders other collaborators have shared with you
          </p>
        </div>
      </div>

      {folders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Shared Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => navigate(`/folder/${f.id}`)}
                className="glass-card p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:border-purple-400 transition-all"
              >
                <FolderIcon className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Shared Notes</h2>
        {docs.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-slate-300 dark:border-slate-800">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No shared items yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              When teammates share notes or collaborate with you, they'll show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/document/${doc.id}`)}
                className="glass-card p-5 rounded-2xl cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors line-clamp-1">
                    {doc.title || 'Untitled Note'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {doc.content ? doc.content.replace(/<[^>]*>/g, '') : 'No content...'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Shared {formatRelativeTime(doc.updatedAt)}</span>
                  <span>{doc.wordCount || 0} words</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SharedView
