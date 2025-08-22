'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      // Check for iOS standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      // Check for Android/Desktop standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.matchMedia('(display-mode: window-controls-overlay)').matches
      
      setIsInStandaloneMode(isIOSStandalone || isStandalone)
      setIsInstalled(isIOSStandalone || isStandalone)
    }
    
    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
      const isIOSSafari = isIOSDevice && /safari/.test(userAgent) && !/crios/.test(userAgent)
      setIsIOS(isIOSSafari)
      
      // On iOS Safari, it's always "installable" via Add to Home Screen
      if (isIOSSafari && !isInStandaloneMode) {
        setIsInstallable(true)
      }
    }
    
    checkIfInstalled()
    checkIOS()
    
    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }
    
    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInStandaloneMode])

  const installPWA = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, show instructions
      return {
        success: false,
        message: 'Please tap the Share button and select "Add to Home Screen"'
      }
    }
    
    if (!deferredPrompt) {
      return {
        success: false,
        message: 'Installation not available'
      }
    }
    
    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null)
        return {
          success: true,
          message: 'App installed successfully'
        }
      } else {
        return {
          success: false,
          message: 'Installation cancelled'
        }
      }
    } catch (error) {
      console.error('Installation error:', error)
      return {
        success: false,
        message: 'Installation failed'
      }
    }
  }

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isInStandaloneMode,
    installPWA
  }
}