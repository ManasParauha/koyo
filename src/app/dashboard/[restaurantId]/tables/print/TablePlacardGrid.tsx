'use client'

import React, { useState } from 'react'

export interface TableItem {
  id: string
  restaurant_id: string
  table_number: string
  qr_code_url?: string | null
  created_at?: string
}

interface TablePlacardGridProps {
  tables: TableItem[]
  restaurantName: string
  restaurantId: string
  baseDomain: string
}

export function TablePlacardGrid({
  tables,
  restaurantName,
  restaurantId,
  baseDomain,
}: TablePlacardGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showGuidelines, setShowGuidelines] = useState(true)

  const cleanDomain = baseDomain.replace(/^https?:\/\//, '')

  // Filter tables by search query
  const filteredTables = tables.filter((table) =>
    table.table_number.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const handleCopyUrl = async (tableId: string, path: string) => {
    const fullUrl = `${baseDomain}${path}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedId(tableId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback if clipboard API unavailable
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Guidelines Control Bar (Hidden during printing) */}
      <div className="print:hidden space-y-4">
        {/* Guidelines Banner - Linear Dark Technical Spec Card */}
        <div className="bg-[#0f1011] border border-[#23252a] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all">
          <div className="flex items-center justify-between px-4 py-3 bg-[#141516]/60 border-b border-[#23252a]/80">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2 w-2 rounded-full bg-[#5e6ad2] animate-pulse" />
              <h2 className="text-xs font-semibold tracking-wide text-[#f7f8f8] uppercase font-mono">
                Print Setup & Specifications
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="text-xs text-[#8a8f98] hover:text-[#f7f8f8] px-2 py-1 rounded hover:bg-[#18191a] transition-colors flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:outline-none"
              aria-label={showGuidelines ? 'Collapse print guidelines' : 'Expand print guidelines'}
            >
              <span>{showGuidelines ? 'Hide' : 'Show Setup'}</span>
              <svg
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  showGuidelines ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showGuidelines && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#8a8f98]">
              <div className="flex items-center space-x-3 bg-[#010102] border border-[#23252a] p-3 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2] shrink-0">
                  📄
                </div>
                <div>
                  <p className="text-[#f7f8f8] font-medium text-[11px]">Paper Size</p>
                  <p className="text-[#8a8f98] text-[11px]">Set printer to <span className="text-[#f7f8f8]">A4</span></p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-[#010102] border border-[#23252a] p-3 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2] shrink-0">
                  📐
                </div>
                <div>
                  <p className="text-[#f7f8f8] font-medium text-[11px]">Orientation</p>
                  <p className="text-[#8a8f98] text-[11px]">Select <span className="text-[#f7f8f8]">Portrait</span> layout</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-[#010102] border border-[#23252a] p-3 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2] shrink-0">
                  🔍
                </div>
                <div>
                  <p className="text-[#f7f8f8] font-medium text-[11px]">Scaling</p>
                  <p className="text-[#8a8f98] text-[11px]">Set to <span className="text-[#f7f8f8]">100% / Actual Size</span></p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-[#010102] border border-[#23252a] p-3 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-[#5e6ad2] shrink-0">
                  🎨
                </div>
                <div>
                  <p className="text-[#f7f8f8] font-medium text-[11px]">Backgrounds</p>
                  <p className="text-[#8a8f98] text-[11px]">Enable <span className="text-[#f7f8f8]">Background graphics</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: Search input & Status counter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f1011] p-3 rounded-xl border border-[#23252a]">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#62666d]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table by number…"
              className="w-full bg-[#010102] text-[#f7f8f8] placeholder-[#62666d] text-xs rounded-md pl-9 pr-8 py-2 border border-[#23252a] focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2] focus:outline-none transition-colors"
              aria-label="Filter tables by number"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#62666d] hover:text-[#f7f8f8]"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#8a8f98]">
            <span className="bg-[#141516] border border-[#23252a] px-2.5 py-1 rounded-full text-[11px] font-mono text-[#d0d6e0]">
              {filteredTables.length} of {tables.length} Placards
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Placards */}
      {filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#0f1011] border border-[#23252a] rounded-2xl print:hidden">
          <div className="w-12 h-12 rounded-full bg-[#141516] border border-[#23252a] flex items-center justify-center text-[#8a8f98] mb-3">
            🔍
          </div>
          <p className="text-sm font-medium text-[#f7f8f8]">No matching tables found</p>
          <p className="text-xs text-[#8a8f98] mt-1">Try clearing your search query or add new tables.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8 print:block print:space-y-0">
          {filteredTables.map((table) => {
            const menuPath = `/menu/${restaurantId}/${table.id}`
            const isCopied = copiedId === table.id

            // Format display table number (e.g. Single digits get formatted cleanly)
            const displayTableNum = table.table_number.toUpperCase().startsWith('TABLE')
              ? table.table_number.toUpperCase()
              : `TABLE ${table.table_number}`

            return (
              <article
                key={table.id}
                className="group relative bg-[#0f1011] hover:bg-[#141516] border border-[#23252a] hover:border-[#34343a] rounded-2xl p-6 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col items-center text-center overflow-hidden break-inside-avoid print:bg-white print:border-2 print:border-black print:rounded-2xl print:p-8 print:shadow-none print:mb-8 print:page-break-inside-avoid"
              >
                {/* Top highlight hairline (screen only) */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#34343a]/60 to-transparent group-hover:via-[#5e6ad2]/50 transition-colors print:hidden" />

                {/* Placard Container */}
                <div className="w-full flex flex-col items-center space-y-4">
                  {/* Restaurant Name Badge */}
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5e6ad2] print:bg-black inline-block" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors font-mono print:text-black">
                      {restaurantName}
                    </span>
                  </div>

                  {/* QR Code Outer Box */}
                  <div className="relative bg-white p-3.5 rounded-xl border border-white/20 shadow-md group-hover:shadow-xl transition-all duration-200 flex items-center justify-center w-52 h-52 print:w-56 print:h-56 print:rounded-xl print:border-2 print:border-black print:shadow-none">
                    {table.qr_code_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={table.qr_code_url}
                        alt={`QR code for ${displayTableNum} at ${restaurantName}`}
                        className="w-full h-full object-contain"
                        loading="eager"
                      />
                    ) : (
                      <div className="bg-zinc-100 w-full h-full rounded flex items-center justify-center text-xs text-zinc-400 font-mono">
                        Generating QR…
                      </div>
                    )}
                  </div>

                  {/* Table Title & Number */}
                  <div className="space-y-1 w-full">
                    <h3 className="text-2xl font-bold text-[#f7f8f8] print:text-black tracking-tight font-sans uppercase">
                      {displayTableNum}
                    </h3>

                    {/* Copyable URL Pill */}
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(table.id, menuPath)}
                      className="inline-flex items-center justify-center gap-1.5 max-w-[240px] text-[11px] font-mono text-[#8a8f98] hover:text-[#f7f8f8] bg-[#010102] hover:bg-[#18191a] border border-[#23252a] hover:border-[#34343a] px-2.5 py-1 rounded-md transition-all truncate group/btn print:border-none print:bg-transparent print:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5e6ad2] focus-visible:outline-none"
                      title="Click to copy menu link"
                      aria-label={`Copy menu link for ${displayTableNum}`}
                    >
                      <span className="truncate">{cleanDomain}{menuPath}</span>
                      <svg
                        className={`w-3 h-3 shrink-0 transition-colors print:hidden ${
                          isCopied ? 'text-[#27a644]' : 'text-[#62666d] group-hover/btn:text-[#f7f8f8]'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        {isCopied ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        )}
                      </svg>
                    </button>
                  </div>

                  {/* Divider Rule */}
                  <div className="w-12 h-0.5 bg-[#5e6ad2] print:bg-black rounded-full" />

                  {/* Scan Instruction Footer */}
                  <div className="flex items-center justify-center space-x-1.5 text-[10px] text-[#8a8f98] print:text-black font-medium tracking-wider uppercase font-mono">
                    <svg className="w-3.5 h-3.5 text-[#5e6ad2] print:text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Scan with camera to order & pay</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
