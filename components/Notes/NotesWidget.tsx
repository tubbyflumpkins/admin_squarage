'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useNotesStore from '@/lib/notesStore'
import { Note } from '@/lib/notesTypes'
import { format, formatDistanceToNow } from 'date-fns'

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function generateNoteSlug(note: Note): string {
  const slug = note.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'untitled'
  const date = format(new Date(note.createdAt), 'yyyy-MM-dd')
  return `note:${slug}-${date}`
}

export default function NotesWidget() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const { notes, loadFromServer } = useNotesStore()

  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, [])

  const recentNotes = notes.slice(0, 6)

  return (
    <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 hover:bg-white/40 transition-all duration-200 hover:shadow-3xl min-h-[300px]">
      {/* Header - clickable to go to notes page */}
      <h2
        className="text-lg font-bold text-white mb-4 cursor-pointer"
        onClick={() => router.push('/notes')}
      >
        Notes
      </h2>

      {!isHydrated ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-squarage-black/30" />
        </div>
      ) : recentNotes.length === 0 ? (
        <div
          className="text-center py-6 cursor-pointer"
          onClick={() => router.push('/notes')}
        >
          <p className="text-squarage-black/40 text-sm">No notes yet</p>
          <p className="text-xs text-squarage-black/30 mt-1">Click to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {recentNotes.map((note) => {
            const preview = stripHtml(note.content).substring(0, 50)
            const slug = generateNoteSlug(note)
            return (
              <div
                key={note.id}
                onClick={() => router.push(`/notes?id=${slug}`)}
                className="flex flex-col p-3 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <div className="font-medium text-squarage-black text-xs truncate mb-1">
                  {note.title || 'Untitled Note'}
                </div>
                <div className="text-squarage-black/40 text-[10px] truncate mb-2 flex-1">
                  {preview || 'No content'}
                </div>
                <div className="text-squarage-black/30 text-[10px]">
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
