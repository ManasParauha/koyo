'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DashboardLayoutProps {
  restaurantId: string
  restaurantName: string
  activePage: 'kitchen' | 'tables' | 'menu' | 'analytics' | 'print'
  activeOrdersCount?: number
  isConnected?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  headerActions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayout({
  restaurantId,
  restaurantName,
  activePage,
  activeOrdersCount,
  isConnected = true,
  searchQuery,
  onSearchChange,
  headerActions,
  children,
}: DashboardLayoutProps) {
  const router = useRouter()

  // State for desktop sidebar rail (collapsed vs expanded)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  // State for mobile drawer sidebar (open vs closed)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  // Toggle sidebar collapse state and persist preference in localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('koyo_sidebar_collapsed', String(nextState))
      }
      return nextState
    })
  }

  // Load saved sidebar state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('koyo_sidebar_collapsed')
      if (saved === 'true') {
        setIsCollapsed(true)
      }
    }
  }, [])

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout failed:', error.message)
    }
    router.push('/dashboard/login')
    router.refresh()
  }

  const mainNavItems = [
    {
      id: 'kitchen',
      label: 'Kitchen Feed',
      href: `/dashboard/${restaurantId}`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      badge: activeOrdersCount !== undefined ? activeOrdersCount : null,
    },
    {
      id: 'tables',
      label: 'Manage Tables',
      href: `/dashboard/${restaurantId}/tables`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      id: 'menu',
      label: 'Manage Menu',
      href: `/dashboard/${restaurantId}/menu`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ]

  const insightNavItems = [
    {
      id: 'analytics',
      label: 'Analytics',
      href: `/dashboard/${restaurantId}/analytics`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
    },
    {
      id: 'print',
      label: 'Print QR Codes',
      href: `/dashboard/${restaurantId}/tables/print`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
    },
  ]

  const getPageTitle = () => {
    switch (activePage) {
      case 'kitchen':
        return 'Kitchen Feed'
      case 'tables':
        return 'Table Management'
      case 'menu':
        return 'Menu Management'
      case 'analytics':
        return 'Analytics Overview'
      case 'print':
        return 'Print QR Codes'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-[#010102] text-[#f7f8f8] font-sans flex flex-col md:flex-row antialiased selection:bg-[#5e6ad2]/30 selection:text-[#f7f8f8]">
      {/* Mobile Header Overlay / Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#010102]/80 backdrop-blur-sm md:hidden transition-opacity duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Component (Desktop Rail & Mobile Drawer) */}
      <aside
        className={`
          fixed md:sticky top-0 z-50 h-screen bg-[#0f1011] border-r border-[#23252a] flex flex-col justify-between
          transition-[width,transform] duration-200 ease-out select-none
          ${isMobileOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-14' : 'md:w-56'}
        `}
      >
        {/* Top Branding & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-none">
          {/* Brand Header */}
          <div className="h-14 flex items-center justify-between px-3 border-b border-[#23252a]">
            <Link
              href={`/dashboard/${restaurantId}`}
              className="flex items-center space-x-2.5 overflow-hidden group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2] rounded-md p-1"
            >
              {/* Sleek Dark Logo Mark */}
              <div className="w-7 h-7 rounded-md bg-[#18191a] border border-[#2b2d35] flex items-center justify-center text-[#5e6ad2] font-semibold text-xs flex-shrink-0 shadow-sm group-hover:border-[#5e6ad2]/50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col truncate leading-none">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-[#f7f8f8] text-xs tracking-tight uppercase">
                      KOYO
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#18191a] text-[#8a8f98] border border-[#23252a]">
                      OS
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8a8f98] truncate max-w-[120px] mt-0.5" title={restaurantName}>
                    {restaurantName}
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden text-[#8a8f98] hover:text-[#f7f8f8] p-1 rounded-md transition-colors"
              aria-label="Close Mobile Sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Navigation List */}
          <div className="p-2 space-y-4">
            {/* Section 1: Main */}
            <div>
              {!isCollapsed && (
                <div className="text-[10px] font-mono tracking-wider text-[#62666d] uppercase px-2.5 py-1 font-medium">
                  Workspace
                </div>
              )}
              <nav className="space-y-0.5">
                {mainNavItems.map((item) => {
                  const isActive = activePage === item.id

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        relative flex items-center h-8 px-2.5 rounded-md text-xs font-medium transition-all duration-150 group
                        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2]
                        ${
                          isActive
                            ? 'bg-[#18191a] text-[#f7f8f8] border border-[#2b2d35] font-semibold shadow-sm'
                            : 'text-[#8a8f98] hover:bg-[#141516] hover:text-[#f7f8f8] border border-transparent'
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#5e6ad2] rounded-full" />
                      )}

                      <span
                        className={`flex-shrink-0 ${
                          isActive ? 'text-[#5e6ad2]' : 'text-[#8a8f98] group-hover:text-[#d0d6e0]'
                        }`}
                      >
                        {item.icon}
                      </span>

                      {!isCollapsed && <span className="ml-2.5 truncate">{item.label}</span>}

                      {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                        <span className="ml-auto font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#1e2025] text-[#d0d6e0] border border-[#2d2f38] font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Section 2: Insights */}
            <div>
              {!isCollapsed && (
                <div className="text-[10px] font-mono tracking-wider text-[#62666d] uppercase px-2.5 py-1 font-medium">
                  Insights & QR
                </div>
              )}
              <nav className="space-y-0.5">
                {insightNavItems.map((item) => {
                  const isActive = activePage === item.id

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        relative flex items-center h-8 px-2.5 rounded-md text-xs font-medium transition-all duration-150 group
                        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2]
                        ${
                          isActive
                            ? 'bg-[#18191a] text-[#f7f8f8] border border-[#2b2d35] font-semibold shadow-sm'
                            : 'text-[#8a8f98] hover:bg-[#141516] hover:text-[#f7f8f8] border border-transparent'
                        }
                      `}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#5e6ad2] rounded-full" />
                      )}

                      <span
                        className={`flex-shrink-0 ${
                          isActive ? 'text-[#5e6ad2]' : 'text-[#8a8f98] group-hover:text-[#d0d6e0]'
                        }`}
                      >
                        {item.icon}
                      </span>

                      {!isCollapsed && <span className="ml-2.5 truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Connection Status, User & Rail Toggle */}
        <div className="p-2 border-t border-[#23252a] space-y-1.5">
          {/* Live Status Pill */}
          <div
            className={`
              flex items-center px-2 py-1.5 rounded-md text-[11px] font-mono border transition-colors
              ${
                isConnected
                  ? 'bg-[#09150d] border-[#14331e] text-[#27a644]'
                  : 'bg-[#1c0c0d] border-[#361719] text-[#ff4d4d]'
              }
              ${isCollapsed ? 'justify-center' : 'space-x-2'}
            `}
            title={isConnected ? 'Realtime live connection active' : 'Offline / Reconnecting'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-[#27a644] animate-pulse' : 'bg-red-500'
              }`}
            />
            {!isCollapsed && <span className="truncate">{isConnected ? 'Syncing Live' : 'Offline'}</span>}
          </div>

          {/* User Staff Profile Row with Clean Integrated Logout */}
          <div
            className={`
              flex items-center p-1.5 rounded-md bg-[#141516] border border-[#23252a] text-xs
              ${isCollapsed ? 'justify-center' : 'justify-between'}
            `}
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-5 h-5 rounded-full bg-[#18191a] border border-[#34343a] text-[#d0d6e0] flex items-center justify-center text-[10px] font-mono font-medium flex-shrink-0">
                    S
                  </div>
                  <div className="flex flex-col truncate leading-none">
                    <span className="text-[11px] text-[#f7f8f8] font-medium truncate">Kitchen Staff</span>
                    <span className="text-[9px] text-[#8a8f98] font-mono truncate">Online</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-[#8a8f98] hover:text-[#ff4d4d] hover:bg-[#231718] rounded transition-colors cursor-pointer flex-shrink-0"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="p-1 text-[#8a8f98] hover:text-[#ff4d4d] hover:bg-[#231718] rounded transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>

          {/* Desktop Rail Toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden md:flex w-full items-center justify-center py-1 text-[11px] font-mono text-[#62666d] hover:text-[#8a8f98] hover:bg-[#141516] rounded transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!isCollapsed && <span className="ml-1.5">Collapse (Ctrl+B)</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-[#010102]/80 backdrop-blur-md border-b border-[#23252a] h-14 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 text-[#8a8f98] hover:text-[#f7f8f8] bg-[#0f1011] border border-[#23252a] rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2]"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#8a8f98] font-mono hidden sm:inline">{restaurantName}</span>
              <span className="text-[#34343a] hidden sm:inline">/</span>
              <h1 className="text-sm font-semibold text-[#f7f8f8] tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Optional Search Receipt Input */}
          {onSearchChange !== undefined && (
            <div className="flex-1 max-w-[180px] sm:max-w-xs mx-3 sm:mx-6">
              <div className="relative flex items-center">
                <svg
                  className="w-3.5 h-3.5 text-[#62666d] absolute left-2.5 pointer-events-none z-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search receipt #…"
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-[#0f1011] text-[#f7f8f8] border border-[#23252a] rounded-md focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/40 transition-all font-mono placeholder:text-[#62666d]"
                />
              </div>
            </div>
          )}

          {/* Right Header Custom Action Slot */}
          {headerActions && <div className="flex items-center space-x-2.5">{headerActions}</div>}
        </header>

        {/* Children Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
