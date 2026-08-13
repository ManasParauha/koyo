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
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5e6ad2]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-md w-full bg-[#0f1011] border border-[#23252a] p-8 rounded-xl shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 bg-[#141516] border border-[#23252a] text-[#5e6ad2] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[#f7f8f8] tracking-tight">
            Dashboard Error Encountered
          </h2>
          <p className="text-xs text-[#8a8f98] leading-relaxed">
            {error.message || 'An unexpected error occurred while loading this section.'}
          </p>
        </div>

        {/* Collapsible Error Debug Pane */}
        <div className="border border-[#23252a] rounded-lg overflow-hidden bg-[#0a0a0a]">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-[#8a8f98] hover:bg-[#141516] transition-colors focus:outline-none"
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
