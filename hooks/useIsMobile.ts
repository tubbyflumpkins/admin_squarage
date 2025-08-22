'use client'

import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true)
    
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      // Initial check
      const checkMobile = () => {
        setIsMobile(window.innerWidth < breakpoint)
      }
      
      checkMobile()
      
      // Add resize listener
      const handleResize = () => {
        checkMobile()
      }
      
      window.addEventListener('resize', handleResize)
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [breakpoint])

  // Return false during SSR to avoid hydration mismatch
  // This ensures desktop version renders on server
  if (!isClient) {
    return false
  }

  return isMobile
}

// Hook to check if we're in standalone mode (PWA)
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    if (typeof window !== 'undefined') {
      // Check if running as installed PWA
      const checkStandalone = () => {
        const isIOSStandalone = (window.navigator as any).standalone === true
        const isAndroidStandalone = window.matchMedia('(display-mode: standalone)').matches
        const isDesktopStandalone = window.matchMedia('(display-mode: window-controls-overlay)').matches
        
        setIsStandalone(isIOSStandalone || isAndroidStandalone || isDesktopStandalone)
      }
      
      checkStandalone()
      
      // Listen for display mode changes
      const mediaQuery = window.matchMedia('(display-mode: standalone)')
      const handleChange = () => checkStandalone()
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // Legacy browsers
        mediaQuery.addListener(handleChange)
      }
      
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange)
        } else {
          mediaQuery.removeListener(handleChange)
        }
      }
    }
  }, [])

  if (!isClient) {
    return false
  }

  return isStandalone
}