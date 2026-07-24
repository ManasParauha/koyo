'use client'

import React from 'react'

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="text-xs text-white bg-[#0007cd] hover:bg-[#0005a3] px-3.5 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 shadow-md focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none cursor-pointer"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span>Print Now</span>
    </button>
  )
}
