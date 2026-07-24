'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Demo request form state
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    restaurantName: '',
    email: '',
    phone: '',
    message: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.restaurantName.trim()) errors.restaurantName = 'Restaurant name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email'
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    return errors
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    // Simulate API request to show realistic submitting state
    setTimeout(() => {
      setIsSubmitting(false)
      setFormSubmitted(true)
    }, 1200)
  }

  const handleResetForm = () => {
    setFormData({
      name: '',
      restaurantName: '',
      email: '',
      phone: '',
      message: ''
    })
    setFormSubmitted(false)
  }

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
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col font-sans overflow-x-hidden selection:bg-[#0007cd]/30 selection:text-white relative">
      
      {/* 1. Header/Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#0f0f0f]/80 backdrop-blur-md border-b border-[#222222]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#222222] flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 rounded-lg border border-[#0007cd]/30 group-hover:border-[#0007cd]/60 transition-colors" />
              <svg className="w-4.5 h-4.5 text-[#0007cd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" stroke="#0007cd" strokeWidth="2.5" fill="none" />
                <path d="M9 7v10M15 7l-4.5 5 4.5 5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
              Koyo
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#a8a8a8]">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#benefits" className="hover:text-white transition-colors">Why Choose Us</a>
            <a href="#demo" className="hover:text-white transition-colors">Book a Demo</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard/login" 
              className="text-xs font-semibold text-[#a8a8a8] hover:text-white px-3 py-2 transition-colors"
            >
              Staff Portal
            </Link>
            <a 
              href="#demo" 
              className="hidden sm:inline-block bg-[#0007cd] hover:bg-[#0005a3] text-white text-xs font-semibold px-4.5 py-2.5 rounded-md transition-colors shadow-md shadow-[#0007cd]/20"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-6 overflow-hidden">
        {/* Background Spotlight Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#1a26ff]/10 rounded-full blur-[140px] pointer-events-none z-0" />
        
        <div className="max-w-6xl mx-auto text-center space-y-12 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#222222] border border-[#333333] px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-white tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] inline-block animate-pulse" />
              <span>Ditch Overpriced POS Hardware</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-white">
              Run Your Dining Floor <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#00d4ff]">
                on Frictionless QR.
              </span>
            </h1>
            <p className="text-[#a8a8a8] text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-normal">
              Empower guests to scan, order, and pay instantly at their table—via card, cash at counter, or at the end of their meal. Zero waiter bottlenecks, zero hardware fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#demo" 
              className="w-full sm:w-auto text-center bg-[#0007cd] hover:bg-[#0005a3] text-white text-sm font-semibold px-6 py-3.5 rounded-md transition-all shadow-lg shadow-[#0007cd]/30"
            >
              Book a Demo
            </a>
            <Link 
              href="/dashboard/login" 
              className="w-full sm:w-auto text-center bg-[#181818] border border-[#222222] hover:bg-[#222222] text-white text-sm font-semibold px-6 py-3.5 rounded-md transition-all"
            >
              Staff Dashboard
            </Link>
          </div>

          {/* Premium Visual Mockup (2x2 Grid representing customer and staff dashboard functionality) */}
          <div className="max-w-4xl mx-auto pt-8">
            <div className="bg-[#000000] border border-[#333333] rounded-2xl p-4 md:p-6 shadow-2xl relative">
              {/* Outer spotlight glow behind grid */}
              <div className="absolute inset-0 bg-[#0007cd]/5 rounded-2xl blur-lg pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10 text-left">
                
                {/* Pane 1: Customer PWA Interface */}
                <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffb82b]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#33d17a]" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#888888] tracking-wider uppercase font-mono">Table 4 Menu</span>
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="bg-[#0f0f0f] border border-[#222222] p-3 rounded-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Classic Smash Burger</h4>
                        <p className="text-[10px] text-[#a8a8a8]">$12.50 • Double beef, cheddar, house sauce</p>
                      </div>
                      <button className="bg-[#0007cd] text-[10px] text-white font-bold px-2.5 py-1 rounded hover:bg-[#0005a3] transition-colors">
                        + Add
                      </button>
                    </div>
                    <div className="bg-[#0f0f0f] border border-[#222222] p-3 rounded-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white">Truffle Parmesan Fries</h4>
                        <p className="text-[10px] text-[#a8a8a8]">$6.00 • Grated parm, truffle oil, parsley</p>
                      </div>
                      <button className="bg-[#0007cd] text-[10px] text-white font-bold px-2.5 py-1 rounded hover:bg-[#0005a3] transition-colors">
                        + Add
                      </button>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[#a8a8a8]">Cart Subtotal (2 items)</span>
                      <span className="font-bold text-[#33d17a]">$18.50</span>
                    </div>
                  </div>
                </div>

                {/* Pane 2: Live Kitchen Dashboard */}
                <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#33d17a] animate-ping" />
                      <span className="text-[10px] text-[#a8a8a8] font-mono">LIVE KITCHEN DASHBOARD</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#00d4ff] uppercase font-mono">3 Active Tickets</span>
                  </div>
                  <div className="space-y-2.5 font-mono text-[11px] text-[#a8a8a8]">
                    <div className="bg-[#0f0f0f] border-l-2 border-[#0007cd] p-2.5 rounded space-y-1.5">
                      <div className="flex justify-between text-white font-bold">
                        <span>TICKET #042 (Table 4)</span>
                        <span className="text-[#00d4ff]">2m ago</span>
                      </div>
                      <div className="text-white">
                        1x Classic Smash Burger <span className="text-[#888888]">[Medium Rare]</span>
                        <br />
                        1x Truffle Parmesan Fries
                      </div>
                      <div className="text-[10px] text-[#888888]">Status: Preparing</div>
                    </div>
                    <div className="bg-[#0f0f0f] border-l-2 border-[#222222] p-2.5 rounded opacity-60">
                      <div className="flex justify-between font-bold">
                        <span>TICKET #041 (Table 12)</span>
                        <span>12m ago</span>
                      </div>
                      <div>
                        2x Spicy Miso Ramen
                      </div>
                      <div className="text-[10px] text-[#33d17a]">Status: Ready to Serve</div>
                    </div>
                  </div>
                </div>

                {/* Pane 3: Restaurant Analytics */}
                <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <span className="text-[11px] font-semibold text-[#888888] tracking-wider uppercase font-mono">Today's Performance</span>
                    <span className="text-[10px] text-[#33d17a] font-bold">+18.4% vs last Friday</span>
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0f0f0f] border border-[#222222] p-3 rounded-lg">
                        <div className="text-[10px] text-[#888888] uppercase tracking-wider">Gross Sales</div>
                        <div className="text-lg font-bold text-white">$4,250.00</div>
                      </div>
                      <div className="bg-[#0f0f0f] border border-[#222222] p-3 rounded-lg">
                        <div className="text-[10px] text-[#888888] uppercase tracking-wider">Total Orders</div>
                        <div className="text-lg font-bold text-white">134</div>
                      </div>
                    </div>
                    {/* Visual SVGs simulating growth graph */}
                    <div className="h-10 bg-[#0f0f0f] border border-[#222222] rounded-lg p-1.5 flex items-end space-x-1.5">
                      <div className="bg-[#222222] hover:bg-[#333333] w-full h-[30%] rounded-sm transition-all" />
                      <div className="bg-[#222222] hover:bg-[#333333] w-full h-[45%] rounded-sm transition-all" />
                      <div className="bg-[#222222] hover:bg-[#333333] w-full h-[40%] rounded-sm transition-all" />
                      <div className="bg-[#222222] hover:bg-[#333333] w-full h-[60%] rounded-sm transition-all" />
                      <div className="bg-[#222222] hover:bg-[#333333] w-full h-[55%] rounded-sm transition-all" />
                      <div className="bg-[#0007cd] w-full h-[85%] rounded-sm transition-all relative">
                        <div className="absolute inset-0 bg-[#00d4ff] opacity-40 blur-xs rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pane 4: Flexible Checkouts */}
                <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <span className="text-[11px] font-semibold text-[#888888] tracking-wider uppercase font-mono">Payment Options</span>
                    <span className="bg-[#33d17a]/15 text-[#33d17a] text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono">Razorpay Secured</span>
                  </div>
                  <div className="space-y-2.5 font-sans">
                    <div className="flex items-center space-x-3 bg-[#0f0f0f] border border-[#0007cd]/30 p-2.5 rounded-lg">
                      <div className="w-5 h-5 rounded bg-[#0007cd]/10 border border-[#0007cd]/30 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#00d4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Online Checkout</div>
                        <div className="text-[9px] text-[#a8a8a8]">Pay instantly via Credit Card, UPI, or Wallet</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-[#0f0f0f] border border-[#222222] p-2.5 rounded-lg">
                      <div className="w-5 h-5 rounded bg-[#222222] border border-[#333333] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#a8a8a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Pay at End</div>
                        <div className="text-[9px] text-[#a8a8a8]">Add orders to tab; settle with staff before leaving</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-[#0f0f0f] border border-[#222222] p-2.5 rounded-lg">
                      <div className="w-5 h-5 rounded bg-[#222222] border border-[#333333] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#a8a8a8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">Cash at Counter</div>
                        <div className="text-[9px] text-[#a8a8a8]">Order digitally, settle via cash at the register</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#0f0f0f] border-t border-[#222222] px-6 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold tracking-widest text-[#00d4ff] uppercase">Frictionless Flow</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Self-Serve Dining in 4 Simple Steps
            </h2>
            <p className="text-[#a8a8a8] text-sm md:text-base max-w-xl mx-auto">
              Koyo works entirely on the mobile web. Your customers don't need to sign up, download any apps, or wait for service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 space-y-5 flex flex-col justify-between hover:border-[#0007cd]/30 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#222222] border border-[#333333] rounded-lg flex items-center justify-center text-[#0007cd] group-hover:text-[#00d4ff] transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                    <path d="M9 6h6M9 10h6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">1. Scan Table QR</h3>
                  <p className="text-xs text-[#a8a8a8] leading-relaxed">
                    Guest scans a unique QR code at their dining table using their smartphone camera. No app store downloads required.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#666666] uppercase font-mono tracking-wider pt-2">Step 01</span>
            </div>

            {/* Step 2 */}
            <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 space-y-5 flex flex-col justify-between hover:border-[#0007cd]/30 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#222222] border border-[#333333] rounded-lg flex items-center justify-center text-[#0007cd] group-hover:text-[#00d4ff] transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1H20v21" />
                    <path d="M9 6h6M9 10h6M9 14h6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">2. Browse Menu</h3>
                  <p className="text-xs text-[#a8a8a8] leading-relaxed">
                    Interactive, beautiful digital menu with food photography, categories, custom modifiers, and allergy warnings load instantly.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#666666] uppercase font-mono tracking-wider pt-2">Step 02</span>
            </div>

            {/* Step 3 */}
            <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 space-y-5 flex flex-col justify-between hover:border-[#0007cd]/30 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#222222] border border-[#333333] rounded-lg flex items-center justify-center text-[#0007cd] group-hover:text-[#00d4ff] transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">3. Place Order</h3>
                  <p className="text-xs text-[#a8a8a8] leading-relaxed">
                    Items are submitted with one tap. Orders print or display in real-time on the kitchen dashboard with precise table identification.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#666666] uppercase font-mono tracking-wider pt-2">Step 03</span>
            </div>

            {/* Step 4 */}
            <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 space-y-5 flex flex-col justify-between hover:border-[#0007cd]/30 transition-colors group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#222222] border border-[#333333] rounded-lg flex items-center justify-center text-[#0007cd] group-hover:text-[#00d4ff] transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">4. Pay However You Like</h3>
                  <p className="text-xs text-[#a8a8a8] leading-relaxed">
                    Settle check with online payment gateway integration immediately, order tabs at end of dining, or pay cash at the register.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#666666] uppercase font-mono tracking-wider pt-2">Step 04</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section */}
      <section id="benefits" className="py-24 bg-[#0f0f0f] border-t border-[#222222] px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold tracking-widest text-[#00d4ff] uppercase">Built for Growth</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Why Restaurants Choose Koyo
            </h2>
            <p className="text-[#a8a8a8] text-sm md:text-base max-w-xl mx-auto">
              We focus on dining floor efficiency and cost control, cutting out hardware leases and hefty percentage commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Benefit 1 */}
            <div className="bg-[#181818] border border-[#222222] p-6 rounded-xl flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-[#33d17a] shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">No Per-Order Commissions</h3>
                <p className="text-sm text-[#a8a8a8] leading-relaxed">
                  Unlike delivery applications that swallow 15–30% of order totals, Koyo operates on a flat, predictable subscription model.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="bg-[#181818] border border-[#222222] p-6 rounded-xl flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-[#00d4ff] shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Cheaper than Traditional POS Systems</h3>
                <p className="text-sm text-[#a8a8a8] leading-relaxed">
                  Stop buying and repairing proprietary terminals. Guests utilize their own hardware, cutting infrastructure overhead by up to 80%.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="bg-[#181818] border border-[#222222] p-6 rounded-xl flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-[#0007cd] shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Real-Time Kitchen Sync</h3>
                <p className="text-sm text-[#a8a8a8] leading-relaxed">
                  Orders print automatically or populate in the live kitchen feed within milliseconds of customer checkout, eliminating wait times.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="bg-[#181818] border border-[#222222] p-6 rounded-xl flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-[#7b3aed] shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Flexible Payment Options</h3>
                <p className="text-sm text-[#a8a8a8] leading-relaxed">
                  Allow online digital payments now, tabs settled at the end of meals, or traditional cash payouts directly at your register.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Demo / Contact Form Section */}
      <section id="demo" className="py-24 bg-[#0f0f0f] border-t border-[#222222] px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0007cd]/5 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="max-w-xl mx-auto relative z-10 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Ready to Upgrade?
            </h2>
            <p className="text-[#a8a8a8] text-sm md:text-base leading-relaxed">
              Fill in your details below. Our restaurant onboarding specialists will reach out within 24 hours to schedule a live demo.
            </p>
          </div>

          <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 md:p-8 shadow-xl">
            {formSubmitted ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-16 h-16 rounded-full bg-[#33d17a]/15 border border-[#33d17a]/30 flex items-center justify-center mx-auto text-[#33d17a]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Demo Requested Successfully!</h3>
                  <p className="text-xs text-[#a8a8a8] leading-relaxed max-w-sm mx-auto">
                    Thanks for reaching out, <span className="text-white font-bold">{formData.name}</span>. We've sent a confirmation to <span className="text-[#00d4ff] font-semibold">{formData.email}</span>. A specialist will call you at <span className="text-white">{formData.phone}</span> shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-[#222222] border border-[#333333] hover:bg-[#333333] text-white text-xs font-semibold px-4.5 py-2.5 rounded-md transition-colors"
                >
                  Request another Demo
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-[#a8a8a8]">
                      Your Name <span className="text-[#ff4d4d]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className={`w-full bg-[#0f0f0f] text-white text-sm border ${formErrors.name ? 'border-[#ff4d4d]' : 'border-[#222222]'} focus:border-[#0007cd] rounded-md px-3.5 py-2.5 outline-none transition-all placeholder-[#666666]`}
                    />
                    {formErrors.name && (
                      <span className="text-[10px] text-[#ff4d4d] block">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="restaurantName" className="text-xs font-semibold text-[#a8a8a8]">
                      Restaurant Name <span className="text-[#ff4d4d]">*</span>
                    </label>
                    <input
                      type="text"
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleInputChange}
                      placeholder="The Koyo Bistro"
                      className={`w-full bg-[#0f0f0f] text-white text-sm border ${formErrors.restaurantName ? 'border-[#ff4d4d]' : 'border-[#222222]'} focus:border-[#0007cd] rounded-md px-3.5 py-2.5 outline-none transition-all placeholder-[#666666]`}
                    />
                    {formErrors.restaurantName && (
                      <span className="text-[10px] text-[#ff4d4d] block">{formErrors.restaurantName}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-[#a8a8a8]">
                      Email Address <span className="text-[#ff4d4d]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="jane@restaurant.com"
                      className={`w-full bg-[#0f0f0f] text-white text-sm border ${formErrors.email ? 'border-[#ff4d4d]' : 'border-[#222222]'} focus:border-[#0007cd] rounded-md px-3.5 py-2.5 outline-none transition-all placeholder-[#666666]`}
                    />
                    {formErrors.email && (
                      <span className="text-[10px] text-[#ff4d4d] block">{formErrors.email}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-semibold text-[#a8a8a8]">
                      Phone Number <span className="text-[#ff4d4d]">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className={`w-full bg-[#0f0f0f] text-white text-sm border ${formErrors.phone ? 'border-[#ff4d4d]' : 'border-[#222222]'} focus:border-[#0007cd] rounded-md px-3.5 py-2.5 outline-none transition-all placeholder-[#666666]`}
                    />
                    {formErrors.phone && (
                      <span className="text-[10px] text-[#ff4d4d] block">{formErrors.phone}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-semibold text-[#a8a8a8]">
                    Additional Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your tables, average traffic, or integrations..."
                    className="w-full bg-[#0f0f0f] text-white text-sm border border-[#222222] focus:border-[#0007cd] rounded-md px-3.5 py-2.5 outline-none transition-all placeholder-[#666666] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0007cd] hover:bg-[#0005a3] text-white font-semibold rounded-md py-3 text-sm transition-all shadow-md shadow-[#0007cd]/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Demo Request</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto bg-[#0f0f0f] border-t border-[#222222] py-12 md:py-16 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#222222] flex items-center justify-center relative shadow-inner">
                <svg className="w-4.5 h-4.5 text-[#0007cd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" stroke="#0007cd" strokeWidth="2.5" fill="none" />
                  <path d="M9 7v10M15 7l-4.5 5 4.5 5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Koyo
              </span>
            </Link>
            <p className="text-xs text-[#a8a8a8] leading-relaxed">
              Premium self-serve QR ordering & payment infrastructure for modern restaurants. Designed to replace overpriced legacy POS terminals.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
              <ul className="space-y-2 text-xs text-[#a8a8a8]">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Why Choose Us</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Book a Demo</a></li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Portals</h4>
              <ul className="space-y-2 text-xs text-[#a8a8a8]">
                <li><Link href="/dashboard/login" className="hover:text-white transition-colors">Staff Dashboard</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Super-Admin Console</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5 col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Legal</h4>
              <ul className="space-y-2 text-xs text-[#a8a8a8]">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#666666] gap-4">
          <p>&copy; 2026 Koyo QR Ordering. All rights reserved.</p>
          <p>Made with &hearts; for modern gastronomy</p>
        </div>
      </footer>

    </main>
  )
}
