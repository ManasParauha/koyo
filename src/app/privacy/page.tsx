import React from 'react'
import Link from 'next/link'

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-extrabold tracking-tight mt-4">Privacy Policy</h1>
          <p className="text-[#a8a8a8] text-xs">Last updated: July 24, 2026</p>
        </div>

        <hr className="border-[#222222]" />

        <div className="space-y-6 text-sm text-[#a8a8a8] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              We collect information to provide better services to our users. This includes table scan details, customized order selections, and payment method choices to facilitate ordering.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. How We Use Information</h2>
            <p>
              We use information collected to process and route orders to the kitchen dashboard of the participating restaurant, process payments through our Razorpay integration, and support restaurant analytics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Third-Party Integrations</h2>
            <p>
              Our platform operates in conjunction with Supabase database infrastructure and Razorpay for payment gateway processing. Your payment details are securely processed directly by our payment partners.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@koyo-qr.com.
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
