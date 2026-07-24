'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { addTable, deleteTable } from './actions'

interface Table {
  id: string
  restaurant_id: string
  table_number: string
  qr_code_url: string | null
  created_at: string
}

interface TableManagerProps {
  restaurantId: string
  restaurantName: string
  initialTables: Table[]
}

export function TableManager({ restaurantId, restaurantName, initialTables }: TableManagerProps) {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [tableNumber, setTableNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Transition state for adding tables
  const [isPendingAdd, startTransitionAdd] = useTransition()

  // States for delete modal
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null)
  const [isPendingDelete, startTransitionDelete] = useTransition()

  // Sync state with incoming props on router refresh
  React.useEffect(() => {
    setTables(initialTables)
  }, [initialTables])

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout failed:', error.message)
    }
    router.push('/dashboard/login')
    router.refresh()
  }

  // Handle adding a table
  const handleAddTableSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!tableNumber.trim()) {
      setError('Table number cannot be empty.')
      return
    }

    startTransitionAdd(async () => {
      const res = await addTable(restaurantId, tableNumber)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccessMsg(`Table "${tableNumber}" added successfully!`)
        setTableNumber('')
        // Refresh page data to fetch new table lists
        router.refresh()
      }
    })
  }

  // Handle deleting a table (inside transition)
  const confirmDeleteTable = () => {
    if (!tableToDelete) return

    startTransitionDelete(async () => {
      const res = await deleteTable(restaurantId, tableToDelete.id)
      if (res.error) {
        setError(res.error)
        setTableToDelete(null)
      } else {
        setSuccessMsg(`Table "${tableToDelete.table_number}" deleted successfully.`)
        setTableToDelete(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans flex flex-col relative overflow-hidden">
      {/* Blue Spotlight Glow Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0007cd]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-6 sm:px-8 relative z-10">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-white text-lg tracking-tight uppercase">
            Kitchen Dashboard
          </span>
          <span className="text-[#333333]">|</span>
          <span className="text-[#a8a8a8] text-sm hidden sm:inline">
            {restaurantName}
          </span>
          <span className="text-[#333333] hidden sm:inline">|</span>
          <Link
            href={`/dashboard/${restaurantId}`}
            className="text-xs text-[#a8a8a8] bg-[#181818] border border-[#222222] px-3 py-1.5 rounded-md hover:bg-[#222222] hover:text-white transition-all font-medium focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none"
          >
            ← Back to Orders
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/${restaurantId}/tables/print`}
            className="text-xs text-white bg-[#0007cd] hover:bg-[#0005a3] px-3.5 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 shadow-md focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print All QR Codes</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
          >
            <span>Logout</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto relative z-10 flex flex-col lg:flex-row gap-8">

        {/* Left column: Add Table Form */}
        <section className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-[#181818] border border-[#222222] p-6 rounded-xl space-y-6">
            <h2 className="text-lg font-semibold text-white tracking-tight">Add New Table</h2>
            <p className="text-xs text-[#888888] leading-relaxed">
              Create a physical table entry. This automatically generates a dedicated QR code menu URL pointing to this table.
            </p>

            {error && (
              <div className="bg-red-950/30 border border-red-900/30 text-red-400 text-xs p-3.5 rounded-lg leading-normal" aria-live="polite">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 text-xs p-3.5 rounded-lg leading-normal" aria-live="polite">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAddTableSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="table-number-input" className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
                  Table Number or Label
                </label>
                <input
                  id="table-number-input"
                  name="tableNumber"
                  type="text"
                  required
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="e.g. 5, Bar-2, VIP-1…"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full h-11 bg-[#0f0f0f] text-white border border-[#222222] rounded-md px-4 text-sm focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] focus-visible:ring-2 focus-visible:ring-[#0007cd] transition-all placeholder:text-[#666666]"
                />
              </div>

              <button
                type="submit"
                disabled={isPendingAdd}
                className="w-full h-11 bg-[#0007cd] hover:bg-[#0005a3] text-white text-sm font-semibold rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none"
              >
                {isPendingAdd ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Adding…</span>
                  </span>
                ) : (
                  <span>Add Table</span>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right column: Tables List */}
        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Active Tables</h2>
            <span className="text-xs bg-[#181818] border border-[#222222] px-3 py-1 rounded-md text-[#a8a8a8]">
              Total: <span className="font-mono text-indigo-400 font-semibold">{tables.length}</span>
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#181818] border border-[#222222] rounded-xl text-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#0f0f0f] border border-[#222222] flex items-center justify-center text-[#666666] mb-4">
                <svg className="w-8 h-8 opacity-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">No Tables Registered</h3>
              <p className="text-sm text-[#888888] max-w-sm">
                Register tables using the form on the left to generate QR codes for customers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tables.map((table) => {
                const downloadName = `table-${table.table_number.toLowerCase().replace(/\s+/g, '-')}-qr.png`
                return (
                  <div
                    key={table.id}
                    className="bg-[#181818] border border-[#222222] rounded-xl p-5 flex flex-col justify-between transition-all hover:border-zinc-700 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left: Table Number */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
                          Label
                        </span>
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                          Table {table.table_number}
                        </h3>
                      </div>

                      {/* Right: Small QR Code Preview */}
                      <div className="w-16 h-16 bg-white p-1 rounded-lg border border-[#222222] flex-shrink-0 flex items-center justify-center relative group">
                        {table.qr_code_url ? (
                          <img
                            src={table.qr_code_url}
                            alt={`QR Thumbnail for Table ${table.table_number}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="animate-pulse bg-zinc-200 w-full h-full rounded" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#222222] flex items-center justify-between gap-3">
                      {table.qr_code_url ? (
                        <a
                          href={table.qr_code_url}
                          download={downloadName}
                          className="flex-1 h-9 bg-[#222222] hover:bg-zinc-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1.5 border border-[#333333] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none"
                        >
                          <svg className="w-3.5 h-3.5 text-[#a8a8a8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download QR</span>
                        </a>
                      ) : (
                        <div className="flex-1 h-9 bg-[#111111] text-[#444444] text-xs font-semibold rounded-md flex items-center justify-center border border-[#1e1e1e]">
                          Generating…
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setTableToDelete(table)}
                        className="w-9 h-9 bg-red-950/15 hover:bg-red-950/30 text-red-400 border border-red-900/30 rounded-md transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                        aria-label={`Delete Table ${table.table_number}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal Overlay */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-[#181818] border border-[#222222] p-6 rounded-xl max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">

            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 id="modal-title" className="text-lg font-bold text-white tracking-tight">
                Delete Table {tableToDelete.table_number}?
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-[#a8a8a8] leading-relaxed">
                Are you sure you want to delete table <strong className="text-white">"{tableToDelete.table_number}"</strong>?
              </p>
              <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg text-xs text-red-400 leading-relaxed">
                <strong>CRITICAL WARNING:</strong> Deleting this table will permanently delete all associated customer orders and checkout history due to cascading rules. This action cannot be undone.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isPendingDelete}
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 bg-[#222222] hover:bg-zinc-800 text-[#a8a8a8] hover:text-white text-sm font-semibold rounded-md border border-[#333333] transition-colors focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPendingDelete}
                onClick={confirmDeleteTable}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-colors flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPendingDelete ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting…</span>
                  </span>
                ) : (
                  <span>Delete Table</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
