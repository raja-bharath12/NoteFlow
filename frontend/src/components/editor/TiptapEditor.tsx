import React, { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import FontFamily from '@tiptap/extension-font-family'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

declare global {
  interface Window {
    __noteflow_editor__?: any
  }
}

export interface TiptapEditorProps {
  content: string
  onChange: (content: string, wordCount: number, charCount: number) => void
  documentId: string | number
  readOnly?: boolean
  placeholder?: string
  className?: string
}

function parseInitialContent(content: string) {
  if (!content || !content.trim()) return '<p></p>'
  const trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return content
    }
  }
  return content
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  documentId,
  readOnly = false,
  placeholder = 'Start writing your note...',
  className = '',
}) => {
  const isUpdatingFromPropRef = useRef(false)
  const lastEmittedContentRef = useRef<string>('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-800 transition-colors',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 shadow-md border border-slate-200 dark:border-slate-700',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      FontFamily,
      Subscript,
      Superscript,
    ],
    content: parseInitialContent(content),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (isUpdatingFromPropRef.current) return

      const jsonStr = JSON.stringify(editor.getJSON())
      const plainText = editor.getText()
      const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0
      const charCount = editor.storage.characterCount.characters()

      lastEmittedContentRef.current = jsonStr
      onChange(jsonStr, wordCount, charCount)
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none min-h-[500px] text-slate-800 dark:text-slate-100',
      },
    },
  })

  // Synchronize global reference for toolbars and shortcuts
  useEffect(() => {
    if (editor) {
      window.__noteflow_editor__ = editor
    }
    return () => {
      if (window.__noteflow_editor__ === editor) {
        delete window.__noteflow_editor__
      }
    }
  }, [editor])

  // Update editable status
  useEffect(() => {
    if (editor && editor.isEditable === readOnly) {
      editor.setEditable(!readOnly)
    }
  }, [editor, readOnly])

  // Update content externally if content prop changes and does not match internal state
  useEffect(() => {
    if (!editor) return

    // If documentId changed or content is different from last emitted
    const currentJson = JSON.stringify(editor.getJSON())
    const currentHtml = editor.getHTML()

    if (content !== lastEmittedContentRef.current && content !== currentJson && content !== currentHtml) {
      isUpdatingFromPropRef.current = true
      try {
        const parsed = parseInitialContent(content)
        editor.commands.setContent(parsed, false)
        lastEmittedContentRef.current = typeof parsed === 'object' ? JSON.stringify(parsed) : content
      } finally {
        isUpdatingFromPropRef.current = false
      }
    }
  }, [content, documentId, editor])

  return (
    <div className={`relative w-full ${className}`}>
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
