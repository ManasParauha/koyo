'use client'

import React, { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CustomerErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to the console for tracking
    console.error('[Customer UI Error Boundary] Caught exception:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans relative overflow-hidden">
      {/* Subtle radial spotlight glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#0007cd]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl shadow-2xl relative z-10 text-center space-y-6">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 text-[#ff4d4d] mb-2">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Something went wrong
          </h1>
          <p className="text-[#a8a8a8] text-sm leading-relaxed">
            We encountered a temporary issue while loading the page. You can try refreshing the view, or scan the QR code on your table again.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#0007cd] text-white text-sm font-medium rounded-md hover:bg-[#0005a3] focus:outline-none focus:ring-2 focus:ring-[#0007cd]/50 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#222222] border border-[#333333] text-white text-sm font-medium rounded-md hover:bg-[#2a2a2a] focus:outline-none transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </main>
  )
}
