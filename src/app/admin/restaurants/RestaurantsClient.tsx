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

  const totalTables = restaurants.reduce((acc, r) => acc + getCount(r.tables), 0)
  const totalMenuItems = restaurants.reduce((acc, r) => acc + getCount(r.menu_items), 0)

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink font-display">Restaurants</h1>
            <span className="bg-surface-2 text-ink-subtle border border-hairline text-xs rounded-full px-2.5 py-0.5 font-mono">
              {restaurants.length}
            </span>
          </div>
          <p className="text-sm text-ink-subtle mt-1 font-sans">
            Browse and manage all registered restaurant clients across the platform.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null)
            setIsModalOpen(true)
          }}
          className="h-9 bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium rounded-md px-4 transition-all cursor-pointer flex items-center justify-center space-x-1.5 self-start sm:self-auto shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-surface-1 border border-hairline rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">Total Clients</span>
            <p className="text-xl font-semibold font-display text-ink">{restaurants.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">Active Tables</span>
            <p className="text-xl font-semibold font-display text-ink">{totalTables}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14" />
            </svg>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">Menu Items</span>
            <p className="text-xl font-semibold font-display text-ink">{totalMenuItems}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full bg-surface-1 border border-hairline rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-tertiary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by restaurant name or UPI ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-surface-2 border border-hairline rounded-md pl-9 pr-3 text-xs text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-primary/40 transition-all font-sans"
          />
        </div>
        <div className="text-[11px] text-ink-tertiary font-mono text-right sm:text-left">
          Showing {filteredRestaurants.length} of {restaurants.length}
        </div>
      </div>

      {/* Restaurants Table Card */}
      <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
        {filteredRestaurants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-surface-2 text-ink-tertiary border border-hairline">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink">No restaurants found</p>
            <p className="text-xs text-ink-tertiary max-w-xs mx-auto">
              {searchTerm ? 'Try adjusting your search query.' : 'Onboard your first restaurant client to get started.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface-2/40 text-ink-subtle uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">UPI ID</th>
                    <th className="py-3 px-6 text-center">Tables</th>
                    <th className="py-3 px-6 text-center">Menu Items</th>
                    <th className="py-3 px-6">Onboarded</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {filteredRestaurants.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-2/50 transition-colors duration-150 group">
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/admin/restaurants/${r.id}`}
                          className="flex items-center space-x-3 group-hover:text-ink"
                        >
                          <div className="w-7 h-7 rounded-md bg-surface-2 border border-hairline text-primary font-display font-semibold text-xs flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-ink group-hover:text-primary transition-colors text-sm">
                            {r.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-6 text-ink-subtle font-mono text-xs">
                        {r.upi_id || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="bg-surface-2 text-ink-muted border border-hairline text-xs rounded-full px-2.5 py-0.5 font-mono inline-block">
                          {getCount(r.tables)}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="bg-surface-2 text-ink-muted border border-hairline text-xs rounded-full px-2.5 py-0.5 font-mono inline-block">
                          {getCount(r.menu_items)}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-ink-subtle font-mono text-xs">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/admin/restaurants/${r.id}`}
                          className="inline-flex items-center space-x-1 text-xs text-ink-subtle group-hover:text-ink transition-colors font-medium"
                        >
                          <span>Manage</span>
                          <svg className="w-3 h-3 text-ink-tertiary group-hover:text-ink group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
            <div className="md:hidden divide-y divide-hairline">
              {filteredRestaurants.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-md bg-surface-2 border border-hairline text-primary font-display font-semibold text-xs flex items-center justify-center shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/restaurants/${r.id}`}
                          className="font-medium text-ink text-sm hover:text-primary transition-colors truncate block"
                        >
                          {r.name}
                        </Link>
                        <p className="text-xs text-ink-tertiary font-mono truncate">
                          {r.upi_id || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-tertiary font-mono shrink-0">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-hairline/50 text-center text-xs">
                    <div>
                      <span className="text-ink-tertiary block text-[10px] uppercase font-mono tracking-wider">Tables</span>
                      <span className="text-ink font-mono font-medium">{getCount(r.tables)}</span>
                    </div>
                    <div>
                      <span className="text-ink-tertiary block text-[10px] uppercase font-mono tracking-wider">Menu Items</span>
                      <span className="text-ink font-mono font-medium">{getCount(r.menu_items)}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="w-full text-center py-2 text-xs text-ink-muted hover:text-ink bg-surface-2 border border-hairline rounded-md transition-colors font-medium flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <span>Manage Restaurant</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="max-w-lg w-full bg-surface-1 border border-hairline-strong rounded-xl overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-surface-2/30">
              <h2 className="text-sm font-semibold text-ink font-display">Add New Restaurant</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-tertiary hover:text-ink transition-colors cursor-pointer rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                {formError && (
                  <div className="bg-red-950/30 border border-red-900/40 text-red-400 text-xs p-3 rounded-lg leading-normal">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-ink-subtle font-semibold uppercase tracking-wider block font-mono">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bella Italia Bistro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 bg-surface-2 border border-hairline rounded-md px-3 text-xs text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-primary-focus transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ink-subtle font-semibold uppercase tracking-wider block font-mono">
                      UPI ID (for payments)
                    </label>
                    <input
                      type="text"
                      placeholder="merchant@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full h-9 bg-surface-2 border border-hairline rounded-md px-3 text-xs text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-primary-focus transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ink-subtle font-semibold uppercase tracking-wider block font-mono">
                      Owner Email * (First login)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@restaurant.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full h-9 bg-surface-2 border border-hairline rounded-md px-3 text-xs text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-primary-focus transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-ink-subtle font-semibold uppercase tracking-wider block font-mono">
                    Address
                  </label>
                  <textarea
                    placeholder="123 Main Street, Suite 400…"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-surface-2 border border-hairline rounded-md p-3 text-xs text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-primary-focus transition-all resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-surface-2/30 border-t border-hairline flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:space-x-3 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto h-9 bg-surface-2 hover:bg-surface-3 text-ink-muted border border-hairline px-4 rounded-md text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto h-9 bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium rounded-md px-4 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-in fade-in-50 duration-150">
          <div className="max-w-md w-full bg-surface-1 border border-hairline-strong rounded-xl overflow-hidden shadow-2xl relative p-6 space-y-5 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-semantic-success/10 text-semantic-success border border-semantic-success/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-ink font-display">Restaurant Onboarded</h2>
              <p className="text-xs text-ink-subtle max-w-sm mx-auto leading-relaxed">
                Registered <span className="text-ink font-medium">{createdCredentials.restaurantName}</span>. Share the generated temporary credentials below with the restaurant owner.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="bg-surface-2 border border-hairline rounded-lg p-4 text-left font-sans space-y-3.5 relative">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-mono tracking-wider text-ink-tertiary">Staff Login Portal</span>
                <p className="text-xs text-ink font-mono font-medium break-all">
                  {window.location.origin}/dashboard/login
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-hairline">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-ink-tertiary">Email Address</span>
                  <p className="text-xs text-ink font-mono font-medium break-all">
                    {createdCredentials.email}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-ink-tertiary">Temp Password</span>
                  <p className="text-xs text-primary font-mono font-semibold select-all">
                    {createdCredentials.password}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyPassword}
                className="absolute top-3.5 right-3.5 text-ink-tertiary hover:text-ink transition-colors cursor-pointer"
                title="Copy details"
              >
                {copied ? (
                  <span className="text-[10px] text-semantic-success font-medium">Copied!</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={() => setCreatedCredentials(null)}
              className="w-full h-9 bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
