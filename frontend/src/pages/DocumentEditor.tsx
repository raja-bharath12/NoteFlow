import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { documentService } from '../services/documentService'
import { Document } from '../types'
import { countWords } from '../utils/formatters'
import {
  ArrowLeft,
  Save,
  Star,
  Share2,
  Download,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'

export const DocumentEditor: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const [searchParams] = useSearchParams()
  const initialFolderId = searchParams.get('folderId')
  const navigate = useNavigate()

  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState('Untitled Note')
  const [isSaving, setIsSaving] = useState(false)
  const [isStarred, setIsStarred] = useState(false)
  const [isLoading, setIsLoading] = useState(documentId !== 'new')
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)

  const isNew = documentId === 'new'

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts, notes, or ideas...',
      }),
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[450px]',
      },
    },
  })

  // Load document if existing
  useEffect(() => {
    let isMounted = true

    if (!isNew && documentId) {
      const loadDoc = async () => {
        try {
          setIsLoading(true)
          const data = await documentService.getDocument(documentId)
          if (isMounted) {
            setDocument(data)
            setTitle(data.title || 'Untitled Note')
            setIsStarred(!!data.isStarred)
            if (editor && data.content) {
              editor.commands.setContent(data.content)
            }
          }
        } catch (error) {
          toast.error('Failed to load note')
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }

      loadDoc()
    }

    return () => {
      isMounted = false
    }
  }, [documentId, isNew, editor])

  const handleSave = useCallback(async () => {
    if (!editor) return

    const htmlContent = editor.getHTML()
    const plainText = editor.getText()
    const wordCount = countWords(plainText)
    const characterCount = plainText.length

    try {
      setIsSaving(true)
      if (isNew) {
        const created = await documentService.createDocument({
          title: title.trim() || 'Untitled Note',
          content: htmlContent,
          folderId: initialFolderId || null,
        })
        toast.success('Note created!')
        navigate(`/document/${created.id}`, { replace: true })
      } else if (documentId) {
        await documentService.updateDocument(documentId, {
          title: title.trim() || 'Untitled Note',
          content: htmlContent,
          wordCount,
          characterCount,
        })
        setLastSavedTime(new Date())
        toast.success('Saved successfully!')
      }
    } catch (error) {
      toast.error('Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }, [editor, isNew, title, initialFolderId, documentId, navigate])

  const toggleStar = async () => {
    if (isNew || !documentId) return
    try {
      if (isStarred) {
        await documentService.unstarDocument(documentId)
        setIsStarred(false)
      } else {
        await documentService.starDocument(documentId)
        setIsStarred(true)
      }
    } catch {
      toast.error('Failed to update star')
    }
  }

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (isNew || !documentId) {
      toast.error('Please save the note before exporting')
      return
    }
    try {
      toast.loading(`Exporting as ${format.toUpperCase()}...`, { id: 'export-toast' })
      const blob = format === 'pdf' ? await documentService.exportPdf(documentId) : await documentService.exportDocx(documentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.trim() || 'Note'}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}`, { id: 'export-toast' })
    } catch {
      toast.error('Export failed', { id: 'export-toast' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {lastSavedTime && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <button
                onClick={toggleStar}
                className={`p-2 rounded-xl transition-colors ${
                  isStarred
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isStarred ? 'Unstar Note' : 'Star Note'}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isNew ? 'Create Note' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Note Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled Note"
        className="w-full text-3xl font-extrabold bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 px-2"
      />

      {/* Editor Toolbar */}
      {editor && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('bold')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('italic')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('underline')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('bulletList')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('orderedList')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('blockquote')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-lg text-xs ${
              editor.isActive('codeBlock')
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 ml-auto" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main TipTap Surface */}
      <div className="glass-card rounded-2xl p-6 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default DocumentEditor
