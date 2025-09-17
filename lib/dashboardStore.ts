/**
 * Dashboard Store - Coordinates loading all dashboard data in a single request
 * This dramatically reduces database connections by fetching all widget data at once
 */

import { create } from 'zustand'
import { loadingCoordinator } from './loadingCoordinator'
import useTodoStore from './store'
import useSalesStore from './salesStore'
import useCalendarStore from './calendarStore'
import useQuickLinksStore from './quickLinksStore'

interface DashboardStore {
  isLoadingDashboard: boolean
  hasLoadedDashboard: boolean
  lastLoadTime: number | null
  loadDashboardData: () => Promise<void>
}

const useDashboardStore = create<DashboardStore>((set, get) => ({
  isLoadingDashboard: false,
  hasLoadedDashboard: false,
  lastLoadTime: null,

  loadDashboardData: async () => {
    const state = get()
    
    // Prevent loading if recently loaded (within 2 seconds)
    if (state.lastLoadTime && Date.now() - state.lastLoadTime < 2000) {
      console.log('[Dashboard] Skipping load - recently loaded')
      return
    }

    // Use loading coordinator to ensure only one request
    return loadingCoordinator.coordinatedLoad(
      'dashboard-all-data',
      async () => {
        set({ isLoadingDashboard: true })
        
        try {
          console.log('[Dashboard] Loading all dashboard data...')
          const response = await fetch('/api/dashboard', {
            credentials: 'include'
          })
          
          if (!response.ok) {
            if (response.status === 401) {
              console.error('Authentication error - redirecting to login')
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
              throw new Error('Authentication required')
            }
            throw new Error(`Failed to load dashboard: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('[Dashboard] All data loaded:', {
            todos: data.todos?.todos?.length || 0,
            sales: data.sales?.sales?.length || 0,
            events: data.calendar?.events?.length || 0,
            quickLinks: data.quickLinks?.quickLinks?.length || 0
          })
          
          // Update all stores with the fetched data
          // This bypasses individual store loads
          
          // Update Todo store
          const todoStore = useTodoStore.getState()
          if (data.todos) {
            useTodoStore.setState({
              todos: data.todos.todos || [],
              categories: data.todos.categories || [],
              owners: data.todos.owners || [],
              isLoading: false,
              hasLoadedFromServer: true
            })
          }
          
          // Update Sales store
          const salesStore = useSalesStore.getState()
          if (data.sales) {
            useSalesStore.setState({
              sales: data.sales.sales || [],
              collections: data.sales.collections || [],
              products: data.sales.products || [],
              isLoading: false,
              hasLoadedFromServer: true
            })
          }
          
          // Update Calendar store
          const calendarStore = useCalendarStore.getState()
          if (data.calendar) {
            // Convert date strings to Date objects for calendar
            const events = (data.calendar.events || []).map((event: any) => ({
              ...event,
              startTime: new Date(event.startTime),
              endTime: new Date(event.endTime),
              recurringEndDate: event.recurringEndDate ? new Date(event.recurringEndDate) : null,
              createdAt: new Date(event.createdAt),
              updatedAt: new Date(event.updatedAt),
            }))
            
            const calendarTypes = (data.calendar.calendarTypes || []).map((type: any) => ({
              ...type,
              createdAt: new Date(type.createdAt),
            }))
            
            const reminders = (data.calendar.reminders || []).map((reminder: any) => ({
              ...reminder,
              createdAt: new Date(reminder.createdAt),
            }))
            
            useCalendarStore.setState({
              events,
              calendarTypes,
              reminders,
              isLoading: false,
              hasLoadedFromServer: true
            })
          }
          
          // Update QuickLinks store
          const quickLinksStore = useQuickLinksStore.getState()
          if (data.quickLinks) {
            useQuickLinksStore.setState({
              quickLinks: data.quickLinks.quickLinks || [],
              isLoading: false,
              hasLoadedFromServer: true
            })
          }
          
          set({
            isLoadingDashboard: false,
            hasLoadedDashboard: true,
            lastLoadTime: Date.now()
          })
          
          return data
        } catch (error) {
          console.error('[Dashboard] Error loading data:', error)
          set({
            isLoadingDashboard: false,
            hasLoadedDashboard: true,
            lastLoadTime: Date.now()
          })
          throw error
        }
      },
      { bypassCache: false }
    )
  }
}))

export default useDashboardStore