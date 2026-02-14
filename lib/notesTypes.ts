export interface Note {
  id: string
  userId?: string | null
  title: string
  content: string // HTML content from rich text editor
  createdAt: Date
  updatedAt: Date
}
