import React from 'react'
import Link from 'next/link'

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#ffffff] flex flex-col items-center p-6 relative overflow-hidden font-sans">
      {/* Decorative spotlight glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#1a26ff]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-2xl w-full my-12 bg-[#181818] border border-[#222222] p-8 md:p-12 rounded-xl relative z-10 space-y-8">
        <div className="space-y-2">
          <Link 
            href="/"
            className="text-xs font-semibold text-[#888888] hover:text-[#0007cd] transition-colors flex items-center space-x-1"
          >
            <span>←</span> <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mt-4">Terms of Service</h1>
          <p className="text-[#a8a8a8] text-xs">Last updated: July 24, 2026</p>
        </div>

        <hr className="border-[#222222]" />

        <div className="space-y-6 text-sm text-[#a8a8a8] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Service Description</h2>
            <p>
              Koyo is a PWA restaurant QR ordering platform providing menus, checkout services, and kitchen analytics to dine-in restaurants and customers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Customer Orders and Payment</h2>
            <p>
              By using our service to place orders, you agree that you are responsible for any charges incurred. You agree to settle payments online or directly at the counter using options enabled by the dining establishment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Acceptable Use</h2>
            <p>
              Users agree not to disrupt ordering services, submit mock orders, or access restricted pages like the kitchen feed and admin console without proper authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Modifications to Service</h2>
            <p>
              We reserve the right to modify or suspend services at any time. Koyo is not liable to users or restaurants for any disruption.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-[#222222] text-center">
          <p className="text-[11px] text-[#666666]">
            &copy; 2026 Koyo Platform. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}
