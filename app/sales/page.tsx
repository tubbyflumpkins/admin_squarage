import Header from '@/components/UI/Header'
import SalesFullPage from '@/components/SalesList/SalesFullPage'

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      <SalesFullPage />
    </div>
  )
}