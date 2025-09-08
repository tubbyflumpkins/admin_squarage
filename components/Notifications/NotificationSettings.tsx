'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, X, Loader2, Smartphone, AlertCircle } from 'lucide-react'

interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  taskCreated: boolean
  taskAssigned: boolean
  taskDue: boolean
  statusChanged: boolean
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    emailEnabled: false,
    taskCreated: true,
    taskAssigned: true,
    taskDue: true,
    statusChanged: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  // Load preferences and check push subscription status
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Check if notifications are supported
        const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(iOS)

        // Check if PWA (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true
        setIsPWA(isStandalone)

        if (supported) {
          // Check permission state
          setPermissionState(Notification.permission)

          // Check if subscribed to push
          if ((window as any).notificationService) {
            const subscription = await (window as any).notificationService.getSubscription()
            setPushSubscribed(!!subscription)
          }
        }

        // Load preferences from API
        const response = await fetch('/api/notifications/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            setPreferences(data.preferences)
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Handle enabling push notifications
  const handleEnablePush = async () => {
    setMessage(null)
    
    if (!isSupported) {
      setMessage({ type: 'error', text: 'Push notifications are not supported in this browser' })
      return
    }

    if (isIOS && !isPWA) {
      setMessage({ 
        type: 'info', 
        text: 'Please add this app to your Home Screen to enable push notifications on iOS' 
      })
      return
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission !== 'granted') {
        setMessage({ type: 'error', text: 'Permission denied. Please enable notifications in your browser settings.' })
        return
      }

      // Subscribe to push
      if ((window as any).notificationService) {
        await (window as any).notificationService.subscribe()
        setPushSubscribed(true)
        setPreferences(prev => ({ ...prev, pushEnabled: true }))
        await savePreferences({ ...preferences, pushEnabled: true })
        setMessage({ type: 'success', text: 'Push notifications enabled successfully!' })

        // Send test notification
        setTimeout(() => {
          (window as any).notificationService.testNotification()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: 'Service worker not ready. Please refresh and try again.' })
      }
    } catch (error) {
      console.error('Error enabling push:', error)
      setMessage({ type: 'error', text: 'Failed to enable push notifications' })
    }
  }

  // Handle disabling push notifications
  const handleDisablePush = async () => {
    setMessage(null)
    
    try {
      if ((window as any).notificationService) {
        await (window as any).notificationService.unsubscribe()
        setPushSubscribed(false)
        setPreferences(prev => ({ ...prev, pushEnabled: false }))
        await savePreferences({ ...preferences, pushEnabled: false })
        setMessage({ type: 'success', text: 'Push notifications disabled' })
      }
    } catch (error) {
      console.error('Error disabling push:', error)
      setMessage({ type: 'error', text: 'Failed to disable push notifications' })
    }
  }

  // Save preferences to API
  const savePreferences = async (prefs: NotificationPreferences) => {
    setSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      })
      
      if (!response.ok) throw new Error('Failed to save preferences')
      
      return true
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
      return false
    } finally {
      setSaving(false)
    }
  }

  // Handle preference toggle
  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] }
    setPreferences(newPreferences)
    await savePreferences(newPreferences)
  }

  // Send test notification
  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', { method: 'POST' })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Test notification sent!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to send test notification' })
      }
    } catch (error) {
      console.error('Error sending test:', error)
      setMessage({ type: 'error', text: 'Failed to send test notification' })
    }
  }

  if (loading) {
    return (
      <div className="bg-squarage-white/50 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-squarage-green" />
          <span className="ml-2 text-brown-medium">Loading notification settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-squarage-white/50 rounded-lg p-6 space-y-6">
      {/* Push Notification Status */}
      <div className="border-b border-brown-light/20 pb-4">
        <h3 className="text-lg font-semibold text-brown-dark mb-4">Push Notifications</h3>
        
        {!isSupported ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Not Supported</p>
                <p className="text-sm text-red-700 mt-1">
                  Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.
                </p>
              </div>
            </div>
          </div>
        ) : isIOS && !isPWA ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">iOS Installation Required</p>
                <p className="text-sm text-blue-700 mt-1">
                  To enable push notifications on iOS:
                </p>
                <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal">
                  <li>Tap the Share button in Safari</li>
                  <li>Select "Add to Home Screen"</li>
                  <li>Open the app from your Home Screen</li>
                  <li>Return here to enable notifications</li>
                </ol>
              </div>
            </div>
          </div>
        ) : pushSubscribed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Push Notifications Enabled</p>
                  <p className="text-sm text-green-700">You will receive notifications for enabled events</p>
                </div>
              </div>
              <button
                onClick={handleDisablePush}
                className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Disable
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellOff className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications Disabled</p>
                  <p className="text-sm text-gray-700">Enable to receive real-time notifications</p>
                </div>
              </div>
              <button
                onClick={handleEnablePush}
                className="px-3 py-1.5 bg-squarage-green text-white text-sm font-medium rounded-lg hover:bg-squarage-green/90 transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div>
        <h3 className="text-lg font-semibold text-brown-dark mb-4">Notification Types</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white/80 transition-colors cursor-pointer">
            <div>
              <p className="text-sm font-medium text-brown-dark">Task Created</p>
              <p className="text-xs text-brown-medium">Notify when a new task is created</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.taskCreated}
              onChange={() => handleToggle('taskCreated')}
              disabled={saving}
              className="h-5 w-5 text-squarage-green rounded focus:ring-squarage-green"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white/80 transition-colors cursor-pointer">
            <div>
              <p className="text-sm font-medium text-brown-dark">Task Assigned</p>
              <p className="text-xs text-brown-medium">Notify when a task is assigned to you</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.taskAssigned}
              onChange={() => handleToggle('taskAssigned')}
              disabled={saving}
              className="h-5 w-5 text-squarage-green rounded focus:ring-squarage-green"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white/80 transition-colors cursor-pointer">
            <div>
              <p className="text-sm font-medium text-brown-dark">Task Due</p>
              <p className="text-xs text-brown-medium">Daily reminder for tasks due today</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.taskDue}
              onChange={() => handleToggle('taskDue')}
              disabled={saving}
              className="h-5 w-5 text-squarage-green rounded focus:ring-squarage-green"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white/80 transition-colors cursor-pointer">
            <div>
              <p className="text-sm font-medium text-brown-dark">Status Changed</p>
              <p className="text-xs text-brown-medium">Notify when task status changes</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.statusChanged}
              onChange={() => handleToggle('statusChanged')}
              disabled={saving}
              className="h-5 w-5 text-squarage-green rounded focus:ring-squarage-green"
            />
          </label>
        </div>
      </div>

      {/* Test Notification */}
      {pushSubscribed && (
        <div className="pt-4 border-t border-brown-light/20">
          <button
            onClick={sendTestNotification}
            className="w-full sm:w-auto px-4 py-2 bg-squarage-blue text-white font-medium rounded-lg hover:bg-squarage-blue/90 transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Send Test Notification
          </button>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-700' 
            : message.type === 'error'
            ? 'bg-red-500/20 border border-red-500/50 text-red-700'
            : 'bg-blue-500/20 border border-blue-500/50 text-blue-700'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : message.type === 'error' ? (
            <X className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  )
}