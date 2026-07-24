'use client'

import React, { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function CustomerPWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showOnlineToast, setShowOnlineToast] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Session Memory: Save the current path for dynamic redirect
    localStorage.setItem('koyo_last_visited_menu', window.location.pathname)

    // 2. Connection State Detection
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      setShowOnlineToast(true)
      // Hide the "Back online" toast after 3 seconds
      const timer = setTimeout(() => {
        setShowOnlineToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowOnlineToast(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 3. PWA Installation Prompt Interception
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user has already dismissed this banner in the current session
      const isDismissed = sessionStorage.getItem('koyo_install_prompt_dismissed') === 'true'
      if (!isDismissed) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Also check if app is already installed/running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setShowInstallBanner(false)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the browser install prompt
    await deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`[PWA] User response to install choice: ${outcome}`)

    // Clean up
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  const handleDismissInstall = () => {
    // Respect user dismissal by saving flag in sessionStorage (valid for this browser tab session)
    sessionStorage.setItem('koyo_install_prompt_dismissed', 'true')
    setShowInstallBanner(false)
  }

  return (
    <>
      {/* 1. Offline Indicator Banner */}
      {isOffline && (
        <div className="fixed top-2 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] bg-[#ff4d4d] border border-red-600/30 text-white font-sans text-xs sm:text-sm font-medium px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 animate-slideIn">
          <svg className="w-5 h-5 flex-shrink-0 animate-pulse text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L11.314 11.3M15 11l-3 3m0 0l-3-3m3 3V8" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-white">Connection lost</p>
            <p className="text-white/80 text-[11px] leading-tight mt-0.5">Showing menu from cached backup. Ordering is disabled offline.</p>
          </div>
        </div>
      )}

      {/* 2. Reconnection Success Toast */}
      {showOnlineToast && (
        <div className="fixed top-2 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] bg-[#33d17a] border border-emerald-600/30 text-white font-sans text-xs sm:text-sm font-medium px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 animate-slideIn">
          <svg className="w-5 h-5 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-white">Back online</p>
            <p className="text-white/80 text-[11px] leading-tight mt-0.5">Connection restored. You can now place orders normally.</p>
          </div>
        </div>
      )}

      {/* 3. Custom PWA Add to Home Screen Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[380px] z-[9998] bg-[#181818] border border-[#222222] text-white p-4 rounded-xl shadow-2xl space-y-4 animate-slideUp">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#0f0f0f] border border-[#222222] flex items-center justify-center flex-shrink-0 text-white">
                {/* Visual miniature of the app brand icon */}
                <svg className="w-6 h-6 text-[#0007cd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" stroke="#0007cd" strokeWidth="2" fill="none" />
                  <path d="M9 7v10M15 7l-4.5 5 4.5 5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm tracking-tight text-white">Install Koyo App</h4>
                <p className="text-xs text-[#a8a8a8] leading-tight mt-0.5">Faster ordering and offline menu access.</p>
              </div>
            </div>
            <button
              onClick={handleDismissInstall}
              className="text-[#888888] hover:text-white transition-colors p-1 rounded-md hover:bg-[#222222] focus:outline-none"
              aria-label="Dismiss install banner"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={handleDismissInstall}
              className="px-3 py-1.5 text-xs font-semibold text-[#a8a8a8] hover:text-white transition-colors rounded-md"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-[#0007cd] hover:bg-[#0005a3] text-white px-4 py-1.5 text-xs font-semibold rounded-md shadow-md shadow-[#0007cd]/20 transition-all duration-200"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Tailwind local animations style injection */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  )
}
