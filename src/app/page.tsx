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
          
          {/* Header Left Aligned with theme styling */}
          <div className="text-left space-y-3 max-w-[640px]">
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

      {/* 4. Why Choose Us Section */}
      <section id="benefits" className="py-24 bg-canvas px-6 border-b border-hairline scroll-mt-14">
        <div className="max-w-[980px] mx-auto space-y-16">
          
          {/* Header with Pill & Dual-Tone Headline */}
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

          {/* Stacked Vertical Rows matching Reference Image UI with Koyo Brand Aesthetics */}
          <div className="max-w-[780px] mx-auto space-y-4">
            
            {/* Benefit 1 */}
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 bg-surface-1 border border-hairline hover:bg-surface-2 hover:border-hairline-strong rounded-xl p-4 md:p-5 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              {/* Graphic 1: Grid matching Image Item 1 */}
              <div className="w-full md:w-[220px] shrink-0 h-[125px] bg-surface-2 border border-hairline rounded-lg p-3 flex items-center justify-center relative overflow-hidden group-hover:border-hairline-strong transition-colors duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="grid grid-cols-6 gap-1.5 w-full max-w-[170px]" aria-hidden="true">
                  {[
                    0, 0, 0, 0, 0, 0,
                    0, 0, 1, 0, 0, 0,
                    0, 0, 0, 0, 0, 0,
                    0, 1, 0, 0, 0, 0,
                    0, 0, 0, 0, 1, 0,
                  ].map((active, i) => (
                    <div
                      key={i}
                      className={`h-3 rounded-[3px] transition-all duration-300 ${
                        active
                          ? 'bg-primary shadow-[0_0_10px_rgba(94,106,210,0.7)]'
                          : 'bg-surface-3 border border-hairline/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-left">
                <h3 className="text-[17px] font-semibold text-ink font-display">
                  No Per-Order Commissions
                </h3>
                <p className="text-[14px] text-ink-muted font-normal leading-relaxed">
                  Koyo takes zero commission on your orders. Unlike traditional POS vendors that charge per-terminal licensing or add transaction markup fees, we <span className="text-ink font-medium">never take a percentage</span> of your restaurant&rsquo;s sales.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 bg-surface-1 border border-hairline hover:bg-surface-2 hover:border-hairline-strong rounded-xl p-4 md:p-5 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              {/* Graphic 2: Bar Chart matching Image Item 2 */}
              <div className="w-full md:w-[220px] shrink-0 h-[125px] bg-surface-2 border border-hairline rounded-lg px-5 py-3 flex items-end justify-center relative overflow-hidden group-hover:border-hairline-strong transition-colors duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-end justify-between gap-3 w-full max-w-[160px] h-[75px]" aria-hidden="true">
                  {[
                    { height: '85%', active: true },
                    { height: '40%', active: false },
                    { height: '65%', active: true },
                    { height: '25%', active: false },
                    { height: '90%', active: true },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 h-full flex items-end justify-center">
                      <div
                        style={{ height: bar.height }}
                        className={`w-full rounded-[3px] transition-all duration-300 ${
                          bar.active
                            ? 'bg-primary shadow-[0_0_10px_rgba(94,106,210,0.6)]'
                            : 'bg-surface-3 border border-hairline/40'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-left">
                <h3 className="text-[17px] font-semibold text-ink font-display">
                  Cheaper than Traditional POS
                </h3>
                <p className="text-[14px] text-ink-muted font-normal leading-relaxed">
                  Stop buying and repairing proprietary terminals. By allowing guests to order on their own devices, you <span className="text-ink font-medium">avoid costly hardware leases</span> and high terminal maintenance expenses.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 bg-surface-1 border border-hairline hover:bg-surface-2 hover:border-hairline-strong rounded-xl p-4 md:p-5 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              {/* Graphic 3: Signal Spectrum matching Image Item 3 */}
              <div className="w-full md:w-[220px] shrink-0 h-[125px] bg-surface-2 border border-hairline rounded-lg px-4 py-3 flex items-center justify-center relative overflow-hidden group-hover:border-hairline-strong transition-colors duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between gap-1 w-full max-w-[170px] h-[65px]" aria-hidden="true">
                  {[
                    0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 0.9, 0.85, 0.95, 1.0, 0.85, 0.7
                  ].map((val, i) => (
                    <div
                      key={i}
                      style={{ height: `${val * 100}%` }}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        val > 0.6
                          ? 'bg-primary shadow-[0_0_6px_rgba(94,106,210,0.7)]'
                          : val > 0.35
                          ? 'bg-primary/50'
                          : 'bg-surface-3'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-left">
                <h3 className="text-[17px] font-semibold text-ink font-display">
                  Real-Time Kitchen Sync
                </h3>
                <p className="text-[14px] text-ink-muted font-normal leading-relaxed">
                  Orders print automatically or populate in the live kitchen feed within milliseconds of customer checkout, <span className="text-ink font-medium">eliminating wait times</span>.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 bg-surface-1 border border-hairline hover:bg-surface-2 hover:border-hairline-strong rounded-xl p-4 md:p-5 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group">
              {/* Graphic 4: Flexible Payments */}
              <div className="w-full md:w-[220px] shrink-0 h-[125px] bg-surface-2 border border-hairline rounded-lg p-3 flex flex-col justify-center relative overflow-hidden group-hover:border-hairline-strong transition-colors duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="space-y-1.5 w-full max-w-[170px] mx-auto font-sans" aria-hidden="true">
                  <div className="bg-surface-3 border border-hairline p-1.5 rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(94,106,210,0.7)]" />
                      <span className="text-[10px] font-medium text-ink">UPI / Card Pay</span>
                    </div>
                    <span className="text-[9px] text-ink-subtle font-mono">Instant</span>
                  </div>
                  <div className="bg-surface-3 border border-hairline p-1.5 rounded-md flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(94,106,210,0.7)]" />
                      <span className="text-[10px] font-medium text-ink">Open Order Tab</span>
                    </div>
                    <span className="text-[9px] text-ink-subtle font-mono">Post-pay</span>
                  </div>
                  <div className="bg-surface-3 border border-hairline p-1.5 rounded-md flex items-center justify-between opacity-80">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                      <span className="text-[10px] font-medium text-ink-muted">Register Cash</span>
                    </div>
                    <span className="text-[9px] text-ink-subtle font-mono">Counter</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-left">
                <h3 className="text-[17px] font-semibold text-ink font-display">
                  Flexible Payment Options
                </h3>
                <p className="text-[14px] text-ink-muted font-normal leading-relaxed">
                  Allow <span className="text-ink font-medium">online digital payments now</span>, tabs settled at the end of meals, or traditional cash payouts directly at your register.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Demo / Contact Form Section */}
      <section id="demo" className="py-24 bg-canvas px-6 relative border-b border-hairline scroll-mt-14">
        
        <div className="max-w-xl w-full mx-auto relative z-10 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-[34px] sm:text-display-lg font-semibold tracking-display-lg text-ink font-display text-balance">
              Ready to Upgrade?
            </h2>
            <p className="text-ink-muted text-[17px] font-normal leading-subhead text-balance">
              Fill in your details below. Our restaurant onboarding specialists will reach out within 24 hours to schedule a live demo.
            </p>
          </div>

          <div className="bg-surface-1 border border-hairline rounded-lg p-6 md:p-8 shadow-product shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {formSubmitted ? (
              <div className="text-center py-10 space-y-5" aria-live="polite">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary" aria-hidden="true">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[21px] font-semibold text-ink font-display">Demo Requested Successfully!</h3>
                  <p className="text-[14px] text-ink-muted leading-relaxed max-w-sm mx-auto font-normal">
                    Thanks for reaching out, <span className="text-ink font-semibold">{formData.name}</span>. We&rsquo;ve sent a confirmation to <span className="text-primary font-semibold">{formData.email}</span>. A specialist will call you at <span className="text-ink font-semibold">{formData.phone}</span> shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-surface-2 border border-hairline hover:bg-surface-3 hover:border-hairline-strong text-ink text-[14px] font-medium px-4 py-2 rounded-md transition-[background-color,transform] active:scale-95 duration-100 ease-out focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
                >
                  Request another Demo
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label htmlFor="name" className="text-[11px] font-semibold tracking-eyebrow text-ink-subtle uppercase">
                      Your Name <span className="text-primary" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Jane Doe…"
                      autoComplete="name"
                      className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.name ? 'border-primary/80 focus-visible:ring-primary/45' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary-focus rounded-md px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 placeholder-ink-tertiary`}
                    />
                    {formErrors.name && (
                      <span className="text-[11px] text-primary block mt-1" aria-live="assertive">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label htmlFor="restaurantName" className="text-[11px] font-semibold tracking-eyebrow text-ink-subtle uppercase">
                      Restaurant Name <span className="text-primary" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleInputChange}
                      placeholder="e.g. The Koyo Bistro…"
                      autoComplete="off"
                      className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.restaurantName ? 'border-primary/80 focus-visible:ring-primary/45' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary-focus rounded-md px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 placeholder-ink-tertiary`}
                    />
                    {formErrors.restaurantName && (
                      <span className="text-[11px] text-primary block mt-1" aria-live="assertive">{formErrors.restaurantName}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label htmlFor="email" className="text-[11px] font-semibold tracking-eyebrow text-ink-subtle uppercase">
                      Email Address <span className="text-primary" aria-hidden="true">*</span>
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
                      className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.email ? 'border-primary/80 focus-visible:ring-primary/45' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary-focus rounded-md px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 placeholder-ink-tertiary`}
                    />
                    {formErrors.email && (
                      <span className="text-[11px] text-primary block mt-1" aria-live="assertive">{formErrors.email}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label htmlFor="phone" className="text-[11px] font-semibold tracking-eyebrow text-ink-subtle uppercase">
                      Phone Number <span className="text-primary" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 98765 43210…"
                      autoComplete="tel"
                      className={`w-full bg-surface-2 text-ink text-[14px] border ${formErrors.phone ? 'border-primary/80 focus-visible:ring-primary/45' : 'border-hairline'} focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary-focus rounded-md px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 placeholder-ink-tertiary`}
                    />
                    {formErrors.phone && (
                      <span className="text-[11px] text-primary block mt-1" aria-live="assertive">{formErrors.phone}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="message" className="text-[11px] font-semibold tracking-eyebrow text-ink-subtle uppercase">
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
                    className="w-full bg-surface-2 text-ink text-[14px] border border-hairline focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary-focus rounded-md px-3.5 py-2.5 outline-none transition-[border-color,box-shadow] duration-150 placeholder-ink-tertiary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-hover active:bg-primary-focus text-white font-semibold rounded-md py-3 text-[15px] transition-[background-color,transform] active:scale-95 duration-100 ease-out flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-primary/50 outline-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
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
      <footer className="mt-auto bg-canvas py-16 px-6 relative z-10 border-t border-hairline">
        <div className="max-w-[980px] mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="flex items-center text-ink hover:text-primary transition-colors group" aria-label="Koyo Home">
              <span className="font-semibold text-ink tracking-display-md font-display text-[18px]">Koyo</span>
            </Link>
            <p className="text-[12px] font-normal leading-relaxed text-ink-subtle">
              Premium self-serve QR ordering &amp; payment infrastructure for modern restaurants. Designed to replace overpriced legacy POS terminals.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div className="space-y-3.5">
              <h4 className="text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">Platform</h4>
              <ul className="text-[14px] font-normal text-ink-subtle space-y-2.5">
                <li><a href="#how-it-works" className="hover:text-primary transition-colors duration-155">How it Works</a></li>
                <li><a href="#benefits" className="hover:text-primary transition-colors duration-155">Why Choose Us</a></li>
                <li><a href="#demo" className="hover:text-primary transition-colors duration-155">Book a Demo</a></li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">Portals</h4>
              <ul className="text-[14px] font-normal text-ink-subtle space-y-2.5">
                <li><Link href="/dashboard/login" className="hover:text-primary transition-colors duration-155">Staff Dashboard</Link></li>
              </ul>
            </div>

            <div className="space-y-3.5 col-span-2 sm:col-span-1">
              <h4 className="text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">Legal</h4>
              <ul className="text-[14px] font-normal text-ink-subtle space-y-2.5">
                <li><Link href="/privacy" className="hover:text-primary transition-colors duration-155">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors duration-155">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>

        <div className="max-w-[980px] mx-auto mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between text-[12px] font-normal text-ink-tertiary gap-4">
          <p>&copy; 2026 Koyo QR Ordering. All rights reserved.</p>
          <p>Made with &hearts; for modern gastronomy</p>
        </div>
      </footer>

    </main>
  )
}
