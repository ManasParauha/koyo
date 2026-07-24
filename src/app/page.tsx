'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastVisited = localStorage.getItem('koyo_last_visited_menu')
      if (lastVisited && lastVisited.startsWith('/menu/')) {
        router.replace(lastVisited)
      } else {
        setLoading(false)
      }
    }
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#222222] border-t-[#0007cd] animate-spin" />
          <p className="text-xs font-semibold tracking-widest text-[#888888] uppercase">Loading Koyo</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Premium Spotlight Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1a26ff]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 sm:p-10 rounded-2xl text-center space-y-8 shadow-2xl relative z-10">
        
        {/* Brand Icon & Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-xl bg-[#0f0f0f] border-2 border-[#222222] flex items-center justify-center relative shadow-inner">
            {/* Outer ring electric glow */}
            <div className="absolute inset-0 rounded-xl border border-[#0007cd]/40 animate-pulse" />
            
            {/* Branded Koyo Icon */}
            <svg className="w-9 h-9 text-[#0007cd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" stroke="#0007cd" strokeWidth="2" fill="none" />
              <path d="M9 7v10M15 7l-4.5 5 4.5 5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs font-bold tracking-widest text-[#666666] uppercase">Koyo Platform</span>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Ready to Order?
          </h1>
          <p className="text-[#a8a8a8] text-sm leading-relaxed max-w-xs mx-auto">
            Scan the QR code at your dining table to view our digital menu, customize items, and place your order instantly.
          </p>
        </div>

        {/* Dynamic Graphic Mockup of QR Scan */}
        <div className="bg-[#0f0f0f] border border-[#222222] rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 border border-[#222222] p-2 rounded-lg bg-white relative group">
            {/* Holographic QR Placeholder */}
            <div className="w-full h-full relative opacity-90 flex items-center justify-center bg-zinc-50 rounded">
              <svg className="w-24 h-24 text-black" viewBox="0 0 24 24" fill="currentColor">
                {/* Visual stylized QR code dots */}
                <path d="M3 3h6v6H3zm2 2v2h2V5zm8-2h6v6h-6zm2 2v2h2V5zM3 13h6v6H3zm2 2v2h2V15zm10-2h4v2h-4zm2 2h4v2h-4zm-2 2h2v2h-2zm4 0h2v2h-2zm-6-2h2v2h-2zm0-2h2v2h-2zm2-2h2v2h-2z" />
              </svg>
              {/* Scan Line effect */}
              <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#0007cd] opacity-70 animate-scan shadow-[0_0_8px_#1a26ff]" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#888888] tracking-wide uppercase flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#33d17a] inline-block animate-ping" />
            <span>Scanning Active</span>
          </span>
        </div>

        {/* App install reminder footer */}
        <div className="pt-2 border-t border-[#222222]/50 text-center">
          <p className="text-[11px] text-[#666666] leading-relaxed">
            No downloads or registration required. Koyo is a lightweight PWA serving dining tables directly.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
