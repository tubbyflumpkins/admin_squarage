'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  relatedId: string | null
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clear all notifications
  const clearAll = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE'
      })
      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time updates via SSE
  useEffect(() => {
    const setupSSE = () => {
      try {
        eventSourceRef.current = new EventSource('/api/notifications/stream')
        
        eventSourceRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          if (data.type === 'new-notification') {
            // Add new notification to the top of the list
            setNotifications(prev => [data.notification, ...prev].slice(0, 20))
            setUnreadCount(prev => prev + 1)
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.notification.title, {
                body: data.notification.message,
                icon: '/images/favicon.png',
                tag: data.notification.id
              })
            }
          } else if (data.type === 'unread-count') {
            setUnreadCount(data.count)
          }
        }
        
        eventSourceRef.current.onerror = () => {
          console.error('SSE connection error, falling back to polling')
          // Fall back to polling
          const pollInterval = setInterval(() => {
            fetchNotifications()
            fetchUnreadCount()
          }, 30000) // Poll every 30 seconds
          
          return () => clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error setting up SSE:', error)
      }
    }
    
    // Initial fetch
    fetchNotifications()
    fetchUnreadCount()
    
    // Set up SSE
    setupSSE()
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [fetchNotifications, fetchUnreadCount])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_created': return '➕'
      case 'task_assigned': return '👤'
      case 'task_due': return '⏰'
      case 'status_changed': return '✅'
      default: return '📌'
    }
  }

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return format(notificationDate, 'MMM d')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-squarage-white hover:text-squarage-yellow transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-squarage-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel with Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-50 transform transition-all duration-200 scale-100 animate-fadeIn">
          {/* Action buttons at the top if there are notifications */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 flex items-center justify-end gap-2 border-b border-white/20">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-brown-dark hover:text-brown-medium px-2 py-1 rounded-lg hover:bg-white/30 transition-all duration-200"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={clearAll}
                disabled={loading}
                className="text-xs text-brown-dark hover:text-red-600 px-2 py-1 rounded-lg hover:bg-white/30 transition-all duration-200"
                title="Clear all notifications"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-3 text-brown-medium/30" />
                <p className="text-brown-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="py-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-2.5 transition-all duration-200 cursor-pointer ${
                      !notification.read 
                        ? 'bg-squarage-blue/10 hover:bg-white/30' 
                        : 'hover:bg-white/30'
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                      if (notification.relatedId) {
                        setIsOpen(false)
                        // Navigate to related task
                        window.location.href = `/todo#${notification.relatedId}`
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm ${
                              !notification.read ? 'font-medium text-brown-dark' : 'text-brown-dark'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-brown-medium mt-0.5">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-squarage-green rounded-full mt-1 flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}