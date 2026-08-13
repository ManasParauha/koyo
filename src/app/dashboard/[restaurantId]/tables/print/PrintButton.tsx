'use client'

import React from 'react'

interface PrintButtonProps {
  totalTables?: number
}

export function PrintButton({ totalTables }: PrintButtonProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center justify-center gap-2 bg-[#5e6ad2] hover:bg-[#828fff] active:bg-[#5e69d1] text-white text-xs font-medium px-3.5 py-2 rounded-md transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_12px_rgba(94,106,210,0.25)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_16px_rgba(130,143,255,0.35)] focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010102] focus-visible:outline-none cursor-pointer group"
    >
      <svg
        className="w-3.5 h-3.5 text-white/90 group-hover:scale-110 transition-transform duration-150"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      <span>Print {totalTables ? `${totalTables} Placard${totalTables > 1 ? 's' : ''}` : 'Placards'}</span>
    </button>
  )
}
