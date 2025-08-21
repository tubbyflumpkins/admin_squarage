'use client'

import { useRouter } from 'next/navigation'
import SalesListGridReadOnly from './SalesListGridReadOnly'

export default function SalesWidget() {
  const router = useRouter()
  
  return (
    <div 
      className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:shadow-3xl"
      onClick={() => router.push('/sales')}
    >
      {/* Overlay to prevent interactions with inner content */}
      <div className="absolute inset-0 z-10 rounded-2xl" />
      
      {/* Content - not interactive due to overlay */}
      <div className="relative">
        <SalesListGridReadOnly 
          isWidget={true}
          containerHeight="auto"
        />
      </div>
    </div>
  )
}