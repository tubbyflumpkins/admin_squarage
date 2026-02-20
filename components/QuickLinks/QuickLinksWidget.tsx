'use client'

import { useRouter } from 'next/navigation'
import WidgetContainer from '@/components/Dashboard/WidgetContainer'
import QuickLinksGridReadOnly from './QuickLinksGridReadOnly'

export default function QuickLinksWidget() {
  const router = useRouter()

  return (
    <WidgetContainer mode="interactive">
      {/* Clickable header to go to management page */}
      <h3
        className="text-lg font-semibold text-white mb-4 cursor-pointer"
        onClick={() => router.push('/quick-links')}
      >
        Quick Links
      </h3>

      {/* Links grid - directly clickable */}
      <QuickLinksGridReadOnly
        isWidget={true}
        maxItems={8}
      />
    </WidgetContainer>
  )
}
