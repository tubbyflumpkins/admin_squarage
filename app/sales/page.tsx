'use client'

import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import SalesFullPage from '@/components/SalesList/SalesFullPage'
import SalesListMobile from '@/components/Mobile/Sales/SalesListMobile'

export default function SalesPage() {
  const isMobile = useIsMobile()

  // Mobile view
  if (isMobile) {
    return <SalesListMobile />
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      <SalesFullPage />
    </div>
  )
}