'use client'

import { useRouter } from 'next/navigation'
import TodoListGrid from './TodoListGrid'

interface TodoWidgetProps {
  isFullPage?: boolean
}

export default function TodoWidget({ isFullPage = false }: TodoWidgetProps) {
  const router = useRouter()
  
  return (
    <div>
      <TodoListGrid isFullPage={isFullPage} containerHeight={isFullPage ? 'calc(100vh - 200px)' : '350px'} />
      
      {!isFullPage && (
        <div className="mt-4 pt-4 border-t border-brown-light/30">
          <button
            onClick={() => router.push('/todo')}
            className="text-sm text-squarage-blue hover:text-squarage-green transition-colors font-medium"
          >
            View all tasks →
          </button>
        </div>
      )}
    </div>
  )
}