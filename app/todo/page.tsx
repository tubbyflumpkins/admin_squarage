import Header from '@/components/UI/Header'
import TodoFullPage from '@/components/TodoList/TodoFullPage'

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TodoPage() {
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      <TodoFullPage />
    </div>
  )
}