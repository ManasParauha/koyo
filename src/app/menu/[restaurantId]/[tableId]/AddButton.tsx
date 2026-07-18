'use client'

import React from 'react'

export function AddButton() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    // Does nothing for now - we'll wire up cart state in the next step
    console.log('Add clicked (non-functional for now)')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a26ff] focus:ring-offset-2 focus:ring-offset-[#181818]"
    >
      Add
    </button>
  )
}
