'use client'

import SalesListGrid from './SalesListGrid'

export default function SalesFullPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">Sales Tracker</h1>
      </div>

      {/* Glass container */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        <SalesListGrid isFullPage isGlassView />
      </div>
    </div>
  )
}