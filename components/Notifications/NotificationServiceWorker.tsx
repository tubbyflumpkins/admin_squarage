'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function NotificationServiceWorker() {
  const { status } = useSession()
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if service workers and push notifications are supported
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window
      setIsSupported(supported)
      return supported
    }

    if (!checkSupport()) {
      console.log('Push notifications are not supported in this browser')
      return
    }

    // Only register if user is authenticated
    if (status !== 'authenticated') {
      return
    }

    // Register the notification service worker
    const registerServiceWorker = async () => {
      try {
        // First unregister any existing notification service workers
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          if (registration.active?.scriptURL.includes('service-worker.js')) {
            console.log('Found existing notification service worker, updating...')
            await registration.update()
            setSwRegistration(registration)
            return
          }
        }

        // Register new service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        })
        console.log('Notification Service Worker registered:', registration)
        setSwRegistration(registration)

        // Check for updates periodically - STORE INTERVAL REF FOR CLEANUP
        const updateInterval = setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Check every hour

        // Store interval for cleanup
        ;(window as any).__swUpdateInterval = updateInterval

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New notification service worker available')
                // Could show a toast here to notify user
              }
            })
          }
        })

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready
        console.log('Service Worker is ready')

        // Check notification permission
        checkNotificationPermission()

      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    // Check and request notification permission
    const checkNotificationPermission = async () => {
      const permission = Notification.permission
      
      if (permission === 'default') {
        // Permission not yet requested
        console.log('Notification permission not yet granted')
        // We'll request permission when user clicks enable in settings
      } else if (permission === 'granted') {
        console.log('Notification permission already granted')
        // Check if already subscribed
        checkExistingSubscription()
      } else {
        console.log('Notification permission denied')
      }
    }

    // Check if already subscribed to push
    const checkExistingSubscription = async () => {
      if (!swRegistration) return

      try {
        const subscription = await swRegistration.pushManager.getSubscription()
        if (subscription) {
          console.log('Existing push subscription found:', subscription.endpoint)
          // Could verify with server here
        } else {
          console.log('No existing push subscription')
        }
      } catch (error) {
        console.error('Error checking push subscription:', error)
      }
    }

    // Register service worker when ready
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
      return () => {
        window.removeEventListener('load', registerServiceWorker)
        // Clean up update interval
        if ((window as any).__swUpdateInterval) {
          clearInterval((window as any).__swUpdateInterval)
          delete (window as any).__swUpdateInterval
        }
      }
    }

    // Also clean up on unmount
    return () => {
      if ((window as any).__swUpdateInterval) {
        clearInterval((window as any).__swUpdateInterval)
        delete (window as any).__swUpdateInterval
      }
    }
  }, [status, swRegistration])

  // Expose methods for subscribing/unsubscribing (used by NotificationSettings)
  useEffect(() => {
    if (!isSupported || !swRegistration) return

    // Add methods to window for other components to use
    (window as any).notificationService = {
      isSupported,
      registration: swRegistration,
      
      requestPermission: async () => {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      },

      subscribe: async () => {
        if (!swRegistration) throw new Error('Service worker not registered')
        
        // Get VAPID public key from environment
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) throw new Error('VAPID public key not configured')

        // Convert VAPID key to Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

        try {
          const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          })

          // Send subscription to server
          const response = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription })
          })

          if (!response.ok) throw new Error('Failed to save subscription')
          
          return subscription
        } catch (error) {
          console.error('Error subscribing to push:', error)
          throw error
        }
      },

      unsubscribe: async () => {
        if (!swRegistration) throw new Error('Service worker not registered')

        try {
          const subscription = await swRegistration.pushManager.getSubscription()
          if (!subscription) return true

          // Unsubscribe from push
          await subscription.unsubscribe()

          // Notify server
          await fetch('/api/notifications/unsubscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          })

          return true
        } catch (error) {
          console.error('Error unsubscribing from push:', error)
          throw error
        }
      },

      getSubscription: async () => {
        if (!swRegistration) return null
        return await swRegistration.pushManager.getSubscription()
      },

      testNotification: async () => {
        const response = await fetch('/api/notifications/test', {
          method: 'POST'
        })
        return response.ok
      }
    }

    return () => {
      // Cleanup
      delete (window as any).notificationService
    }
  }, [isSupported, swRegistration])

  return null
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}