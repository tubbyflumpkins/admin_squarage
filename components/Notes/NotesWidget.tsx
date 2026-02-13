'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import useNotesStore from '@/lib/notesStore'
import { formatDistanceToNow } from 'date-fns'

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
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

  // Show up to 5 most recent notes (already sorted by updatedAt desc from server)
  const recentNotes = notes.slice(0, 5)

  return (
    <div
      className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:shadow-3xl min-h-[300px]"
      onClick={() => router.push('/notes')}
    >
      {/* Overlay to prevent interactions with inner content */}
      <div className="absolute inset-0 z-10 rounded-2xl" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-squarage-black/70" />
          <h2 className="text-lg font-bold text-squarage-black/80">Notes</h2>
          {isHydrated && (
            <span className="text-sm text-squarage-black/50 ml-auto">{notes.length}</span>
          )}
        </div>

        {!isHydrated ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-squarage-black/30" />
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-squarage-black/40 text-sm">No notes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotes.map((note) => {
              const preview = stripHtml(note.content).substring(0, 60)
              return (
                <div
                  key={note.id}
                  className="flex items-start gap-3 py-1.5 border-b border-squarage-black/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-squarage-black/80 text-sm truncate">
                      {note.title || 'Untitled Note'}
                    </div>
                    <div className="text-squarage-black/40 text-xs truncate mt-0.5">
                      {preview || 'No content'}
                    </div>
                  </div>
                  <div className="text-squarage-black/30 text-xs whitespace-nowrap shrink-0 pt-0.5">
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
