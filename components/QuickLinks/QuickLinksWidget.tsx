'use client'

import { useRouter } from 'next/navigation'
import QuickLinksGridReadOnly from './QuickLinksGridReadOnly'

export default function QuickLinksWidget() {
  const router = useRouter()
  
  return (
    <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 hover:bg-white/40 transition-all duration-200 hover:shadow-3xl">
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
    </div>
  )
}