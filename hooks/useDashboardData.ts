/**
 * Custom hook for loading dashboard data
 * This ensures all widgets load data through a single coordinated request
 */

import { useEffect, useRef } from 'react'
import useDashboardStore from '@/lib/dashboardStore'

export function useDashboardData() {
  const { loadDashboardData, hasLoadedDashboard, isLoadingDashboard } = useDashboardStore()
  const hasInitiated = useRef(false)

  useEffect(() => {
    // Only initiate loading once per component mount
    if (!hasInitiated.current && !hasLoadedDashboard && !isLoadingDashboard) {
      hasInitiated.current = true
      loadDashboardData().catch(() => {})
    }
  }, [hasLoadedDashboard, isLoadingDashboard, loadDashboardData])

  return {
    isLoading: isLoadingDashboard,
    hasLoaded: hasLoadedDashboard
  }
}