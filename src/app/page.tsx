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
      // Focus first error field for accessibility
      const firstErrorKey = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorKey)
      if (element) {
        element.focus()
      }
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
      <main className="min-h-screen bg-canvas flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-hairline border-t-primary animate-spin" />
          <p className="text-xs font-semibold tracking-widest text-ink-subtle uppercase">Loading Koyo…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col font-sans overflow-x-hidden selection:bg-primary/20 selection:text-ink relative scroll-smooth" id="main-content">
      
      {/* Skip to Main Content Link for Accessibility */}
      <a href="#hero-section" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50 transition-[transform] active:scale-95 duration-100 font-medium text-[13px]">
        Skip to main content
      </a>

      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 w-full h-14 bg-canvas/80 backdrop-blur-md border-b border-hairline select-none">
        <div className="max-w-[980px] mx-auto h-full px-6 flex justify-between md:grid md:grid-cols-3 items-center">
          <Link href="/" className="flex items-center text-ink hover:text-primary transition-colors duration-150 group justify-self-start" aria-label="Koyo Home">
            <span className="font-semibold text-ink tracking-display-md text-[18px] font-display">Koyo</span>
          </Link>

          <nav className="hidden md:flex items-center justify-center space-x-6 text-[14px]">
            <a href="#how-it-works" className="text-ink-subtle hover:text-ink transition-colors duration-150 font-medium">Platform</a>
            <a href="#benefits" className="text-ink-subtle hover:text-ink transition-colors duration-150 font-medium">Solutions</a>
            <a href="#demo" className="text-ink-subtle hover:text-ink transition-colors duration-150 font-medium">Contact</a>
          </nav>

          <div className="flex items-center justify-end space-x-3 justify-self-end">
            <Link 
              href="/dashboard/login" 
              className="text-[13px] font-medium text-ink bg-surface-1 hover:bg-surface-2 border border-hairline rounded-md px-3.5 py-1.5 transition-[background-color,transform] active:scale-95 duration-100 ease-out focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
            >
              Staff Portal
            </Link>
            <a 
              href="#demo" 
              className="text-[13px] font-medium text-white bg-primary hover:bg-primary-hover active:bg-primary-focus rounded-md px-4 py-1.5 transition-[background-color,transform] active:scale-95 duration-100 ease-out focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero-section" className="relative bg-canvas pt-16 pb-24 md:pt-24 md:pb-32 px-6 overflow-hidden border-b border-hairline">
        <div className="max-w-[980px] w-full mx-auto text-center space-y-12 relative z-10">
          <div className="max-w-[760px] w-full mx-auto space-y-6">
            <a 
              href="#how-it-works"
              className="inline-flex items-center gap-1.5 sm:gap-2.5 p-1 pr-2.5 sm:pr-3.5 max-w-full bg-surface-1/90 hover:bg-surface-2 border border-hairline hover:border-primary/40 rounded-pill transition-all duration-200 group shadow-[0_2px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_4px_20px_rgba(94,106,210,0.18)] outline-none focus-visible:ring-1 focus-visible:ring-primary/50 text-left"
            >
              <span className="shrink-0 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 bg-primary/10 text-primary border border-primary/20 px-1.5 sm:px-2.5 py-0.5 rounded-pill text-[9px] sm:text-[11px] font-semibold tracking-wide uppercase">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
                Hardware-Free
              </span>
              <span className="text-[10px] sm:text-[13px] font-medium text-ink-muted group-hover:text-ink transition-colors duration-150 whitespace-nowrap">
                <span className="hidden sm:inline">Ditch overpriced POS terminals &amp; hardware</span>
                <span className="sm:hidden">Ditch overpriced POS hardware</span>
              </span>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-ink-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <h1 className="text-[36px] sm:text-[48px] md:text-display-xl font-semibold leading-display-xl tracking-display-xl text-ink font-display text-balance">
              Run Your Dining Floor <br />
              <span className="text-primary">on Frictionless QR.</span>
            </h1>
            <p className="text-ink-muted text-[17px] sm:text-subhead font-normal leading-subhead tracking-subhead max-w-[640px] mx-auto text-balance">
              Empower guests to scan, order, and pay instantly at their table&mdash;via card, cash at counter, or at the end of their meal. Zero waiter bottlenecks, zero hardware fees.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto sm:max-w-none">
            <a 
              href="#demo" 
              className="w-full sm:w-auto text-center bg-primary hover:bg-primary-hover active:bg-primary-focus text-white text-[14px] font-medium px-6 py-3 rounded-md transition-[background-color,transform] active:scale-95 duration-100 ease-out inline-flex items-center justify-center focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
            >
              Book a Demo
            </a>
            <Link 
              href="/dashboard/login" 
              className="w-full sm:w-auto text-center bg-surface-1 hover:bg-surface-2 text-ink border border-hairline active:scale-95 text-[14px] font-medium px-6 py-3 rounded-md transition-[background-color,transform] active:scale-95 duration-100 ease-out inline-flex items-center justify-center focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
            >
              Staff Dashboard
            </Link>
          </div>

          {/* High-Fidelity Product UI Mockup Panel */}
          <div className="max-w-[920px] mx-auto pt-8">
            <div className="bg-surface-1 border border-hairline rounded-xl p-5 md:p-6 shadow-product shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Pane 1: Customer PWA Interface */}
                <div className="bg-surface-2 border border-hairline rounded-lg p-5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <div className="flex items-center space-x-1.5" aria-hidden="true">
                      <span className="w-2 h-2 rounded-full bg-hairline-strong" />
                      <span className="w-2 h-2 rounded-full bg-hairline-strong" />
                      <span className="w-2 h-2 rounded-full bg-hairline-strong" />
                    </div>
                    <span className="text-[11px] font-semibold text-ink-subtle tracking-eyebrow uppercase font-mono">Table 4 Menu</span>
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="bg-surface-3 border border-hairline p-3.5 rounded-md flex items-center justify-between gap-3 hover:border-hairline-strong transition-colors duration-150">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-[14px] font-semibold text-ink leading-tight">Paneer Butter Masala</h4>
                        <p className="text-[12px] text-ink-subtle leading-tight">₹250 &bull; Fresh cottage cheese, rich tomato cashew gravy</p>
                      </div>
                      <button 
                        type="button"
                        className="shrink-0 whitespace-nowrap bg-primary hover:bg-primary-hover active:bg-primary-focus text-[12px] text-white font-medium px-3 py-1.5 rounded-md transition-[background-color,transform] active:scale-95 duration-100 ease-out focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="bg-surface-3 border border-hairline p-3.5 rounded-md flex items-center justify-between gap-3 hover:border-hairline-strong transition-colors duration-150">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-[14px] font-semibold text-ink leading-tight">Butter Garlic Naan</h4>
                        <p className="text-[12px] text-ink-subtle leading-tight">₹120 &bull; Tandoor baked bread, garlic butter</p>
                      </div>
                      <button 
                        type="button"
                        className="shrink-0 whitespace-nowrap bg-primary hover:bg-primary-hover active:bg-primary-focus text-[12px] text-white font-medium px-3 py-1.5 rounded-md transition-[background-color,transform] active:scale-95 duration-100 ease-out focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-[14px] border-t border-hairline">
                      <span className="text-ink-subtle font-normal">Cart Subtotal (2 items)</span>
                      <span className="font-semibold text-ink">₹370</span>
                    </div>
                  </div>
                </div>

                {/* Pane 2: Live Kitchen Feed */}
                <div className="bg-surface-2 border border-hairline rounded-lg p-5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                      <span className="text-[11px] text-ink-subtle font-mono tracking-eyebrow uppercase font-semibold">LIVE KITCHEN FEED</span>
                    </div>
                    <span className="text-[11px] text-ink-subtle font-mono font-medium">3 Active</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Ticket #042 */}
                    <div className="bg-surface-3 border border-hairline p-3 rounded-md space-y-2 hover:border-hairline-strong transition-colors duration-150">
                      <div className="flex items-center justify-between font-mono text-[12px]">
                        <span className="font-semibold text-ink">#042 &bull; Table 4</span>
                        <span className="text-[11px] text-primary font-medium">2m ago</span>
                      </div>
                      <div className="text-[12px] text-ink-muted leading-tight space-y-1 font-sans">
                        <div>1&times; Paneer Butter Masala <span className="text-ink-subtle text-[11px] font-mono ml-1 font-normal">(Medium Spicy)</span></div>
                        <div>1&times; Butter Garlic Naan</div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-hairline/50 text-[11px] font-mono">
                        <span className="text-primary font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Preparing
                        </span>
                        <span className="text-ink-subtle font-sans text-[11px]">Paid &bull; ₹370</span>
                      </div>
                    </div>

                    {/* Ticket #041 */}
                    <div className="bg-surface-3 border border-hairline p-3 rounded-md space-y-2 hover:border-hairline-strong transition-colors duration-150">
                      <div className="flex items-center justify-between font-mono text-[12px]">
                        <span className="font-semibold text-ink-muted">#041 &bull; Table 12</span>
                        <span className="text-[11px] text-ink-subtle font-normal">12m ago</span>
                      </div>
                      <div className="text-[12px] text-ink-subtle leading-tight font-sans">
                        <div>2&times; Veg Dum Biryani</div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-hairline/50 text-[11px] font-mono">
                        <span className="text-semantic-success font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                          Ready to Serve
                        </span>
                        <span className="text-ink-subtle font-sans text-[11px]">Paid &bull; ₹480</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pane 3: Restaurant Analytics */}
                <div className="bg-surface-2 border border-hairline rounded-lg p-5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <span className="text-[11px] font-semibold text-ink-subtle tracking-eyebrow uppercase font-mono">Today’s Performance</span>
                    <span className="text-[11px] text-primary font-semibold font-sans">+18.4% vs last Friday</span>
                  </div>
                  <div className="space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-3 border border-hairline p-3 rounded-md">
                        <div className="text-[10px] text-ink-subtle uppercase tracking-eyebrow">Gross Sales</div>
                        <div className="text-[18px] font-semibold text-ink font-variant-numeric: tabular-nums">₹42,500.00</div>
                      </div>
                      <div className="bg-surface-3 border border-hairline p-3 rounded-md">
                        <div className="text-[10px] text-ink-subtle uppercase tracking-eyebrow">Total Orders</div>
                        <div className="text-[18px] font-semibold text-ink font-variant-numeric: tabular-nums">134</div>
                      </div>
                    </div>
                    {/* Visual graph simulated using CSS */}
                    <div className="h-12 bg-surface-3 border border-hairline rounded-md p-2 flex items-end space-x-1.5" aria-hidden="true">
                      <div className="bg-hairline w-full h-[30%] rounded-xs transition-colors duration-150 hover:bg-hairline-strong" />
                      <div className="bg-hairline w-full h-[45%] rounded-xs transition-colors duration-150 hover:bg-hairline-strong" />
                      <div className="bg-hairline w-full h-[40%] rounded-xs transition-colors duration-150 hover:bg-hairline-strong" />
                      <div className="bg-hairline w-full h-[60%] rounded-xs transition-colors duration-150 hover:bg-hairline-strong" />
                      <div className="bg-hairline w-full h-[55%] rounded-xs transition-colors duration-150 hover:bg-hairline-strong" />
                      <div className="bg-primary w-full h-[85%] rounded-xs relative group">
                        <div className="absolute inset-0 bg-white opacity-20 blur-xs rounded-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pane 4: Flexible Checkouts */}
                <div className="bg-surface-2 border border-hairline rounded-lg p-5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center justify-between pb-2 border-b border-hairline">
                    <span className="text-[11px] font-semibold text-ink-subtle tracking-eyebrow uppercase font-mono">Payment Options</span>
                    <span className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-pill">Razorpay Secured</span>
                  </div>
                  <div className="space-y-2.5 font-sans">
                    <div className="flex items-center space-x-3 bg-surface-3 border border-primary/30 p-2.5 rounded-md">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                        <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink">Online Checkout</div>
                        <div className="text-[10px] text-ink-subtle truncate">Pay instantly via Credit Card, UPI, or Wallet</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-surface-3 border border-hairline p-2.5 rounded-md hover:border-hairline-strong transition-colors duration-150">
                      <div className="w-5 h-5 rounded-full bg-surface-1 border border-hairline flex items-center justify-center shrink-0" aria-hidden="true">
                        <div className="w-1.5 h-1.5 rounded-full bg-ink-subtle" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink-muted">Pay at End</div>
                        <div className="text-[10px] text-ink-subtle truncate">Add orders to tab; settle with staff before leaving</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-surface-3 border border-hairline p-2.5 rounded-md hover:border-hairline-strong transition-colors duration-150">
                      <div className="w-5 h-5 rounded-full bg-surface-1 border border-hairline flex items-center justify-center shrink-0" aria-hidden="true">
                        <div className="w-1.5 h-1.5 rounded-full bg-ink-subtle" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-ink-muted">Cash at Counter</div>
                        <div className="text-[10px] text-ink-subtle truncate">Order digitally, settle via cash at the register</div>
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
      <section id="how-it-works" className="py-24 bg-canvas px-6 relative border-b border-hairline scroll-mt-14">
        <div className="max-w-[980px] mx-auto space-y-16">
          
          {/* Header Center Aligned with theme styling */}
          <div className="text-center space-y-3 max-w-[640px] mx-auto">
            <span className="text-[13px] font-semibold tracking-eyebrow text-primary uppercase">
              HOW IT WORKS
            </span>
            <h2 className="text-[34px] sm:text-display-lg font-semibold leading-display-lg tracking-display-lg text-ink font-display text-balance">
              Self-Serve Dining.<br />
              In 4 Simple Steps.
            </h2>
            <p className="text-ink-muted text-[17px] sm:text-body-lg font-normal leading-subhead text-balance">
              Koyo works entirely on the mobile web. Your customers don&rsquo;t need to sign up, download any apps, or wait for service.
            </p>
          </div>

          {/* 4 Step Cards Grid - Perfectly themed & constrained to max-w-[980px] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Step 01 */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 flex flex-col justify-between hover:bg-surface-2 hover:border-hairline-strong transition-[background-color,border-color] duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-subtle font-mono tracking-widest uppercase group-hover:text-primary transition-colors duration-150">01</span>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 group-hover:bg-primary/10 transition-colors duration-150" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                    <path d="M9 6h6M9 10h6" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-ink font-display">Scan Table QR</h3>
                  <p className="text-[14px] text-ink-muted leading-relaxed font-normal">
                    Guest scans a unique QR code at their dining table using their smartphone camera. No app store downloads required.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 flex flex-col justify-between hover:bg-surface-2 hover:border-hairline-strong transition-[background-color,border-color] duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-subtle font-mono tracking-widest uppercase group-hover:text-primary transition-colors duration-150">02</span>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 group-hover:bg-primary/10 transition-colors duration-150" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1H20v21" />
                    <path d="M9 6h6M9 10h6M9 14h6" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-ink font-display">Browse Menu</h3>
                  <p className="text-[14px] text-ink-muted leading-relaxed font-normal">
                    Interactive, beautiful digital menu with food photography, categories, modifiers, and allergy labels load instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 flex flex-col justify-between hover:bg-surface-2 hover:border-hairline-strong transition-[background-color,border-color] duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-subtle font-mono tracking-widest uppercase group-hover:text-primary transition-colors duration-150">03</span>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 group-hover:bg-primary/10 transition-colors duration-150" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-ink font-display">Place Order</h3>
                  <p className="text-[14px] text-ink-muted leading-relaxed font-normal">
                    Items are submitted with one tap. Orders print or display in real-time on the kitchen feed with precise table identifiers.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 flex flex-col justify-between hover:bg-surface-2 hover:border-hairline-strong transition-[background-color,border-color] duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-subtle font-mono tracking-widest uppercase group-hover:text-primary transition-colors duration-150">04</span>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-surface-2 border border-hairline flex items-center justify-center text-primary group-hover:border-primary/40 group-hover:bg-primary/10 transition-colors duration-150" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[17px] font-semibold text-ink font-display">Pay However You Like</h3>
                  <p className="text-[14px] text-ink-muted leading-relaxed font-normal">
                    Settle check with online payment gateway integration immediately, order tabs at end of dining, or pay cash at the register.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section - Reference Image Layout aligned with Koyo Design System */}
      <section id="benefits" className="py-24 bg-canvas px-6 border-b border-hairline scroll-mt-14 relative overflow-hidden">
        
        {/* Ambient Primary Glow Accent matching landing page */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-radial from-primary/10 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />

        <div className="max-w-[980px] mx-auto space-y-12 relative z-10">
          
          {/* Header matching landing page typography sizing & theme colors */}
          <div className="text-center space-y-3 max-w-[680px] mx-auto">
            <span className="text-[13px] font-semibold tracking-eyebrow text-primary uppercase">
              BUILT FOR GROWTH
            </span>
            
            <h2 className="text-[34px] sm:text-display-lg font-semibold leading-display-lg tracking-display-lg font-display text-balance">
              <span className="text-ink">Why Restaurants</span>{' '}
              <span className="text-ink-muted/50">Choose Koyo</span>
            </h2>

            <p className="text-ink-muted text-[17px] sm:text-body-lg font-normal leading-subhead max-w-[640px] mx-auto text-balance">
              We focus on dining floor efficiency and cost control, helping you avoid proprietary hardware leases and per-order fees.
            </p>
          </div>

          {/* Staggered Horizontal Bento Card Deck matching Reference Image with Full Un-truncated Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-4">
            
            {/* Card 1: Compact Leftmost Card ("neondatabase/neon" style) */}
            <div className="bg-surface-1 border border-hairline hover:border-primary/40 hover:bg-surface-2 rounded-xl p-5 h-[290px] flex flex-col justify-between relative overflow-hidden group transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(94,106,210,0.12)]">
              
              {/* Primary Lavender Matrix Backdrop Graphic */}
              <div className="h-[90px] w-full rounded-lg bg-surface-2 border border-hairline relative overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors shrink-0">
                
                {/* SVG Dot Matrix Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#5e6ad2_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

                {/* Central Glowing Icon Badge */}
                <div className="relative z-10 w-10 h-10 rounded-full bg-surface-3 border border-primary/40 flex items-center justify-center shadow-[0_0_18px_rgba(94,106,210,0.35)] group-hover:scale-105 transition-transform duration-200">
                  <span className="font-mono text-primary font-bold text-[15px]">0%</span>
                </div>
              </div>

              {/* Text Block - Full Content */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center text-[13px] font-mono font-medium text-ink group-hover:text-primary transition-colors">
                  <span>No Per-Order Commissions</span>
                  <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-[12px] text-ink-subtle font-normal leading-relaxed">
                  Koyo takes zero commission on your orders. Unlike traditional POS vendors that charge per-terminal licensing or add transaction markup fees, we never take a percentage of your restaurant&rsquo;s sales.
                </p>
              </div>
            </div>

            {/* Card 2: Metallic Stat Card ("750k" style) */}
            <div className="bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2 rounded-xl p-5 h-[330px] flex flex-col justify-between relative overflow-hidden group transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
              
              {/* Corner Metallic Sheen */}
              <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-white/10 via-white/5 to-transparent blur-lg pointer-events-none" />

              {/* Massive Stat: 0₹ */}
              <div className="pt-1">
                <div className="text-[52px] font-bold tracking-tighter leading-none text-ink font-display drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform origin-left duration-200">
                  0₹
                </div>
                <div className="text-[11px] font-mono text-ink-subtle uppercase tracking-eyebrow pt-1 font-semibold">
                  Hardware Fees
                </div>
              </div>

              {/* Text Block - Full Content */}
              <div className="space-y-1.5 pt-3 border-t border-hairline">
                <h3 className="text-[15px] font-semibold text-ink leading-tight font-display">
                  Cheaper than Traditional POS.
                </h3>
                <p className="text-[12px] text-ink-subtle font-normal leading-relaxed">
                  Stop buying and repairing proprietary terminals. By allowing guests to order on their own devices, you avoid costly hardware leases &amp; maintenance expenses.
                </p>
              </div>
            </div>

            {/* Card 3: Tallest Hero Card ("100% Postgres" Elephant Silhouette style) */}
            <div className="bg-surface-1 border border-primary/30 hover:border-primary/60 rounded-xl p-5 h-[400px] flex flex-col justify-between relative overflow-hidden group transition-all duration-200 shadow-[0_0_24px_rgba(94,106,210,0.08),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_12px_32px_rgba(94,106,210,0.2)]">
              
              {/* Deep Primary Glow Aura */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(94,106,210,0.15),transparent_65%)] pointer-events-none" />

              {/* 3D Rim-Lit Silhouette Center Graphic */}
              <div className="h-[160px] w-full rounded-lg flex items-center justify-center relative shrink-0">
                
                {/* 3D Graphic Rim Silhouette (Lightning / Kitchen Feed Icon) */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  
                  {/* Glowing aura ring behind graphic */}
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors duration-200" />
                  
                  {/* Dark 3D Silhouette with Primary Rim Lighting */}
                  <svg className="w-20 h-20 text-surface-3 drop-shadow-[0_0_12px_rgba(94,106,210,0.6)] group-hover:scale-105 transition-transform duration-200" viewBox="0 0 24 24" fill="currentColor" stroke="rgba(94, 106, 210, 0.9)" strokeWidth="0.75">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>

              {/* Text Block - Full Content */}
              <div className="space-y-1.5 z-10 pt-1">
                <h3 className="text-[16px] font-semibold text-ink leading-tight font-display flex items-center gap-1.5">
                  <span className="text-primary font-bold">100%</span>
                  <span>Real-Time Kitchen Sync.</span>
                </h3>
                <p className="text-[12px] text-ink-subtle font-normal leading-relaxed">
                  Orders print automatically or populate in the live kitchen feed within milliseconds of customer checkout, eliminating wait times.
                </p>
              </div>
            </div>

            {/* Card 4: Compliance / Payment Ring Badge Card ("SOC2 Compliance" style) */}
            <div className="bg-surface-1 border border-hairline hover:border-primary/40 hover:bg-surface-2 rounded-xl p-5 h-[300px] flex flex-col justify-between relative overflow-hidden group transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(94,106,210,0.12)]">
              
              {/* Radial Primary Light Arc */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-xl pointer-events-none" />

              {/* 3D Embossed Metallic Ring Seal */}
              <div className="h-[95px] w-full rounded-lg bg-surface-2 border border-hairline relative flex items-center justify-center overflow-hidden shrink-0">
                <div className="w-16 h-16 rounded-full border border-primary/40 bg-surface-3 flex items-center justify-center relative shadow-[0_0_20px_rgba(94,106,210,0.25)] group-hover:scale-105 transition-transform duration-200">
                  <div className="absolute inset-1 rounded-full border border-primary/20" />
                  <div className="text-center px-1">
                    <span className="text-[9px] font-mono font-bold text-primary block tracking-tighter uppercase">RAZORPAY</span>
                    <span className="text-[8px] font-mono text-ink-subtle block uppercase tracking-widest">SECURE</span>
                  </div>
                </div>
              </div>

              {/* Text Block - Full Content */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center text-[13px] font-mono font-medium text-ink group-hover:text-primary transition-colors">
                  <span>Flexible Payment Options</span>
                  <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-[12px] text-ink-subtle font-normal leading-relaxed">
                  Allow online digital payments now, tabs settled at the end of meals, or traditional cash payouts directly at your register.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Demo / Contact Form Section - Authentic Software-Craft Intake Workspace Panel */}
      <section id="demo" className="py-24 bg-canvas px-6 relative border-b border-hairline scroll-mt-14">
        
        <div className="max-w-[980px] mx-auto space-y-12 relative z-10">
          
          {/* Header matching Linear Display Typography Spec in DESIGN.md */}
          <div className="text-center space-y-3 max-w-[640px] mx-auto">
            <span className="text-[13px] font-semibold tracking-eyebrow text-primary uppercase font-mono">
              DIRECT ONBOARDING
            </span>
            <h2 className="text-[34px] sm:text-display-lg font-semibold leading-display-lg tracking-display-lg text-ink font-display text-balance">
              Ready to Upgrade?
            </h2>
            <p className="text-ink-muted text-[17px] font-normal leading-subhead text-balance">
              Fill out the intake details below. Our onboarding team will digitize your menu and configure table QRs within 24 hours.
            </p>
          </div>

          {/* Single Unified Form Panel (DESIGN.md Surface-1 Panel) */}
          <div className="max-w-[720px] mx-auto bg-surface-1 border border-hairline rounded-xl overflow-hidden shadow-product p-6 sm:p-10">
            {formSubmitted ? (
              <div className="text-center py-12 space-y-5" aria-live="polite">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary" aria-hidden="true">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="text-[22px] font-semibold text-ink font-display">Onboarding Ticket Created</h3>
                    <p className="text-[14px] text-ink-muted leading-relaxed font-normal">
                      Thanks, <span className="text-ink font-semibold">{formData.name}</span>. We&rsquo;ve sent confirmation to <span className="text-primary font-semibold">{formData.email}</span>. A specialist will call <span className="text-ink font-semibold">{formData.phone}</span> shortly.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="bg-surface-2 border border-hairline hover:bg-surface-3 hover:border-hairline-strong text-ink text-[14px] font-medium px-5 py-2.5 rounded-md transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
                  
                  {/* Grid Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-2 flex flex-col">
                      <label htmlFor="name" className="text-[12px] font-medium tracking-eyebrow text-ink-subtle uppercase flex items-center justify-between">
                        <span>Your Name</span>
                        <span className="text-primary" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Jane Doe"
                        autoComplete="name"
                        className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.name ? 'border-primary/80' : 'border-hairline'} focus:border-primary-focus focus:ring-1 focus:ring-primary-focus/50 rounded-md px-3.5 py-2.5 outline-none transition-colors duration-150 placeholder-ink-tertiary font-sans`}
                      />
                      {formErrors.name && (
                        <span className="text-[11px] text-primary block" aria-live="assertive">{formErrors.name}</span>
                      )}
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <label htmlFor="restaurantName" className="text-[12px] font-medium tracking-eyebrow text-ink-subtle uppercase flex items-center justify-between">
                        <span>Restaurant Name</span>
                        <span className="text-primary" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="text"
                        id="restaurantName"
                        name="restaurantName"
                        value={formData.restaurantName}
                        onChange={handleInputChange}
                        placeholder="The Koyo Bistro"
                        autoComplete="off"
                        className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.restaurantName ? 'border-primary/80' : 'border-hairline'} focus:border-primary-focus focus:ring-1 focus:ring-primary-focus/50 rounded-md px-3.5 py-2.5 outline-none transition-colors duration-150 placeholder-ink-tertiary font-sans`}
                      />
                      {formErrors.restaurantName && (
                        <span className="text-[11px] text-primary block" aria-live="assertive">{formErrors.restaurantName}</span>
                      )}
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <label htmlFor="email" className="text-[12px] font-medium tracking-eyebrow text-ink-subtle uppercase flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-primary" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="jane@restaurant.com"
                        autoComplete="email"
                        spellCheck={false}
                        className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.email ? 'border-primary/80' : 'border-hairline'} focus:border-primary-focus focus:ring-1 focus:ring-primary-focus/50 rounded-md px-3.5 py-2.5 outline-none transition-colors duration-150 placeholder-ink-tertiary font-sans`}
                      />
                      {formErrors.email && (
                        <span className="text-[11px] text-primary block" aria-live="assertive">{formErrors.email}</span>
                      )}
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <label htmlFor="phone" className="text-[12px] font-medium tracking-eyebrow text-ink-subtle uppercase flex items-center justify-between">
                        <span>Phone Number</span>
                        <span className="text-primary" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.phone ? 'border-primary/80' : 'border-hairline'} focus:border-primary-focus focus:ring-1 focus:ring-primary-focus/50 rounded-md px-3.5 py-2.5 outline-none transition-colors duration-150 placeholder-ink-tertiary font-sans`}
                      />
                      {formErrors.phone && (
                        <span className="text-[11px] text-primary block" aria-live="assertive">{formErrors.phone}</span>
                      )}
                    </div>

                  </div>

                  {/* Textarea Row */}
                  <div className="space-y-2 flex flex-col">
                    <label htmlFor="message" className="text-[12px] font-medium tracking-eyebrow text-ink-subtle uppercase">
                      Additional Details <span className="text-ink-tertiary font-normal text-[11px] font-sans lowercase">(optional)</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your table count, daily footfall, or POS integration requirements…"
                      autoComplete="off"
                      className="w-full bg-surface-2 text-ink text-[14px] border border-hairline focus:border-primary-focus focus:ring-1 focus:ring-primary-focus/50 rounded-md px-3.5 py-2.5 outline-none transition-colors duration-150 placeholder-ink-tertiary resize-none font-sans"
                    />
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary-hover active:bg-primary-focus text-white font-medium rounded-md py-3 text-[14px] transition-all duration-150 ease-out flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                          <span>Submitting Request…</span>
                        </>
                      ) : (
                        <span>Submit Demo Request</span>
                      )}
                    </button>
                  </div>

                  {/* Bottom Hairline Trust Strip */}
                  <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-[12px] text-ink-subtle font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                      <span>Zero Commission</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Razorpay Merchant Verified</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-subtle" />
                      <span>No POS Hardware Required</span>
                    </div>
                  </div>

                </form>
              )}
            </div>

        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto bg-canvas text-ink relative z-10 pt-14 pb-10 sm:pb-14 px-6 md:px-12 overflow-hidden select-none border-t border-hairline">
        
        {/* Top Proportionate Headline with Koyo Theme Colors */}
        <div className="max-w-[1200px] mx-auto flex justify-center items-center py-6 sm:py-10 px-4">
          <h2 className="text-[32px] sm:text-[56px] md:text-[76px] lg:text-[96px] xl:text-[110px] font-extrabold uppercase tracking-tight leading-[1.05] text-center bg-gradient-to-r from-ink via-[#9ba5ff] to-primary bg-clip-text text-transparent font-display drop-shadow-[0_0_40px_rgba(94,106,210,0.2)]">
            LEVEL UP YOUR DINING
          </h2>
        </div>

        {/* Center Subtitle & Pill CTA Button */}
        <div className="max-w-xl mx-auto text-center space-y-6 my-8 sm:my-12 px-4">
          <p className="text-ink-muted text-[15px] sm:text-[17px] font-normal leading-relaxed text-balance">
            Boost efficiency, save time, and enhance your dining experience with Koyo.
          </p>
          <div>
            <a 
              href="#demo" 
              className="inline-flex items-center justify-center bg-ink hover:bg-white text-canvas text-[13px] sm:text-[14px] font-bold tracking-wider uppercase px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(94,106,210,0.3)]"
            >
              GET STARTED
            </a>
          </div>
        </div>

        {/* Bottom Nav Links & Social Icons Row */}
        <div className="max-w-[1200px] mx-auto pt-10 border-t border-hairline flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Nav Links */}
          <nav className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-[12px] sm:text-[13px] font-mono font-medium tracking-wider uppercase text-ink-subtle">
            <a href="#hero-section" className="hover:text-ink transition-colors duration-150">HOME</a>
            <a href="#how-it-works" className="hover:text-ink transition-colors duration-150">PLATFORM</a>
            <a href="#benefits" className="hover:text-ink transition-colors duration-150">SOLUTIONS</a>
            <Link href="/dashboard/login" className="hover:text-ink transition-colors duration-150">STAFF PORTAL</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors duration-150">PRIVACY</Link>
            <Link href="/terms" className="hover:text-ink transition-colors duration-150">TERMS</Link>
            <a href="#demo" className="hover:text-ink transition-colors duration-150">CONTACT</a>
          </nav>

          {/* Social Media Icons */}
          <div className="flex items-center space-x-3">
            {/* Facebook */}
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Facebook"
              className="w-9 h-9 rounded-full border border-hairline hover:border-hairline-strong hover:bg-surface-2 flex items-center justify-center text-ink-subtle hover:text-ink transition-all duration-150"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border border-hairline hover:border-hairline-strong hover:bg-surface-2 flex items-center justify-center text-ink-subtle hover:text-ink transition-all duration-150"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-hairline hover:border-hairline-strong hover:bg-surface-2 flex items-center justify-center text-ink-subtle hover:text-ink transition-all duration-150"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* X / Twitter */}
            <a 
              href="https://x.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="X (Twitter)"
              className="w-9 h-9 rounded-full border border-hairline hover:border-hairline-strong hover:bg-surface-2 flex items-center justify-center text-ink-subtle hover:text-ink transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* YouTube */}
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="YouTube"
              className="w-9 h-9 rounded-full border border-hairline hover:border-hairline-strong hover:bg-surface-2 flex items-center justify-center text-ink-subtle hover:text-ink transition-all duration-150"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>

        </div>

        {/* Sub-footer Copyright strip */}
        <div className="max-w-[1200px] mx-auto mt-6 pt-4 text-center text-[11px] font-mono text-ink-tertiary">
          &copy; {new Date().getFullYear()} Koyo QR Ordering System. All rights reserved.
        </div>

      </footer>

    </main>
  )
}
