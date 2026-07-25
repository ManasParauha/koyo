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
      <main className="min-h-screen bg-canvas-parchment flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-hairline border-t-primary animate-spin" />
          <p className="text-xs font-semibold tracking-widest text-ink-muted-48 uppercase">Loading Koyo…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col font-sans overflow-x-hidden selection:bg-primary/20 selection:text-ink relative">
      
      {/* 1. Global Nav (Black Bar) */}
      <div className="sticky top-0 z-50 w-full h-[44px] bg-surface-black text-on-dark/80 text-[12px] font-sans font-normal select-none">
        <div className="max-w-[980px] mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-1.5 hover:text-white transition-colors group">
            <svg className="w-3.5 h-3.5 text-primary group-hover:text-primary-on-dark transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <path d="M9 7v10M15 7l-4.5 5 4.5 5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-semibold text-white tracking-tight">Koyo</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-[20px] text-on-dark/60">
            <a href="#how-it-works" className="hover:text-white transition-colors">Platform</a>
            <a href="#benefits" className="hover:text-white transition-colors">Solutions</a>
            <a href="#demo" className="hover:text-white transition-colors">Contact</a>
            <span className="text-white/10">|</span>
            <Link href="/dashboard/login" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Staff Portal</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>

          <div className="md:hidden flex items-center">
            <Link href="/dashboard/login" className="hover:text-white transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Sub Nav (Frosted Glass Bar) */}
      <nav className="sticky top-[44px] z-40 w-full h-[52px] bg-canvas-parchment/80 backdrop-blur-md border-b border-hairline select-none">
        <div className="max-w-[980px] mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="text-[21px] font-semibold tracking-tagline text-ink font-display">
            Koyo
          </Link>

          <div className="flex items-center space-x-6 text-[14px]">
            <nav className="hidden sm:flex items-center space-x-6 text-ink-muted-80 font-normal">
              <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
              <a href="#benefits" className="hover:text-primary transition-colors">Why Choose Us</a>
            </nav>
            <a 
              href="#demo" 
              className="bg-primary hover:bg-primary-focus active:scale-95 text-white font-sans text-[12px] font-normal px-4 py-1.5 rounded-pill transition-all duration-100 ease-out inline-flex items-center justify-center"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </nav>      {/* 2. Hero Section */}
      <section className="relative bg-canvas-parchment pt-16 pb-24 md:pt-24 md:pb-32 px-6 overflow-hidden border-b border-hairline">
        
        <div className="max-w-[980px] w-full mx-auto text-center space-y-12 relative z-10">
          <div className="max-w-[760px] w-full mx-auto space-y-6">
            <div className="inline-flex items-center space-x-1.5 bg-surface-pearl border border-hairline px-3.5 py-1.5 rounded-pill text-[12px] font-medium text-ink-muted-80">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" aria-hidden="true" />
              <span>Ditch Overpriced POS Hardware</span>
            </div>
            <h1 className="text-[34px] sm:text-[40px] md:text-[56px] font-semibold leading-[1.07] tracking-tight-display text-ink font-display text-balance">
              Run Your Dining Floor <br />
              <span className="text-primary">on Frictionless QR.</span>
            </h1>
            <p className="text-ink-muted-80 text-[17px] sm:text-[21px] md:text-[24px] font-light leading-[1.47] tracking-apple-tight max-w-[640px] mx-auto text-balance">
              Empower guests to scan, order, and pay instantly at their table&mdash;via card, cash at counter, or at the end of their meal. Zero waiter bottlenecks, zero hardware fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#demo" 
              className="w-full sm:w-auto text-center bg-primary hover:bg-primary-focus active:scale-95 text-white text-[17px] font-normal px-6 py-3 rounded-pill transition-all duration-100 ease-out inline-flex items-center justify-center"
            >
              Book a Demo
            </a>
            <Link 
              href="/dashboard/login" 
              className="w-full sm:w-auto text-center bg-canvas text-primary border border-hairline hover:bg-surface-pearl active:scale-95 text-[17px] font-normal px-6 py-3 rounded-pill transition-all duration-100 ease-out inline-flex items-center justify-center"
            >
              Staff Dashboard
            </Link>
          </div>

          {/* Premium Visual Mockup (2x2 Grid representing customer and staff dashboard functionality) */}
          <div className="max-w-[920px] mx-auto pt-8">
            <div className="bg-canvas border border-hairline rounded-lg p-5 md:p-8 shadow-product relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Pane 1: Customer PWA Interface */}
                <div className="bg-canvas-parchment border border-hairline rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <div className="flex items-center space-x-1.5" aria-hidden="true">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffb82b]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#33d17a]" />
                    </div>
                    <span className="text-[11px] font-semibold text-ink-muted-48 tracking-wider uppercase font-mono">Table 4 Menu</span>
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="bg-canvas border border-hairline p-3.5 rounded-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-[14px] font-semibold text-ink leading-tight">Classic Smash Burger</h4>
                        <p className="text-[12px] text-ink-muted-48 leading-tight">$12.50 &bull; Double beef, cheddar, house sauce</p>
                      </div>
                      <button className="bg-primary text-[12px] text-white font-medium px-3 py-1 rounded-sm hover:bg-primary-focus active:scale-95 transition-all duration-100 ease-out">
                        + Add
                      </button>
                    </div>
                    <div className="bg-canvas border border-hairline p-3.5 rounded-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-[14px] font-semibold text-ink leading-tight">Truffle Parmesan Fries</h4>
                        <p className="text-[12px] text-ink-muted-48 leading-tight">$6.00 &bull; Grated parm, truffle oil, parsley</p>
                      </div>
                      <button className="bg-primary text-[12px] text-white font-medium px-3 py-1 rounded-sm hover:bg-primary-focus active:scale-95 transition-all duration-100 ease-out">
                        + Add
                      </button>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-[14px] border-t border-hairline">
                      <span className="text-ink-muted-80 font-normal">Cart Subtotal (2 items)</span>
                      <span className="font-semibold text-ink">$18.50</span>
                    </div>
                  </div>
                </div>

                {/* Pane 2: Live Kitchen Dashboard (Dark Theme for contrast) */}
                <div className="bg-surface-tile-1 border border-hairline/10 rounded-lg p-5 space-y-4 text-on-dark">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-on-dark animate-pulse" />
                      <span className="text-[11px] text-body-muted font-mono tracking-wider">LIVE KITCHEN FEED</span>
                    </div>
                    <span className="text-[11px] font-semibold text-primary-on-dark uppercase font-mono">3 Active Tickets</span>
                  </div>
                  <div className="space-y-2.5 font-mono text-[12px] text-body-muted">
                    <div className="bg-surface-tile-3 border-l-2 border-primary-on-dark p-3 rounded-sm space-y-1.5">
                      <div className="flex justify-between text-white font-semibold">
                        <span>TICKET #042 (Table 4)</span>
                        <span className="text-primary-on-dark">2m ago</span>
                      </div>
                      <div className="text-white text-[11px]">
                        1x Classic Smash Burger <span className="text-body-muted/70">[Medium Rare]</span>
                        <br />
                        1x Truffle Parmesan Fries
                      </div>
                      <div className="text-[10px] text-body-muted/60">Status: Preparing</div>
                    </div>
                    <div className="bg-surface-tile-3 border-l-2 border-white/10 p-3 rounded-sm opacity-60">
                      <div className="flex justify-between font-semibold">
                        <span>TICKET #041 (Table 12)</span>
                        <span>12m ago</span>
                      </div>
                      <div className="text-[11px]">
                        2x Spicy Miso Ramen
                      </div>
                      <div className="text-[10px] text-[#33d17a]">Status: Ready to Serve</div>
                    </div>
                  </div>
                </div>

                {/* Pane 3: Restaurant Analytics */}
                <div className="bg-canvas-parchment border border-hairline rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <span className="text-[11px] font-semibold text-ink-muted-80 tracking-wider uppercase font-mono">Today’s Performance</span>
                    <span className="text-[11px] text-primary font-semibold">+18.4% vs last Friday</span>
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-canvas border border-hairline p-3 rounded-sm">
                        <div className="text-[10px] text-ink-muted-48 uppercase tracking-wider">Gross Sales</div>
                        <div className="text-[18px] font-semibold text-ink">$4,250.00</div>
                      </div>
                      <div className="bg-canvas border border-hairline p-3 rounded-sm">
                        <div className="text-[10px] text-ink-muted-48 uppercase tracking-wider">Total Orders</div>
                        <div className="text-[18px] font-semibold text-ink">134</div>
                      </div>
                    </div>
                    {/* Visual SVGs simulating growth graph */}
                    <div className="h-12 bg-canvas border border-hairline rounded-sm p-2 flex items-end space-x-1.5">
                      <div className="bg-ink-muted-48/10 hover:bg-ink-muted-48/20 w-full h-[30%] rounded-xs transition-all duration-100" />
                      <div className="bg-ink-muted-48/10 hover:bg-ink-muted-48/20 w-full h-[45%] rounded-xs transition-all duration-100" />
                      <div className="bg-ink-muted-48/10 hover:bg-ink-muted-48/20 w-full h-[40%] rounded-xs transition-all duration-100" />
                      <div className="bg-ink-muted-48/10 hover:bg-ink-muted-48/20 w-full h-[60%] rounded-xs transition-all duration-100" />
                      <div className="bg-ink-muted-48/10 hover:bg-ink-muted-48/20 w-full h-[55%] rounded-xs transition-all duration-100" />
                      <div className="bg-primary w-full h-[85%] rounded-xs transition-all duration-100 relative">
                        <div className="absolute inset-0 bg-primary-on-dark opacity-35 blur-xs rounded-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pane 4: Flexible Checkouts */}
                <div className="bg-canvas-parchment border border-hairline rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <span className="text-[11px] font-semibold text-ink-muted-80 tracking-wider uppercase font-mono">Payment Options</span>
                    <span className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-pill font-sans">Razorpay Secured</span>
                  </div>
                  <div className="space-y-2.5 font-sans">
                    <div className="flex items-center space-x-3 bg-canvas border border-primary/20 p-2.5 rounded-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink">Online Checkout</div>
                        <div className="text-[10px] text-ink-muted-48 truncate">Pay instantly via Credit Card, UPI, or Wallet</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-canvas border border-hairline p-2.5 rounded-sm">
                      <div className="w-5 h-5 rounded-full bg-hairline/30 flex items-center justify-center shrink-0" aria-hidden="true">
                        <div className="w-1.5 h-1.5 rounded-full bg-ink-muted-48" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink">Pay at End</div>
                        <div className="text-[10px] text-ink-muted-48 truncate">Add orders to tab; settle with staff before leaving</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-canvas border border-hairline p-2.5 rounded-sm">
                      <div className="w-5 h-5 rounded-full bg-hairline/30 flex items-center justify-center shrink-0" aria-hidden="true">
                        <div className="w-1.5 h-1.5 rounded-full bg-ink-muted-48" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink">Cash at Counter</div>
                        <div className="text-[10px] text-ink-muted-48 truncate">Order digitally, settle via cash at the register</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section (Dark Canvas) */}
      <section id="how-it-works" className="py-24 bg-surface-tile-1 px-6 relative border-b border-white/5">
        <div className="max-w-[980px] mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[12px] font-semibold tracking-tagline text-primary-on-dark uppercase">Frictionless Flow</span>
            <h2 className="text-[34px] sm:text-[40px] font-semibold leading-[1.10] tracking-tight text-white font-display text-balance">
              Self-Serve Dining in 4 Simple Steps
            </h2>
            <p className="text-body-muted text-[17px] font-light leading-[1.47] max-w-[640px] mx-auto text-balance">
              Koyo works entirely on the mobile web. Your customers don’t need to sign up, download any apps, or wait for service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-surface-tile-2 border border-white/5 rounded-lg p-6 space-y-5 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-surface-tile-3 rounded-sm flex items-center justify-center text-primary-on-dark" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                    <path d="M9 6h6M9 10h6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-white font-display">1. Scan Table QR</h3>
                  <p className="text-[14px] text-body-muted leading-relaxed font-light">
                    Guest scans a unique QR code at their dining table using their smartphone camera. No app store downloads required.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-body-muted/40 uppercase font-mono tracking-wider pt-2">Step 01</span>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-tile-2 border border-white/5 rounded-lg p-6 space-y-5 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-surface-tile-3 rounded-sm flex items-center justify-center text-primary-on-dark" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1H20v21" />
                    <path d="M9 6h6M9 10h6M9 14h6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-white font-display">2. Browse Menu</h3>
                  <p className="text-[14px] text-body-muted leading-relaxed font-light">
                    Interactive, beautiful digital menu with food photography, categories, custom modifiers, and allergy warnings load instantly.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-body-muted/40 uppercase font-mono tracking-wider pt-2">Step 02</span>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-tile-2 border border-white/5 rounded-lg p-6 space-y-5 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-surface-tile-3 rounded-sm flex items-center justify-center text-primary-on-dark" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-white font-display">3. Place Order</h3>
                  <p className="text-[14px] text-body-muted leading-relaxed font-light">
                    Items are submitted with one tap. Orders print or display in real-time on the kitchen dashboard with precise table identification.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-body-muted/40 uppercase font-mono tracking-wider pt-2">Step 03</span>
            </div>

            {/* Step 4 */}
            <div className="bg-surface-tile-2 border border-white/5 rounded-lg p-6 space-y-5 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-surface-tile-3 rounded-sm flex items-center justify-center text-primary-on-dark" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-white font-display">4. Pay However You Like</h3>
                  <p className="text-[14px] text-body-muted leading-relaxed font-light">
                    Settle check with online payment gateway integration immediately, order tabs at end of dining, or pay cash at the register.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-body-muted/40 uppercase font-mono tracking-wider pt-2">Step 04</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section (Light Canvas) */}
      <section id="benefits" className="py-24 bg-canvas px-6 border-b border-hairline">
        <div className="max-w-[980px] mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-[12px] font-semibold tracking-tagline text-primary uppercase">Built for Growth</span>
            <h2 className="text-[34px] sm:text-[40px] font-semibold leading-[1.10] tracking-tight text-ink font-display text-balance">
              Why Restaurants Choose Koyo
            </h2>
            <p className="text-ink-muted-80 text-[17px] font-light leading-[1.47] max-w-[640px] mx-auto text-balance">
              We focus on dining floor efficiency and cost control, cutting out hardware leases and hefty percentage commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Benefit 1 */}
            <div className="bg-canvas border border-hairline p-6 rounded-lg flex items-start space-x-5 shadow-sm/5">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-semibold text-ink font-display">No Per-Order Commissions</h3>
                <p className="text-[14px] text-ink-muted-80 font-light leading-relaxed">
                  Unlike delivery applications that swallow 15&ndash;30% of order totals, Koyo operates on a flat, predictable subscription model.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="bg-canvas border border-hairline p-6 rounded-lg flex items-start space-x-5 shadow-sm/5">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-semibold text-ink font-display">Cheaper than Traditional POS</h3>
                <p className="text-[14px] text-ink-muted-80 font-light leading-relaxed">
                  Stop buying and repairing proprietary terminals. Guests utilize their own hardware, cutting infrastructure overhead by up to 80%.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="bg-canvas border border-hairline p-6 rounded-lg flex items-start space-x-5 shadow-sm/5">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-semibold text-ink font-display">Real-Time Kitchen Sync</h3>
                <p className="text-[14px] text-ink-muted-80 font-light leading-relaxed">
                  Orders print automatically or populate in the live kitchen feed within milliseconds of customer checkout, eliminating wait times.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="bg-canvas border border-hairline p-6 rounded-lg flex items-start space-x-5 shadow-sm/5">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary shrink-0" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-semibold text-ink font-display">Flexible Payment Options</h3>
                <p className="text-[14px] text-ink-muted-80 font-light leading-relaxed">
                  Allow online digital payments now, tabs settled at the end of meals, or traditional cash payouts directly at your register.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Demo / Contact Form Section (Parchment Canvas) */}
      <section id="demo" className="py-24 bg-canvas-parchment px-6 relative border-b border-hairline">
        
        <div className="max-w-xl w-full mx-auto relative z-10 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-[34px] sm:text-[40px] font-semibold tracking-tight text-ink font-display text-balance">
              Ready to Upgrade?
            </h2>
            <p className="text-ink-muted-80 text-[17px] font-light leading-[1.47] text-balance">
              Fill in your details below. Our restaurant onboarding specialists will reach out within 24 hours to schedule a live demo.
            </p>
          </div>

          <div className="bg-canvas border border-hairline rounded-lg p-6 md:p-8 shadow-sm/5">
            {formSubmitted ? (
              <div className="text-center py-10 space-y-5" aria-live="polite">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary" aria-hidden="true">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[21px] font-semibold text-ink font-display">Demo Requested Successfully!</h3>
                  <p className="text-[14px] text-ink-muted-80 font-light leading-relaxed max-w-sm mx-auto">
                    Thanks for reaching out, <span className="text-ink font-semibold">{formData.name}</span>. We’ve sent a confirmation to <span className="text-primary font-semibold">{formData.email}</span>. A specialist will call you at <span className="text-ink font-semibold">{formData.phone}</span> shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-canvas border border-hairline hover:bg-surface-pearl text-ink text-[14px] font-medium px-4 py-2 rounded-sm transition-all active:scale-95 duration-100 ease-out"
                >
                  Request another Demo
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-[12px] font-semibold text-ink-muted-80">
                      Your Name <span className="text-[#bf1d27]" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Jane Doe…"
                      autoComplete="name"
                      className={`w-full bg-canvas text-ink text-[14px] border ${formErrors.name ? 'border-[#bf1d27]' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary-focus focus-visible:border-primary-focus rounded-sm px-3.5 py-2.5 outline-none transition-all placeholder-ink-muted-48`}
                    />
                    {formErrors.name && (
                      <span className="text-[11px] text-[#bf1d27] block" aria-live="assertive">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="restaurantName" className="text-[12px] font-semibold text-ink-muted-80">
                      Restaurant Name <span className="text-[#bf1d27]" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleInputChange}
                      placeholder="e.g. The Koyo Bistro…"
                      autoComplete="off"
                      className={`w-full bg-canvas text-ink text-[14px] border ${formErrors.restaurantName ? 'border-[#bf1d27]' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary-focus focus-visible:border-primary-focus rounded-sm px-3.5 py-2.5 outline-none transition-all placeholder-ink-muted-48`}
                    />
                    {formErrors.restaurantName && (
                      <span className="text-[11px] text-[#bf1d27] block" aria-live="assertive">{formErrors.restaurantName}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[12px] font-semibold text-ink-muted-80">
                      Email Address <span className="text-[#bf1d27]" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. jane@restaurant.com…"
                      autoComplete="email"
                      spellCheck={false}
                      className={`w-full bg-canvas text-ink text-[14px] border ${formErrors.email ? 'border-[#bf1d27]' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary-focus focus-visible:border-primary-focus rounded-sm px-3.5 py-2.5 outline-none transition-all placeholder-ink-muted-48`}
                    />
                    {formErrors.email && (
                      <span className="text-[11px] text-[#bf1d27] block" aria-live="assertive">{formErrors.email}</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-[12px] font-semibold text-ink-muted-80">
                      Phone Number <span className="text-[#bf1d27]" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 98765 43210…"
                      autoComplete="tel"
                      className={`w-full bg-canvas text-ink text-[14px] border ${formErrors.phone ? 'border-[#bf1d27]' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary-focus focus-visible:border-primary-focus rounded-sm px-3.5 py-2.5 outline-none transition-all placeholder-ink-muted-48`}
                    />
                    {formErrors.phone && (
                      <span className="text-[11px] text-[#bf1d27] block" aria-live="assertive">{formErrors.phone}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-[12px] font-semibold text-ink-muted-80">
                    Additional Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="e.g. Tell us about your tables, average traffic, or integrations…"
                    autoComplete="off"
                    className="w-full bg-canvas text-ink text-[14px] border border-hairline focus-visible:ring-1 focus-visible:ring-primary-focus focus-visible:border-primary-focus rounded-sm px-3.5 py-2.5 outline-none transition-all placeholder-ink-muted-48 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-focus active:scale-95 text-white font-medium rounded-pill py-3 text-[17px] transition-all duration-100 ease-out flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting…</span>
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
      <footer className="mt-auto bg-canvas-parchment py-16 px-6 relative z-10 border-t border-hairline">
        <div className="max-w-[980px] mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="flex items-center space-x-1.5 text-ink hover:text-primary transition-colors group">
              <svg className="w-4 h-4 text-primary group-hover:text-primary-focus transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <path d="M9 7v10M15 7l-4.5 5 4.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-semibold text-ink tracking-tight font-display text-[17px]">Koyo</span>
            </Link>
            <p className="text-[12px] font-light leading-relaxed text-ink-muted-80">
              Premium self-serve QR ordering &amp; payment infrastructure for modern restaurants. Designed to replace overpriced legacy POS terminals.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div className="space-y-3.5">
              <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-ink font-sans uppercase">Platform</h4>
              <ul className="text-[17px] font-normal leading-[2.41] text-ink-muted-80">
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a></li>
                <li><a href="#benefits" className="hover:text-primary transition-colors">Why Choose Us</a></li>
                <li><a href="#demo" className="hover:text-primary transition-colors">Book a Demo</a></li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-ink font-sans uppercase">Portals</h4>
              <ul className="text-[17px] font-normal leading-[2.41] text-ink-muted-80">
                <li><Link href="/dashboard/login" className="hover:text-primary transition-colors">Staff Dashboard</Link></li>
                <li><Link href="/admin" className="hover:text-primary transition-colors">Super-Admin Console</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5 col-span-2 sm:col-span-1">
              <h4 className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-ink font-sans uppercase">Legal</h4>
              <ul className="text-[17px] font-normal leading-[2.41] text-ink-muted-80">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="max-w-[980px] mx-auto mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between text-[12px] font-normal leading-none text-ink-muted-48 gap-4">
          <p>&copy; 2026 Koyo QR Ordering. All rights reserved.</p>
          <p>Made with &hearts; for modern gastronomy</p>
        </div>
      </footer>

    </main>
  )
}
