'use client'

import React, { useEffect, useState } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardErrorBoundary({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Log the error to console with context
    console.error('[Dashboard UI Error Boundary] Caught exception:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans relative overflow-hidden">
      {/* Subtle radial spotlight glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0007cd]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-lg w-full bg-[#181818] border border-[#222222] p-8 rounded-xl shadow-2xl relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 text-[#ff4d4d] shrink-0">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#222222] border border-[#333333] rounded-full text-red-400">
              System Error
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-white mt-1.5">
              Kitchen Dashboard Crashed
            </h1>
          </div>
        </div>

        <p className="text-[#a8a8a8] text-sm leading-relaxed">
          An error occurred while rendering the kitchen feed or settings page. Active subscriptions or local updates might have lost connection.
        </p>

        {/* Collapsible Error Debug Pane */}
        <div className="border border-[#222222] rounded-lg overflow-hidden bg-[#0a0a0a]">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-[#a8a8a8] hover:bg-[#111] transition-colors focus:outline-none"
          >
            <span>Technical Details</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDetails && (
            <div className="p-4 border-t border-[#222222] text-left overflow-x-auto max-h-48 font-mono text-[11px] text-red-400 leading-normal whitespace-pre-wrap select-text">
              <div className="font-semibold text-white mb-1">Message:</div>
              {error.message || 'Unknown error'}
              {error.digest && (
                <>
                  <div className="font-semibold text-white mt-2.5 mb-1">Digest:</div>
                  {error.digest}
                </>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 px-5 py-2.5 bg-[#0007cd] text-white text-sm font-medium rounded-md hover:bg-[#0005a3] focus:outline-none transition-colors text-center"
          >
            Reset Dashboard
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-5 py-2.5 bg-[#222222] border border-[#333333] text-white text-sm font-medium rounded-md hover:bg-[#2a2a2a] focus:outline-none transition-colors text-center"
          >
            Reload Page
          </button>
        </div>
      </div>
    </main>
  )
}
