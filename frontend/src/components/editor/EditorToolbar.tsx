import React, { useState, useEffect, useRef } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Popover from '@radix-ui/react-popover'
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Minus,
  CodeSquare,
  ChevronDown,
  Palette,
  Highlighter,
  Plus,
  Trash2,
  Search,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  shortcut?: string
  children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  active = false,
  disabled = false,
  title,
  shortcut,
  children,
}) => (
  <Tooltip.Provider delayDuration={300}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all text-xs ${
            active
              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold shadow-inner'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={5}
          className="z-50 bg-slate-900 text-white text-[11px] px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 animate-in fade-in-0 zoom-in-95"
        >
          <span>{title}</span>
          {shortcut && (
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded border border-slate-700 font-mono">
              {shortcut}
            </span>
          )}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
)

const Divider = () => (
  <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-750 mx-1 self-center shrink-0" />
)

const TEXT_COLORS = [
  '#000000',
  '#475569',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#0284c7',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ffffff',
  '#94a3b8',
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
]

const HIGHLIGHT_COLORS = [
  '#fef08a', // Yellow
  '#bbf7d0', // Green
  '#bae6fd', // Blue
  '#fbcfe8', // Pink
  '#fed7aa', // Orange
  '#ddd6fe', // Purple
  '#e2e8f0', // Gray
]

const FONT_FAMILIES = [
  { label: 'Default (Inter)', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
]

export interface EditorToolbarProps {
  editor?: any
  onOpenFindReplace?: () => void
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor: propEditor,
  onOpenFindReplace,
}) => {
  const [, setTick] = useState(0)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageOpen, setImageOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getEditor = () => propEditor || (window as any).__noteflow_editor__ || null

  // Force re-render toolbar when selection or transaction updates
  useEffect(() => {
    const editor = getEditor()
    if (!editor) return

    const updateHandler = () => setTick((t) => t + 1)
    editor.on('transaction', updateHandler)
    editor.on('selectionUpdate', updateHandler)

    return () => {
      editor.off('transaction', updateHandler)
      editor.off('selectionUpdate', updateHandler)
    }
  }, [propEditor])

  const editor = getEditor()
  if (!editor) {
    return (
      <div className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 flex items-center text-xs text-slate-400">
        Loading editor toolbar...
      </div>
    )
  }

  // Heading state
  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1'
    if (editor.isActive('heading', { level: 2 })) return 'H2'
    if (editor.isActive('heading', { level: 3 })) return 'H3'
    return 'Normal'
  }

  const setHeading = (val: string) => {
    if (val === 'Normal') {
      editor.chain().focus().setParagraph().run()
    } else if (val === 'H1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    } else if (val === 'H2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    } else if (val === 'H3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    }
  }

  // Link actions
  const handleApplyLink = () => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
    } else {
      let finalUrl = linkUrl.trim()
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run()
    }
    setLinkOpen(false)
    setLinkUrl('')
  }

  const handleOpenLinkDialog = () => {
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setLinkOpen(true)
  }

  // Image actions
  const handleInsertImageUrl = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run()
      setImageUrl('')
      setImageOpen(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        editor.chain().focus().setImage({ src: reader.result }).run()
        setImageOpen(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Table actions
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className="sticky top-0 z-30 flex items-center flex-wrap gap-0.5 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
      {/* 1. History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
        shortcut="Ctrl+Z"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
        shortcut="Ctrl+Y"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* 2. Heading Select */}
      <select
        value={getCurrentHeading()}
        onChange={(e) => setHeading(e.target.value)}
        className="h-8 px-2 py-1 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        title="Text Style"
      >
        <option value="Normal">Normal Text</option>
        <option value="H1">Heading 1</option>
        <option value="H2">Heading 2</option>
        <option value="H3">Heading 3</option>
      </select>

      {/* 3. Font Family */}
      <select
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().setFontFamily(e.target.value).run()
          } else {
            editor.chain().focus().unsetFontFamily().run()
          }
        }}
        className="hidden md:block h-8 px-2 py-1 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[120px]"
        title="Font Family"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <Divider />

      {/* 4. Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
        shortcut="Ctrl+B"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
        shortcut="Ctrl+I"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
        shortcut="Ctrl+U"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        active={editor.isActive('subscript')}
        title="Subscript"
      >
        <SubscriptIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        active={editor.isActive('superscript')}
        title="Superscript"
      >
        <SuperscriptIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* 5. Colors: Text & Highlight */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Text Color"
          >
            <div className="flex flex-col items-center">
              <Palette className="w-3.5 h-3.5" />
              <div
                className="w-3.5 h-1 mt-0.5 rounded-full"
                style={{
                  backgroundColor: editor.getAttributes('textStyle').color || 'currentColor',
                }}
              />
            </div>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={5}
            className="z-50 w-52 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in-0"
          >
            <p className="text-[11px] font-semibold text-slate-500 mb-2 px-1">Text Color</p>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(c).run()}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="w-full py-1 text-center text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              Reset to default
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive('highlight')
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Highlight Color"
          >
            <Highlighter className="w-4 h-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={5}
            className="z-50 w-48 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in-0"
          >
            <p className="text-[11px] font-semibold text-slate-500 mb-2 px-1">Highlight Color</p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                  className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="w-full py-1 text-center text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              Remove highlight
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Divider />

      {/* 6. Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* 7. Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')}
        title="Task List"
      >
        <CheckSquare className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* 8. Insert Objects */}
      {/* Link Popover */}
      <Popover.Root open={linkOpen} onOpenChange={setLinkOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            onClick={handleOpenLinkDialog}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive('link')
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Insert or Edit Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={5}
            className="z-50 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in-0"
          >
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Insert Link
            </p>
            <input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyLink()}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setLinkOpen(false)
                  }}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <Unlink className="w-3 h-3" />
                  Remove
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setLinkOpen(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Apply
                </button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Image Popover */}
      <Popover.Root open={imageOpen} onOpenChange={setImageOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={5}
            className="z-50 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in-0"
          >
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Insert Image
            </p>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Paste image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsertImageUrl()}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInsertImageUrl}
                  disabled={!imageUrl.trim()}
                  className="flex-1 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg"
                >
                  Insert from URL
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase">or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Upload from computer
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Table Popover */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              editor.isActive('table')
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Table Options"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            sideOffset={5}
            className="z-50 w-52 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in-0 text-xs"
          >
            {!editor.isActive('table') ? (
              <button
                type="button"
                onClick={insertTable}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert 3x3 Table</span>
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="w-full px-2 py-1 text-left rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Add Row Below
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="w-full px-2 py-1 text-left rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-red-600"
                >
                  Delete Row
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="w-full px-2 py-1 text-left rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Add Column Right
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="w-full px-2 py-1 text-left rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-red-600"
                >
                  Delete Column
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="w-full px-2 py-1 text-left rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Table
                </button>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <CodeSquare className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      {/* 9. Extra Utilities */}
      {onOpenFindReplace && (
        <>
          <Divider />
          <ToolbarButton onClick={onOpenFindReplace} title="Find & Replace" shortcut="Ctrl+F">
            <Search className="w-4 h-4" />
          </ToolbarButton>
        </>
      )}
    </div>
  )
}

export default EditorToolbar
