'use client'

import WidgetContainer from '@/components/Dashboard/WidgetContainer'
import SalesListGridReadOnly from './SalesListGridReadOnly'

export default function SalesWidget() {
  return (
    <WidgetContainer href="/sales">
      <SalesListGridReadOnly
        isWidget={true}
        containerHeight="auto"
      />
    </WidgetContainer>
  )
}
