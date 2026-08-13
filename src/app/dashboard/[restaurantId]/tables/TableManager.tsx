'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null)
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

  // Handle adding a table
  const handleAddTableSubmit = (e?: React.FormEvent<HTMLFormElement>, overrideValue?: string) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const targetNumber = (overrideValue || tableNumber).trim()
    if (!targetNumber) {
      setError('Table label or number cannot be empty.')
      return
    }

    startTransitionAdd(async () => {
      const res = await addTable(restaurantId, targetNumber)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccessMsg(`Table "${targetNumber}" added successfully!`)
        setTableNumber('')
        router.refresh()
      }
    })
  }

  // Handle deleting a table
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

  // Copy Menu URL to clipboard
  const handleCopyUrl = (tableId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    const menuUrl = `${origin}/menu/${restaurantId}/${tableId}`
    navigator.clipboard.writeText(menuUrl)
    setCopiedTableId(tableId)
    setTimeout(() => setCopiedTableId(null), 2000)
  }

  // Filtered tables based on search query
  const filteredTables = tables.filter((t) =>
    t.table_number.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  // Calculate next table recommendation number
  const numericTables = tables
    .map((t) => parseInt(t.table_number, 10))
    .filter((n) => !isNaN(n))
  const nextRecommendedNum = numericTables.length > 0 ? Math.max(...numericTables) + 1 : 1

  return (
    <DashboardLayout
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      activePage="tables"
      headerActions={
        <Link
          href={`/dashboard/${restaurantId}/tables/print`}
          className="text-xs text-white bg-[#5e6ad2] hover:bg-[#828fff] active:bg-[#5e69d1] px-3.5 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:outline-none"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="hidden sm:inline">Print All QR Codes</span>
          <span className="sm:hidden">Print QRs</span>
        </Link>
      }
    >
      <div className="p-6 sm:p-8 max-w-[1600px] w-full mx-auto relative z-10 space-y-8">

        {/* Top Metric & Control Header Strip */}
        <section className="bg-[#0f1011] border border-[#23252a] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Eyebrow */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
                  TABLE MANAGEMENT
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#18191a] text-[#27a644] border border-[#14331e]">
                  REALTIME ENDPOINTS
                </span>
              </div>
              <h1 className="text-xl font-semibold text-[#f7f8f8] tracking-tight">
                Dining Tables & QR Menus
              </h1>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#141516] border border-[#23252a] px-3.5 py-2 rounded-lg flex items-center space-x-3 text-xs">
                <span className="text-[#8a8f98]">Registered Tables</span>
                <span className="font-mono font-semibold text-[#f7f8f8]">{tables.length}</span>
              </div>

              <div className="bg-[#141516] border border-[#23252a] px-3.5 py-2 rounded-lg flex items-center space-x-3 text-xs">
                <span className="text-[#8a8f98]">Active QRs</span>
                <span className="font-mono font-semibold text-[#27a644]">{tables.filter(t => t.qr_code_url).length}</span>
              </div>

              <Link
                href={`/dashboard/${restaurantId}/tables/print`}
                className="bg-[#141516] hover:bg-[#18191a] border border-[#23252a] hover:border-[#34343a] px-3.5 py-2 rounded-lg flex items-center space-x-2 text-xs text-[#d0d6e0] hover:text-[#f7f8f8] transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#5e6ad2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Layout</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Column: Add Table Panel (Surface 1 #0f1011) */}
          <section className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
            <div className="bg-[#0f1011] border border-[#23252a] p-6 rounded-xl space-y-5 shadow-sm">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
                  CONFIGURATION
                </div>
                <h2 className="text-base font-semibold text-[#f7f8f8] tracking-tight">
                  Add New Table
                </h2>
                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Generate a physical table entry with a dedicated QR code endpoint for instant customer ordering.
                </p>
              </div>

              {error && (
                <div className="bg-[#1c0c0d] border border-[#361719] text-[#ff6b6b] text-xs p-3 rounded-md leading-normal" role="alert">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-[#09150d] border border-[#14331e] text-[#27a644] text-xs p-3 rounded-md leading-normal" role="status">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleAddTableSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="table-number-input" className="text-[11px] font-mono text-[#8a8f98] uppercase tracking-wider block font-medium">
                    Table Number or Label
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono text-[#62666d]">
                      TBL -
                    </span>
                    <input
                      id="table-number-input"
                      name="tableNumber"
                      type="text"
                      required
                      spellCheck={false}
                      autoComplete="off"
                      placeholder={`e.g. ${nextRecommendedNum}, Bar-2, VIP-1`}
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full h-10 bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-md pl-14 pr-3.5 text-sm focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/50 transition-colors placeholder:text-[#62666d]"
                    />
                  </div>
                </div>

                {/* Quick Add Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#62666d] uppercase tracking-wider">
                    Quick Suggestions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddTableSubmit(undefined, String(nextRecommendedNum))}
                      disabled={isPendingAdd}
                      className="text-[11px] font-mono bg-[#141516] hover:bg-[#18191a] border border-[#23252a] hover:border-[#34343a] text-[#8a8f98] hover:text-[#f7f8f8] px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      + Table {nextRecommendedNum}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableNumber(`Bar-${tables.length + 1}`)}
                      className="text-[11px] font-mono bg-[#141516] hover:bg-[#18191a] border border-[#23252a] hover:border-[#34343a] text-[#8a8f98] hover:text-[#f7f8f8] px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      + Bar-{tables.length + 1}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableNumber(`VIP-${tables.length + 1}`)}
                      className="text-[11px] font-mono bg-[#141516] hover:bg-[#18191a] border border-[#23252a] hover:border-[#34343a] text-[#8a8f98] hover:text-[#f7f8f8] px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      + VIP-{tables.length + 1}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPendingAdd}
                  className="w-full h-10 bg-[#5e6ad2] hover:bg-[#828fff] active:bg-[#5e69d1] text-white text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:outline-none shadow-sm"
                >
                  {isPendingAdd ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating QR…</span>
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Table</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* How QR Ordering Works Info Card */}
            <div className="bg-[#0f1011] border border-[#23252a] p-5 rounded-xl space-y-3 shadow-sm">
              <h3 className="text-xs font-mono text-[#8a8f98] uppercase tracking-wider font-medium flex items-center space-x-2">
                <svg className="w-4 h-4 text-[#5e6ad2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>How QR Ordering Works</span>
              </h3>
              <ul className="space-y-2 text-xs text-[#8a8f98]">
                <li className="flex items-start space-x-2">
                  <span className="font-mono text-[#5e6ad2] font-semibold">1.</span>
                  <span>Print out QR placard codes using the layout printer button.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-mono text-[#5e6ad2] font-semibold">2.</span>
                  <span>Diners scan the table QR code to open your interactive menu.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-mono text-[#5e6ad2] font-semibold">3.</span>
                  <span>Orders route automatically to your live Kitchen Feed.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Right Column: Tables List Workspace */}
          <section className="flex-1 space-y-5 w-full min-w-0">

            {/* Controls Bar: Search & View Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f1011] border border-[#23252a] p-3 rounded-xl">
              
              {/* Search Bar */}
              <div className="relative flex-1 flex items-center">
                <svg
                  className="w-4 h-4 text-[#62666d] absolute left-3 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Filter tables by label or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3.5 bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-md text-xs focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/50 placeholder:text-[#62666d] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-xs text-[#8a8f98] hover:text-[#f7f8f8]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center space-x-1 bg-[#141516] border border-[#23252a] p-1 rounded-lg self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#18191a] text-[#f7f8f8] border border-[#2b2d35] font-medium shadow-sm'
                      : 'text-[#8a8f98] hover:text-[#f7f8f8]'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#18191a] text-[#f7f8f8] border border-[#2b2d35] font-medium shadow-sm'
                      : 'text-[#8a8f98] hover:text-[#f7f8f8]'
                  }`}
                  title="List View"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>List</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#0f1011] border border-[#23252a] rounded-xl text-center p-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#141516] border border-[#23252a] flex items-center justify-center text-[#8a8f98]">
                  <svg className="w-6 h-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#f7f8f8] font-medium text-sm">
                    {searchQuery ? `No tables matching "${searchQuery}"` : 'No Tables Registered'}
                  </h3>
                  <p className="text-xs text-[#8a8f98] max-w-xs mt-1 leading-relaxed">
                    {searchQuery ? 'Try clearing your search query.' : 'Register tables using the form on the left to generate QR codes for customer self-ordering.'}
                  </p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              
              /* GRID VIEW MODE (2-up at xl to prevent card squishing) */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {filteredTables.map((table) => {
                  const downloadName = `table-${table.table_number.toLowerCase().replace(/\s+/g, '-')}-qr.png`
                  const isCopied = copiedTableId === table.id

                  return (
                    <div
                      key={table.id}
                      className="bg-[#0f1011] border border-[#23252a] hover:border-[#34343a] rounded-xl p-5 hover:bg-[#141516]/60 transition-all flex flex-col justify-between space-y-4 group shadow-sm relative"
                    >
                      {/* Top Hairline Highlight */}
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#34343a]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium whitespace-nowrap">
                              LABEL
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-[#09150d] border border-[#14331e] text-[#27a644] whitespace-nowrap">
                              <span className="w-1 h-1 rounded-full bg-[#27a644] mr-1 animate-pulse" />
                              Active
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-[#f7f8f8] tracking-tight truncate">
                            Table {table.table_number}
                          </h3>
                        </div>

                        {/* QR Code Frame */}
                        <div className="w-16 h-16 bg-white p-1 rounded-lg border border-[#23252a] flex-shrink-0 flex items-center justify-center shadow-md relative group/qr">
                          {table.qr_code_url ? (
                            <img
                              src={table.qr_code_url}
                              alt={`QR Code for Table ${table.table_number}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="animate-pulse bg-zinc-200 w-full h-full rounded" />
                          )}
                        </div>
                      </div>

                      {/* URL Link Bar & Quick Copy */}
                      <div className="bg-[#141516] border border-[#23252a] rounded-md p-2 flex items-center justify-between text-xs space-x-2">
                        <div className="truncate font-mono text-[10px] text-[#8a8f98] flex-1" title={`/menu/${restaurantId}/${table.id}`}>
                          /menu/.../{table.id.slice(0, 8)}
                        </div>

                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(table.id)}
                            className="px-2 py-1 bg-[#18191a] hover:bg-[#23252a] border border-[#2b2d35] text-[10px] font-mono text-[#d0d6e0] hover:text-white rounded transition-colors flex items-center space-x-1 whitespace-nowrap"
                            title="Copy Direct Menu URL"
                          >
                            {isCopied ? (
                              <span className="text-[#27a644] font-medium">Copied!</span>
                            ) : (
                              <>
                                <svg className="w-3 h-3 text-[#8a8f98]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {/* Open Live Customer Menu Preview */}
                          <Link
                            href={`/menu/${restaurantId}/${table.id}`}
                            target="_blank"
                            className="p-1 text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#18191a] rounded transition-colors"
                            title="Test / Preview Customer Menu"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-3 border-t border-[#23252a] flex items-center justify-between gap-2">
                        {table.qr_code_url ? (
                          <a
                            href={table.qr_code_url}
                            download={downloadName}
                            className="flex-1 h-8 bg-[#141516] hover:bg-[#18191a] text-[#f7f8f8] border border-[#23252a] hover:border-[#34343a] text-xs font-medium rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:outline-none whitespace-nowrap px-3"
                          >
                            <svg className="w-3.5 h-3.5 text-[#8a8f98]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download PNG</span>
                          </a>
                        ) : (
                          <div className="flex-1 h-8 bg-[#141516] text-[#62666d] text-xs font-medium rounded-md flex items-center justify-center border border-[#23252a]">
                            Generating…
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setTableToDelete(table)}
                          className="w-8 h-8 flex-shrink-0 bg-[#1c0c0d] hover:bg-[#2d1215] text-[#ff6b6b] border border-[#361719] hover:border-[#5a1f24] rounded-md transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/50 focus-visible:outline-none"
                          aria-label={`Delete Table ${table.table_number}`}
                          title="Delete Table"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (

              /* COMPACT LIST VIEW MODE */
              <div className="bg-[#0f1011] border border-[#23252a] rounded-xl divide-y divide-[#23252a] overflow-hidden shadow-sm">
                {filteredTables.map((table) => {
                  const downloadName = `table-${table.table_number.toLowerCase().replace(/\s+/g, '-')}-qr.png`
                  const isCopied = copiedTableId === table.id

                  return (
                    <div
                      key={table.id}
                      className="p-4 hover:bg-[#141516]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left info */}
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-white p-1 rounded border border-[#23252a] flex-shrink-0 flex items-center justify-center">
                          {table.qr_code_url ? (
                            <img src={table.qr_code_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <div className="animate-pulse bg-zinc-200 w-full h-full rounded" />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-semibold text-[#f7f8f8] truncate">
                              Table {table.table_number}
                            </h3>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-[#09150d] border border-[#14331e] text-[#27a644] flex-shrink-0">
                              Active
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[#8a8f98] truncate">
                            /menu/{restaurantId}/{table.id}
                          </p>
                        </div>
                      </div>

                      {/* Right action group */}
                      <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(table.id)}
                          className="px-3 py-1.5 bg-[#141516] hover:bg-[#18191a] border border-[#23252a] text-xs font-mono text-[#d0d6e0] rounded transition-colors whitespace-nowrap"
                        >
                          {isCopied ? 'Copied!' : 'Copy URL'}
                        </button>

                        {table.qr_code_url && (
                          <a
                            href={table.qr_code_url}
                            download={downloadName}
                            className="px-3 py-1.5 bg-[#141516] hover:bg-[#18191a] text-[#f7f8f8] border border-[#23252a] text-xs font-medium rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5 text-[#8a8f98]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setTableToDelete(table)}
                          className="p-1.5 bg-[#1c0c0d] hover:bg-[#2d1215] text-[#ff6b6b] border border-[#361719] rounded transition-colors flex-shrink-0"
                          title="Delete Table"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010102]/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-[#0f1011] border border-[#23252a] p-6 rounded-xl max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">

            <div className="flex items-center space-x-3 text-[#ff6b6b]">
              <div className="w-9 h-9 rounded-full bg-[#1c0c0d] border border-[#361719] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 id="modal-title" className="text-base font-semibold text-[#f7f8f8] tracking-tight">
                Delete Table {tableToDelete.table_number}?
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Are you sure you want to delete table <strong className="text-[#f7f8f8]">"{tableToDelete.table_number}"</strong>?
              </p>
              <div className="bg-[#1c0c0d] border border-[#361719] p-3 rounded-lg text-xs text-[#ff6b6b] leading-relaxed">
                <strong>CRITICAL WARNING:</strong> Deleting this table will permanently delete all associated customer orders and checkout history. This action cannot be undone.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                disabled={isPendingDelete}
                onClick={() => setTableToDelete(null)}
                className="px-3.5 py-2 bg-[#141516] hover:bg-[#18191a] text-[#d0d6e0] hover:text-[#f7f8f8] text-xs font-medium rounded-md border border-[#23252a] hover:border-[#34343a] transition-colors focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPendingDelete}
                onClick={confirmDeleteTable}
                className="px-3.5 py-2 bg-[#e5484d] hover:bg-[#f2555a] text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/50 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPendingDelete ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
    </DashboardLayout>
  )
}
