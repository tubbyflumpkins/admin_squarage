'use client'

import WidgetContainer from '@/components/Dashboard/WidgetContainer'
import TodoListGridReadOnly from './TodoListGridReadOnly'

export default function TodoWidget() {
  return (
    <WidgetContainer href="/todo">
      <TodoListGridReadOnly
        isWidget={true}
        containerHeight="auto"
      />
    </WidgetContainer>
  )
}
