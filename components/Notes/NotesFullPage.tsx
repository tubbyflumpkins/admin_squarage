'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, FileText, Search, Share2, Check } from 'lucide-react'
import useNotesStore from '@/lib/notesStore'
import { Note } from '@/lib/notesTypes'
import { formatDistanceToNow } from 'date-fns'
import { useSearchParams } from 'next/navigation'

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function NoteListItem({ note, isSelected, onSelect }: {
  note: Note
  isSelected: boolean
  onSelect: () => void
}) {
  const preview = stripHtml(note.content).substring(0, 80)
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-squarage-black/5 transition-all duration-150 ${
        isSelected
          ? 'bg-white/40 border-l-2 border-l-squarage-yellow'
          : 'hover:bg-white/20 border-l-2 border-l-transparent'
      }`}
    >
      <div className="font-semibold text-squarage-black truncate text-sm">
        {note.title || 'Untitled Note'}
      </div>
      <div className="text-squarage-black/50 text-xs mt-0.5 truncate">
        {preview || 'No content'}
      </div>
      <div className="text-squarage-black/40 text-xs mt-1">
        {timeAgo}
      </div>
    </button>
  )
}

function NoteEditor({ note }: { note: Note }) {
  const { updateNoteTitle, updateNoteContent } = useNotesStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)

  // Sync editor content when note changes
  useEffect(() => {
    if (editorRef.current && !isEditorFocused) {
      editorRef.current.innerHTML = note.content
    }
  }, [note.id]) // Only re-set when switching notes

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      updateNoteContent(note.id, editorRef.current.innerHTML)
    }
  }, [note.id, updateNoteContent])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Rich text shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold')
          handleContentChange()
          break
        case 'i':
          e.preventDefault()
          document.execCommand('italic')
          handleContentChange()
          break
        case 'u':
          e.preventDefault()
          document.execCommand('underline')
          handleContentChange()
          break
      }
    }
  }, [handleContentChange])

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <input
        ref={titleRef}
        type="text"
        value={note.title}
        onChange={(e) => updateNoteTitle(note.id, e.target.value)}
        className="text-2xl font-bold text-squarage-black bg-transparent border-none outline-none px-6 pt-5 pb-2 placeholder-squarage-black/30 w-full"
        placeholder="Note title..."
      />

      {/* Date */}
      <div className="px-6 pb-3 text-squarage-black/40 text-xs">
        Last modified {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
      </div>

      {/* Formatting toolbar */}
      <div className="px-6 pb-3 flex gap-1">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            document.execCommand('bold')
            handleContentChange()
          }}
          className="px-2.5 py-1 rounded text-squarage-black/50 hover:text-squarage-black hover:bg-squarage-black/10 transition-colors text-sm font-bold"
          title="Bold (⌘B)"
        >
          B
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            document.execCommand('italic')
            handleContentChange()
          }}
          className="px-2.5 py-1 rounded text-squarage-black/50 hover:text-squarage-black hover:bg-squarage-black/10 transition-colors text-sm italic"
          title="Italic (⌘I)"
        >
          I
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            document.execCommand('underline')
            handleContentChange()
          }}
          className="px-2.5 py-1 rounded text-squarage-black/50 hover:text-squarage-black hover:bg-squarage-black/10 transition-colors text-sm underline"
          title="Underline (⌘U)"
        >
          U
        </button>
        <div className="w-px bg-squarage-black/15 mx-1" />
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            document.execCommand('insertUnorderedList')
            handleContentChange()
          }}
          className="px-2.5 py-1 rounded text-squarage-black/50 hover:text-squarage-black hover:bg-squarage-black/10 transition-colors text-sm"
          title="Bullet List"
        >
          &#8226; List
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            document.execCommand('insertOrderedList')
            handleContentChange()
          }}
          className="px-2.5 py-1 rounded text-squarage-black/50 hover:text-squarage-black hover:bg-squarage-black/10 transition-colors text-sm"
          title="Numbered List"
        >
          1. List
        </button>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-squarage-black/10" />

      {/* Content editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        className="flex-1 px-6 py-4 text-squarage-black/90 text-sm leading-relaxed outline-none overflow-y-auto scrollbar-thin max-w-none
          [&_b]:font-bold [&_strong]:font-bold
          [&_i]:italic [&_em]:italic
          [&_u]:underline
          [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1
          [&_li]:my-0.5"
        style={{ minHeight: '200px' }}
        data-placeholder="Start writing..."
      />
    </div>
  )
}

export default function NotesFullPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const searchParams = useSearchParams()
  const { notes, selectedNoteId, loadFromServer, selectNote, addNote, deleteNote, getSelectedNote } = useNotesStore()

  useEffect(() => {
    // Pass the shared note ID from the URL so the API can fetch it
    const noteId = searchParams.get('id')
    loadFromServer(noteId || undefined).then(() => {
      setIsHydrated(true)
    })
  }, [])

  const selectedNote = getSelectedNote()

  const filteredNotes = searchQuery
    ? notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(n.content).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  const handleDelete = (id: string) => {
    if (confirm('Delete this note?')) {
      deleteNote(id)
    }
  }

  const handleShare = (note: Note) => {
    // Use the note's actual database ID for reliable deep links
    const url = `${window.location.origin}/notes?id=${note.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">Notes</h1>
      </div>

      {/* Glass container - Apple Notes layout */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Left sidebar - Note list */}
          <div className="w-72 border-r border-squarage-black/10 flex flex-col bg-white/5 shrink-0">
            {/* Search + New */}
            <div className="p-3 border-b border-squarage-black/10 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-squarage-black/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white/20 border border-squarage-black/10 rounded-lg text-squarage-black text-xs placeholder-squarage-black/40 outline-none focus:border-squarage-black/20 transition-colors"
                  />
                </div>
                <button
                  onClick={addNote}
                  className="p-1.5 rounded-lg bg-squarage-yellow/80 hover:bg-squarage-yellow text-squarage-black transition-colors shrink-0"
                  title="New Note"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {!isHydrated ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-squarage-black/30" />
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <FileText className="w-10 h-10 text-squarage-black/20 mb-3" />
                  <p className="text-squarage-black/40 text-sm">
                    {searchQuery ? 'No notes found' : 'No notes yet'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={addNote}
                      className="mt-3 text-squarage-yellow text-sm hover:underline"
                    >
                      Create your first note
                    </button>
                  )}
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={note.id === selectedNoteId}
                    onSelect={() => selectNote(note.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right side - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedNote ? (
              <>
                {/* Editor toolbar */}
                <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-squarage-black/10">
                  <button
                    onClick={() => handleShare(selectedNote)}
                    className="p-1.5 rounded-lg text-squarage-black/30 hover:text-squarage-black hover:bg-squarage-black/5 transition-colors"
                    title="Copy share link"
                  >
                    {copied ? <Check className="w-4 h-4 text-squarage-green" /> : <Share2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="p-1.5 rounded-lg text-squarage-black/30 hover:text-squarage-red hover:bg-squarage-black/5 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <NoteEditor key={selectedNote.id} note={selectedNote} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-squarage-black/15 mx-auto mb-4" />
                  <p className="text-squarage-black/40 text-lg">Select a note or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
