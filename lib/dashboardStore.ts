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
    
    // Prevent loading if recently loaded (within 30 seconds)
    if (state.lastLoadTime && Date.now() - state.lastLoadTime < 30000) {
      return
    }

    // Use loading coordinator to ensure only one request
    return loadingCoordinator.coordinatedLoad(
      'dashboard-all-data',
      async () => {
        set({ isLoadingDashboard: true })

        // Mark all sub-stores as loading to prevent independent loads
        useTodoStore.setState({ isLoading: true })
        useSalesStore.setState({ isLoading: true })
        useCalendarStore.setState({ isLoading: true })
        useQuickLinksStore.setState({ isLoading: true })

        try {
          const response = await fetch('/api/dashboard', {
            credentials: 'include'
          })
          
          if (!response.ok) {
            if (response.status === 401) {
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
              throw new Error('Authentication required')
            }
            throw new Error(`Failed to load dashboard: ${response.status}`)
          }
          
          const data = await response.json()

          // Update all stores with the fetched data
          // This bypasses individual store loads
          
          // Update Todo store
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
          if (data.sales) {
            // Normalize channel dates
            const normalizedChannels = (data.sales.channels || []).map((channel: any) => ({
              ...channel,
              createdAt: channel.createdAt ? new Date(channel.createdAt) : new Date(),
            }))

            useSalesStore.setState({
              sales: data.sales.sales || [],
              collections: data.sales.collections || [],
              products: data.sales.products || [],
              channels: normalizedChannels,
              isLoading: false,
              hasLoadedFromServer: true
            })
          }
          
          // Update Calendar store
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