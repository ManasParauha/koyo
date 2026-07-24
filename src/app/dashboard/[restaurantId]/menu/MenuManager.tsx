'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  upsertMenuItem, 
  deleteMenuItem, 
  toggleMenuItemAvailability 
} from './actions'

interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  price: number | string
  category: string
  image_url: string | null
  is_available: boolean
  is_veg: boolean
  created_at: string
}

interface MenuManagerProps {
  restaurantId: string
  restaurantName: string
  initialMenuItems: MenuItem[]
}

export function MenuManager({ restaurantId, restaurantName, initialMenuItems }: MenuManagerProps) {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sync state with incoming props on router refresh
  useEffect(() => {
    setMenuItems(initialMenuItems)
  }, [initialMenuItems])

  // Group menu items by category
  const categories = Array.from(new Set(menuItems.map(item => item.category)))
  const menuByCategory: Record<string, MenuItem[]> = {}
  menuItems.forEach(item => {
    if (!menuByCategory[item.category]) {
      menuByCategory[item.category] = []
    }
    menuByCategory[item.category].push(item)
  })

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [isVeg, setIsVeg] = useState(true)
  
  // Image Upload States
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Category Auto-suggest States
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const filteredSuggestions = categories.filter(cat => 
    cat.toLowerCase().includes(category.toLowerCase()) && 
    cat.toLowerCase() !== category.toLowerCase()
  )

  // Delete Dialog States
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)

  // Transitions
  const [isPendingSave, startTransitionSave] = useTransition()
  const [isPendingDelete, startTransitionDelete] = useTransition()

  // Reset Form
  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCategory('')
    setIsVeg(true)
    setImageUrl(null)
    setImageFile(null)
    setUploadStatus('idle')
    setUploadError(null)
    setEditingItem(null)
    setErrorMsg(null)
  }

  // Open Form for Add
  const handleOpenAdd = () => {
    resetForm()
    setIsFormOpen(true)
  }

  // Open Form for Edit
  const handleOpenEdit = (item: MenuItem) => {
    resetForm()
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description || '')
    setPrice(item.price.toString())
    setCategory(item.category)
    setIsVeg(item.is_veg)
    setImageUrl(item.image_url)
    setIsFormOpen(true)
  }

  // Handle Image File Select & Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadStatus('idle')

    // Client-side validation: size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file size must be less than 5MB.')
      setUploadStatus('error')
      return
    }

    // Client-side validation: format (jpg, png, webp)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP image formats are allowed.')
      setUploadStatus('error')
      return
    }

    setImageFile(file)
    setUploadStatus('uploading')

    try {
      const supabase = createClient()
      
      // Clean filename for safety and add uniqueness
      const fileExt = file.name.split('.').pop()
      const sanitizedName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedName}_${Date.now()}.${fileExt}`
      const filePath = `${restaurantId}/${filename}`

      // Upload to bucket
      const { error: uploadErr } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadErr) {
        throw new Error(uploadErr.message)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      setUploadStatus('success')
    } catch (err: any) {
      console.error('Image upload failed:', err)
      setUploadError(err.message || 'Failed to upload image. Please try again.')
      setUploadStatus('error')
    }
  }

  // Handle Save (Add/Edit Submit)
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Form Client-side validation
    if (!name.trim()) {
      setErrorMsg('Name is required.')
      return
    }
    if (!category.trim()) {
      setErrorMsg('Category is required.')
      return
    }
    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMsg('Price must be a positive number.')
      return
    }

    if (uploadStatus === 'uploading') {
      setErrorMsg('Please wait for the image upload to complete.')
      return
    }

    startTransitionSave(async () => {
      const res = await upsertMenuItem(restaurantId, {
        id: editingItem?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        price: numericPrice,
        category: category.trim(),
        is_veg: isVeg,
        image_url: imageUrl,
        is_available: editingItem ? editingItem.is_available : true
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg(
          editingItem 
            ? `Menu item "${name}" updated successfully!` 
            : `Menu item "${name}" added successfully!`
        )
        setIsFormOpen(false)
        resetForm()
        router.refresh()
      }
    })
  }

  // Handle Optimistic Availability Toggle
  const handleToggleAvailable = async (itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setErrorMsg(null)
    setSuccessMsg(null)

    // Save previous state for rollback on error
    const originalItems = [...menuItems]

    // Optimistic Update
    setMenuItems(prev => 
      prev.map(item => item.id === itemId ? { ...item, is_available: newStatus } : item)
    )

    const res = await toggleMenuItemAvailability(restaurantId, itemId, newStatus)
    if (res.error) {
      // Rollback on error
      setMenuItems(originalItems)
      setErrorMsg(`Failed to update item availability: ${res.error}`)
    } else {
      router.refresh()
    }
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!itemToDelete) return

    setErrorMsg(null)
    setSuccessMsg(null)

    startTransitionDelete(async () => {
      const res = await deleteMenuItem(restaurantId, itemToDelete.id)
      if (res.error) {
        setErrorMsg(res.error)
        setItemToDelete(null)
      } else {
        setSuccessMsg(`Menu item "${itemToDelete.name}" deleted successfully.`)
        setItemToDelete(null)
        router.refresh()
      }
    })
  }

  const formatPrice = (p: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(Number(p))
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans flex flex-col relative overflow-hidden">
      {/* Blue Spotlight Glow Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0007cd]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-6 sm:px-8 relative z-10">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-white text-lg tracking-tight uppercase">
            Menu Management
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

        <div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="text-xs text-white bg-[#0007cd] hover:bg-[#0005a3] px-3.5 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 shadow-md focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Menu Item</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1200px] w-full mx-auto relative z-10">
        
        {/* Success/Error Banners */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 text-[#ff4d4d] text-sm rounded-lg flex items-start space-x-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-900/30 text-[#33d17a] text-sm rounded-lg flex items-start space-x-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#181818] border border-[#222222] rounded-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#222222] text-[#888888] mb-6 border border-[#333333]">
              <svg className="w-10 h-10 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight mb-2">No menu items found</h2>
            <p className="text-sm text-[#888888] max-w-md leading-relaxed mb-6">
              You haven't added any menu items yet. Create your first menu item to let customers place orders!
            </p>
            <button
              onClick={handleOpenAdd}
              className="text-xs text-white bg-[#0007cd] hover:bg-[#0005a3] px-4 py-2 rounded-md font-semibold transition-all shadow-md focus-visible:ring-2 focus-visible:ring-[#0007cd] cursor-pointer"
            >
              Add Your First Menu Item
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((categoryName) => (
              <section key={categoryName} className="space-y-6">
                
                {/* Category Header */}
                <div className="flex items-center space-x-3 border-b border-[#222222] pb-2.5">
                  <div className="w-1.5 h-6 bg-[#0007cd] rounded-sm" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {categoryName}
                  </h2>
                  <span className="text-xs text-[#888888] bg-[#181818] border border-[#222222] px-2 py-0.5 rounded-md font-semibold">
                    {menuByCategory[categoryName].length} items
                  </span>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {menuByCategory[categoryName].map((item) => (
                    <div 
                      key={item.id}
                      className="bg-[#181818] border border-[#222222] rounded-xl p-4 flex gap-4 hover:border-[#333333] transition-all duration-200"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#0f0f0f] border border-[#222222]">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#181818] to-[#222222] text-[#666666]">
                            <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {/* Veg/Non-veg indicator */}
                            {item.is_veg ? (
                              <span className="inline-flex items-center justify-center border border-emerald-600 p-[2px] rounded-[3px] w-4 h-4 bg-emerald-950/10 flex-shrink-0" title="Veg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center border border-red-800 p-[2px] rounded-[3px] w-4 h-4 bg-red-950/10 flex-shrink-0" title="Non-Veg">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-700" />
                              </span>
                            )}
                            <h3 className="font-semibold text-white text-base tracking-tight truncate">
                              {item.name}
                            </h3>
                          </div>
                          {item.description && (
                            <p className="text-xs text-[#888888] line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-white">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Card Controls */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#222222]/50 mt-2">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="text-xs text-[#a8a8a8] hover:text-white transition-all bg-[#222222] border border-[#333333] px-2.5 py-1 rounded-md font-medium"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="text-xs text-red-400 hover:text-red-300 transition-all bg-red-950/10 border border-red-900/30 px-2.5 py-1 rounded-md font-medium"
                            >
                              Delete
                            </button>
                          </div>

                          {/* Available Toggle */}
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                              {item.is_available ? 'Available' : 'Sold Out'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={item.is_available}
                                onChange={() => handleToggleAvailable(item.id, item.is_available)}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-[#222222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#888888] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0007cd] peer-checked:after:bg-white peer-checked:after:border-transparent" />
                            </label>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

              </section>
            ))}
          </div>
        )}

      </main>

      {/* ========================================== */}
      {/* 1. ADD / EDIT MENU ITEM MODAL FORM         */}
      {/* ========================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg bg-[#181818] border border-[#222222] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#222222] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-[#666666] hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Garlic Paneer Tikka"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 bg-[#222222] text-white border border-[#333333] rounded-md focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666] text-sm"
                />
              </div>

              {/* Price & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Price */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white">
                    Price (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="299.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-11 px-4 bg-[#222222] text-white border border-[#333333] rounded-md focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666] text-sm font-mono"
                  />
                </div>

                {/* Category with Suggestions */}
                <div className="space-y-2 relative">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starters, Main Course"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setShowCategorySuggestions(true)
                    }}
                    onFocus={() => setShowCategorySuggestions(true)}
                    onBlur={() => {
                      // Slight delay to allow clicking suggestions
                      setTimeout(() => setShowCategorySuggestions(false), 200)
                    }}
                    className="w-full h-11 px-4 bg-[#222222] text-white border border-[#333333] rounded-md focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666] text-sm"
                  />
                  {/* Suggestion Dropdown */}
                  {showCategorySuggestions && filteredSuggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-[#333333] rounded-md shadow-xl max-h-40 overflow-y-auto divide-y divide-[#2a2a2a] scrollbar-thin">
                      {filteredSuggestions.map((suggestion) => (
                        <li key={suggestion}>
                          <button
                            type="button"
                            onMouseDown={() => setCategory(suggestion)}
                            className="w-full text-left px-4 py-2 text-xs text-[#a8a8a8] hover:bg-[#0007cd] hover:text-white transition-colors cursor-pointer"
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white">
                  Description
                </label>
                <textarea
                  placeholder="Describe the taste, ingredients, and portion size..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-4 bg-[#222222] text-white border border-[#333333] rounded-md focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666] text-sm resize-none"
                />
              </div>

              {/* Veg/Non-Veg Switch */}
              <div className="bg-[#222222]/30 border border-[#333333] rounded-lg p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Dietary Classification
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    Classifies the item following standard dining conventions
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-semibold ${isVeg ? 'text-emerald-400' : 'text-[#888888]'}`}>Veg</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={!isVeg}
                      onChange={() => setIsVeg(!isVeg)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-emerald-600/20 border border-emerald-500/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-emerald-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-950/20 peer-checked:border-red-900/30 peer-checked:after:bg-red-500" />
                  </label>
                  <span className={`text-xs font-semibold ${!isVeg ? 'text-red-400' : 'text-[#888888]'}`}>Non-Veg</span>
                </div>
              </div>

              {/* Image Upload Box */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white">
                  Menu Item Image
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#222222]/20 border border-[#333333] rounded-lg p-4">
                  {/* Preview Thumbnail */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#0f0f0f] border border-[#333333]">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#666666] bg-[#1a1a1a]">
                        <svg className="w-7 h-7 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full text-center sm:text-left space-y-2">
                    <label className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#222222] border border-[#333333] rounded-md hover:bg-[#2a2a2a] transition-all cursor-pointer">
                      <span>{imageUrl ? 'Change Image' : 'Select Image File'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-[#666666]">
                      Max 5MB. Supports JPG, PNG, and WebP formats.
                    </p>

                    {/* Progress States */}
                    {uploadStatus === 'uploading' && (
                      <div className="text-xs text-indigo-400 flex items-center space-x-1.5 justify-center sm:justify-start">
                        <svg className="animate-spin h-3 w-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading image to restaurant storage...</span>
                      </div>
                    )}

                    {uploadStatus === 'success' && (
                      <div className="text-xs text-[#33d17a] flex items-center space-x-1 justify-center sm:justify-start">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        </svg>
                        <span>Image uploaded successfully!</span>
                      </div>
                    )}

                    {uploadStatus === 'error' && (
                      <div className="text-xs text-[#ff4d4d] flex items-center space-x-1 justify-center sm:justify-start">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{uploadError || 'Upload failed.'}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#222222] bg-[#1c1c1c] flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-xs text-[#a8a8a8] hover:text-white transition-all bg-transparent px-4 py-2.5 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubmit}
                disabled={isPendingSave || uploadStatus === 'uploading'}
                className="text-xs text-white bg-[#0007cd] hover:bg-[#0005a3] px-5 py-2.5 rounded-md font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {isPendingSave ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. DELETE CONFIRMATION MODAL               */}
      {/* ========================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md bg-[#181818] border border-[#222222] rounded-xl overflow-hidden shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#222222] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Delete Menu Item
              </h3>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-[#666666] hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-white">
                Are you sure you want to delete <span className="font-bold text-indigo-400">"{itemToDelete.name}"</span>?
              </p>

              {/* Warning box */}
              <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-400 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Integrity Information</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Deleting a menu item does not affect or delete past orders that referenced it, as historical records store price snapshots. 
                </p>
                <p className="text-xs leading-relaxed font-semibold">
                  Note: If customers have already ordered this item, database constraints will block hard deletion. In that case, you must toggle the "Available" switch to "Sold Out" instead.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#222222] bg-[#1c1c1c] flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="text-xs text-[#a8a8a8] hover:text-white transition-all bg-transparent px-4 py-2.5 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPendingDelete}
                className="text-xs text-white bg-[#ff4d4d] hover:bg-[#e03a3a] px-5 py-2.5 rounded-md font-semibold transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isPendingDelete ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Item</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
