'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function PWARegister() {
  const { status } = useSession()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      return mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth < 768
    }
    
    setIsMobile(checkMobile())
    
    // Also check on resize
    const handleResize = () => setIsMobile(checkMobile())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // For DESKTOP: Always unregister service workers
    if (!isMobile && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister()
          console.log('Service worker unregistered (desktop mode)')
        })
      })
      
      // Clear all caches on desktop
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name)
            console.log('Cache cleared (desktop mode):', name)
          })
        })
      }
      return
    }
    
    // For MOBILE: Register service worker if authenticated
    if (isMobile && status === 'authenticated' && 'serviceWorker' in navigator) {
      // Wait for window load
      if (document.readyState === 'complete') {
        registerServiceWorker()
      } else {
        window.addEventListener('load', registerServiceWorker)
        return () => window.removeEventListener('load', registerServiceWorker)
      }
    }
  }, [status, isMobile])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw-mobile.js')
      console.log('Mobile Service Worker registered:', registration)

      // Check for updates every hour
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New content available, refresh to update')
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  return null
}