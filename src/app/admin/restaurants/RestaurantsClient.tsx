'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { createRestaurantAction } from './actions'

export interface RestaurantSummary {
  id: string
  name: string
  upi_id: string | null
  address: string | null
  created_at: string
  tables: { count: number }[] | { count: number } | null
  menu_items: { count: number }[] | { count: number } | null
}

interface RestaurantsClientProps {
  initialRestaurants: RestaurantSummary[]
}

export default function RestaurantsClient({ initialRestaurants }: RestaurantsClientProps) {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>(initialRestaurants)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [address, setAddress] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Success credentials state
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    restaurantId: string
    restaurantName: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Search filter
  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.upi_id && r.upi_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCopyPassword = () => {
    if (!createdCredentials) return
    navigator.clipboard.writeText(
      `Email: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\nLogin URL: ${window.location.origin}/dashboard/login`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Restaurant name is required.')
      return
    }
    if (!ownerEmail.trim()) {
      setFormError('Owner email is required.')
      return
    }

    startTransition(async () => {
      const res = await createRestaurantAction({
        name,
        upi_id: upiId,
        address,
        owner_email: ownerEmail,
      })

      if (res.error) {
        setFormError(res.error)
      } else if (res.success && res.email && res.password && res.restaurantId) {
        // Update local list with mock new item for instant update, or wait for refresh
        const newRest: RestaurantSummary = {
          id: res.restaurantId,
          name: name.trim(),
          upi_id: upiId.trim() || null,
          address: address.trim() || null,
          created_at: new Date().toISOString(),
          tables: { count: 0 },
          menu_items: { count: 0 },
        }
        setRestaurants(prev => [newRest, ...prev])

        setCreatedCredentials({
          email: res.email,
          password: res.password,
          restaurantId: res.restaurantId,
          restaurantName: name.trim(),
        })

        // Reset form
        setName('')
        setUpiId('')
        setAddress('')
        setOwnerEmail('')
        setIsModalOpen(false)
      }
    })
  }

  // Safe counts parsing
  const getCount = (val: any) => {
    if (!val) return 0
    if (Array.isArray(val)) {
      return val[0]?.count ?? 0
    }
    return val.count ?? 0
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Restaurants</h1>
          <p className="text-sm text-[#a8a8a8] mt-1">
            Browse and manage all registered restaurant clients.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null)
            setIsModalOpen(true)
          }}
          className="h-10 bg-[#0007cd] hover:bg-[#0005a3] text-white text-xs font-semibold rounded-md px-5 transition-colors cursor-pointer flex items-center justify-center space-x-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="w-full bg-[#181818] border border-[#222222] rounded-lg p-4">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#666666]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by restaurant name or UPI…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-[#0f0f0f] border border-[#222222] rounded-md pl-10 pr-4 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] text-white placeholder:text-[#666666]"
          />
        </div>
      </div>

      {/* Restaurants List */}
      <div className="bg-[#181818] border border-[#222222] rounded-lg overflow-hidden">
        {filteredRestaurants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#222222] text-[#666666] border border-[#333333]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">No restaurants found</p>
            <p className="text-xs text-[#666666] max-w-xs mx-auto">
              {searchTerm ? 'Try adjusting your search terms.' : 'Onboard your first restaurant to get started.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#1d1d1d]/30 text-[#888888] uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">UPI ID</th>
                    <th className="py-4 px-6 text-center">Tables</th>
                    <th className="py-4 px-6 text-center">Menu Items</th>
                    <th className="py-4 px-6">Onboarded</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] text-white">
                  {filteredRestaurants.map((r) => (
                    <tr key={r.id} className="hover:bg-[#222222]/30 transition-[background-color] duration-150 group">
                      <td className="py-4 px-6">
                        <Link
                          href={`/admin/restaurants/${r.id}`}
                          className="font-medium text-white hover:text-[#00d4ff] transition-[color]"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-[#a8a8a8] font-mono">
                        {r.upi_id || '—'}
                      </td>
                      <td className="py-4 px-6 text-center text-[#a8a8a8] font-medium">
                        {getCount(r.tables)}
                      </td>
                      <td className="py-4 px-6 text-center text-[#a8a8a8] font-medium">
                        {getCount(r.menu_items)}
                      </td>
                      <td className="py-4 px-6 text-[#a8a8a8]">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/admin/restaurants/${r.id}`}
                          className="inline-flex items-center space-x-1 text-xs text-[#a8a8a8] group-hover:text-white transition-[color]"
                        >
                          <span>Manage</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#222222]">
              {filteredRestaurants.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/restaurants/${r.id}`}
                        className="font-semibold text-white text-sm hover:text-[#00d4ff] transition-[color]"
                      >
                        {r.name}
                      </Link>
                      <p className="text-xs text-[#888888] mt-0.5 font-mono truncate max-w-[240px]">
                        {r.upi_id || '—'}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#666666] font-mono shrink-0">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-[#222222]/50 text-center text-xs">
                    <div>
                      <span className="text-[#666666] block text-[10px] uppercase font-bold tracking-wider">Tables</span>
                      <span className="text-[#a8a8a8] font-mono font-semibold">{getCount(r.tables)}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] block text-[10px] uppercase font-bold tracking-wider">Menu Items</span>
                      <span className="text-[#a8a8a8] font-mono font-semibold">{getCount(r.menu_items)}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="w-full text-center py-2 text-xs text-[#a8a8a8] hover:text-white bg-[#111112] border border-[#222222] rounded-md transition-[color,background-color] font-medium flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none"
                    >
                      <span>Manage Restaurant</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Restaurant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-[#181818] border border-[#222222] rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-[#222222]">
              <h2 className="text-base font-semibold text-white">Add New Restaurant</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#666666] hover:text-white transition-[color] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd] rounded-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-4 sm:p-6 space-y-4">
                {formError && (
                  <div className="bg-red-950/30 border border-red-900/30 text-red-400 text-xs p-3.5 rounded-lg leading-normal">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bella Italia Bistro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 bg-[#0f0f0f] border border-[#222222] rounded-md px-3 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] text-white placeholder:text-[#666666]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
                      UPI ID (for payments)
                    </label>
                    <input
                      type="text"
                      placeholder="merchant@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full h-10 bg-[#0f0f0f] border border-[#222222] rounded-md px-3 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] text-white placeholder:text-[#666666]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
                      Owner Email * (First login)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@restaurant.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full h-10 bg-[#0f0f0f] border border-[#222222] rounded-md px-3 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] text-white placeholder:text-[#666666]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
                    Address
                  </label>
                  <textarea
                    placeholder="123 Main Street, Suite 400…"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0f0f0f] border border-[#222222] rounded-md p-3 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] text-white placeholder:text-[#666666] resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 sm:px-6 py-4 bg-[#1d1d1d]/30 border-t border-[#222222] flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:space-x-3 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto h-10 bg-[#222222] hover:bg-[#2a2a2a] text-white border border-[#333333] px-4 rounded-md text-xs font-semibold transition-[color,background-color] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto h-10 bg-[#0007cd] hover:bg-[#0005a3] text-white text-xs font-semibold rounded-md px-5 transition-[color,background-color] cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Creating…</span>
                    </>
                  ) : (
                    <span>Onboard Restaurant</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Success Screen Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#181818] border border-[#0007cd]/30 rounded-xl overflow-hidden shadow-2xl relative p-6 space-y-6 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-[#33d17a]/10 text-[#33d17a] border border-[#33d17a]/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Restaurant Onboarded Successfully</h2>
              <p className="text-xs text-[#a8a8a8] max-w-sm mx-auto leading-relaxed">
                Registered <span className="text-white font-medium">{createdCredentials.restaurantName}</span>. Copy the generated temporary credentials below and hand them to the owner.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="bg-[#0f0f0f] border border-[#222222] rounded-lg p-5 text-left font-sans space-y-4 relative">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666]">Staff Login Portal</span>
                <p className="text-xs text-white font-medium break-all">
                  {window.location.origin}/dashboard/login
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-[#1a1a1a]">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666]">Email Address</span>
                  <p className="text-xs text-white font-medium break-all">
                    {createdCredentials.email}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666]">Temp Password</span>
                  <p className="text-xs text-[#00d4ff] font-mono font-semibold select-all">
                    {createdCredentials.password}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyPassword}
                className="absolute top-4 right-4 text-[#666666] hover:text-white transition-colors cursor-pointer"
                title="Copy details"
              >
                {copied ? (
                  <span className="text-[10px] text-[#33d17a] font-semibold">Copied!</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={() => setCreatedCredentials(null)}
              className="w-full h-11 bg-[#0007cd] hover:bg-[#0005a3] text-white text-sm font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
