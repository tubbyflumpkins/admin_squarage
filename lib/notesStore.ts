import { create } from 'zustand'
import { Note } from './notesTypes'

interface NotesStore {
  notes: Note[]
  selectedNoteId: string | null
  isLoading: boolean
  hasLoadedFromServer: boolean

  loadFromServer: () => Promise<void>
  selectNote: (id: string | null) => void
  addNote: () => void
  deleteNote: (id: string) => void
  updateNoteTitle: (id: string, title: string) => void
  updateNoteContent: (id: string, content: string) => void
  getSelectedNote: () => Note | null
}

// Per-note debounce timers for efficient saving
const saveTimers: Map<string, NodeJS.Timeout> = new Map()
const SAVE_DEBOUNCE_MS = 2000

// Save a single note to the server
async function saveNoteToServer(note: Note) {
  try {
    const response = await fetch('/api/notes/neon', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id: note.id,
        title: note.title,
        content: note.content,
      }),
    })
    if (!response.ok) {
      console.error('Failed to save note:', response.status)
    }
  } catch (error) {
    console.error('Error saving note:', error)
  }
}

// Debounced save for a specific note
function debouncedSave(note: Note) {
  const existing = saveTimers.get(note.id)
  if (existing) clearTimeout(existing)

  saveTimers.set(
    note.id,
    setTimeout(() => {
      saveNoteToServer(note)
      saveTimers.delete(note.id)
    }, SAVE_DEBOUNCE_MS)
  )
}

const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  isLoading: false,
  hasLoadedFromServer: false,

  loadFromServer: async () => {
    if (get().isLoading) return

    set({ isLoading: true })
    try {
      const response = await fetch('/api/notes/neon', {
        credentials: 'include',
      })
      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error(`Failed to load notes: ${response.status}`)
      }

      const data = await response.json()
      const loadedNotes: Note[] = (data.notes || []).map((n: Record<string, string>) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      }))

      set({
        notes: loadedNotes,
        isLoading: false,
        hasLoadedFromServer: true,
        // Auto-select first note if none selected
        selectedNoteId: get().selectedNoteId || (loadedNotes.length > 0 ? loadedNotes[0].id : null),
      })
    } catch (error) {
      console.error('Error loading notes:', error)
      set({ isLoading: false, hasLoadedFromServer: true })
    }
  },

  selectNote: (id) => {
    set({ selectedNoteId: id })
  },

  addNote: () => {
    const id = Math.random().toString(36).substring(2, 9)
    const now = new Date()
    const newNote: Note = {
      id,
      title: 'Untitled Note',
      content: '',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({
      notes: [newNote, ...state.notes],
      selectedNoteId: id,
    }))

    // Immediately create in DB
    fetch('/api/notes/neon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, title: newNote.title, content: '' }),
    }).catch(console.error)
  },

  deleteNote: (id) => {
    // Clear any pending save
    const timer = saveTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      saveTimers.delete(id)
    }

    set((state) => {
      const remaining = state.notes.filter((n) => n.id !== id)
      const wasSelected = state.selectedNoteId === id
      return {
        notes: remaining,
        selectedNoteId: wasSelected ? (remaining.length > 0 ? remaining[0].id : null) : state.selectedNoteId,
      }
    })

    fetch(`/api/notes/neon?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(console.error)
  },

  updateNoteTitle: (id, title) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, title, updatedAt: new Date() } : n
      ),
    }))

    const note = get().notes.find((n) => n.id === id)
    if (note) debouncedSave(note)
  },

  updateNoteContent: (id, content) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: new Date() } : n
      ),
    }))

    const note = get().notes.find((n) => n.id === id)
    if (note) debouncedSave(note)
  },

  getSelectedNote: () => {
    const state = get()
    return state.notes.find((n) => n.id === state.selectedNoteId) || null
  },
}))

export default useNotesStore
