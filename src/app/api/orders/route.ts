import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getClientIp, rateLimit } from '@/lib/rate-limiter'

interface CartItemPayload {
  menu_item_id: string
  quantity: number
  notes?: string
}

interface OrderPayload {
  restaurantId: string
  tableId: string
  payment_mode: 'online_now' | 'online_at_end' | 'cash_at_counter'
  items: CartItemPayload[]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_PAYMENT_MODES = ['online_now', 'online_at_end', 'cash_at_counter']

export async function POST(request: Request) {
  const ip = getClientIp(request)

  try {
    // 1. Rate Limiting Check (Max 5 orders per minute per IP)
    const limitResult = rateLimit(ip, 5, 60000)
    if (!limitResult.success) {
      console.warn(`[Order API Warning] Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.reset.toString(),
          },
        }
      )
    }

    const body: OrderPayload = await request.json()
    const { restaurantId, tableId, payment_mode, items } = body

    // 2. Basic payload validations
    if (!restaurantId || !tableId || !payment_mode || !items) {
      console.warn(`[Order API Warning] Validation failed for IP ${ip}: Missing required fields.`)
      return NextResponse.json(
        { error: 'Missing required fields (restaurantId, tableId, payment_mode, or items).' },
        { status: 400 }
      )
    }

    if (!UUID_REGEX.test(restaurantId)) {
      console.warn(`[Order API Warning] Validation failed for IP ${ip}: Invalid restaurantId format "${restaurantId}".`)
      return NextResponse.json(
        { error: 'Invalid restaurantId format.' },
        { status: 400 }
      )
    }

    if (!UUID_REGEX.test(tableId)) {
      console.warn(`[Order API Warning] Validation failed for IP ${ip}: Invalid tableId format "${tableId}".`)
      return NextResponse.json(
        { error: 'Invalid tableId format.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_PAYMENT_MODES.includes(payment_mode)) {
      console.warn(`[Order API Warning] Validation failed for IP ${ip}: Invalid payment mode "${payment_mode}".`)
      return NextResponse.json(
        { error: `Invalid payment mode. Must be one of: ${ALLOWED_PAYMENT_MODES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.warn(`[Order API Warning] Validation failed for IP ${ip}: Empty items cart.`)
      return NextResponse.json(
        { error: 'Cart is empty. Please add items to place an order.' },
        { status: 400 }
      )
    }

    // Validate each cart item structure
    for (const item of items) {
      if (!item.menu_item_id || !UUID_REGEX.test(item.menu_item_id)) {
        console.warn(`[Order API Warning] Validation failed for IP ${ip}: Invalid menu_item_id "${item.menu_item_id}".`)
        return NextResponse.json(
          { error: `Invalid menu_item_id: ${item.menu_item_id || 'missing'}` },
          { status: 400 }
        )
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        console.warn(`[Order API Warning] Validation failed for IP ${ip}: Invalid quantity "${item.quantity}" for item "${item.menu_item_id}".`)
        return NextResponse.json(
          { error: 'Item quantity must be a positive integer.' },
          { status: 400 }
        )
      }
      if (item.notes !== undefined && item.notes !== null) {
        if (typeof item.notes !== 'string') {
          console.warn(`[Order API Warning] Validation failed for IP ${ip}: Notes field is not a string.`)
          return NextResponse.json(
            { error: 'Item notes must be a string.' },
            { status: 400 }
          )
        }
        if (item.notes.length > 500) {
          console.warn(`[Order API Warning] Validation failed for IP ${ip}: Notes field exceeds 500 characters.`)
          return NextResponse.json(
            { error: 'Item notes cannot exceed 500 characters.' },
            { status: 400 }
          )
        }
      }
    }

    // 3. Initialize Supabase Admin Client (using service role key)
    const supabase = await createAdminClient()

    // 4. Verify Table exists and belongs to the specified restaurant
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('table_number, restaurant_id')
      .eq('id', tableId)
      .single()

    if (tableError || !tableData) {
      console.error(`[Order API Error] Table look up failed for table ID ${tableId}. Error:`, tableError?.message || 'Not found')
      return NextResponse.json(
        { error: 'The scanned table was not found.' },
        { status: 404 }
      )
    }

    if (tableData.restaurant_id !== restaurantId) {
      console.warn(`[Order API Warning] Table "${tableId}" restaurant ID "${tableData.restaurant_id}" does not match payload "${restaurantId}".`)
      return NextResponse.json(
        { error: 'This table QR code does not belong to the selected restaurant.' },
        { status: 400 }
      )
    }

    // 5. Fetch menu items from DB to verify price, existence, and availability server-side
    const itemIds = items.map(item => item.menu_item_id)
    const { data: dbItems, error: dbItemsError } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available, restaurant_id')
      .in('id', itemIds)

    if (dbItemsError || !dbItems) {
      console.error(`[Order API Error] Menu items verification failed. Error:`, dbItemsError?.message)
      return NextResponse.json(
        { error: 'Failed to verify menu items.' },
        { status: 500 }
      )
    }

    const dbItemsMap = new Map(dbItems.map(item => [item.id, item]))

    // Validate all items in the payload exist, belong to this restaurant, and are available
    for (const item of items) {
      const dbItem = dbItemsMap.get(item.menu_item_id)
      
      if (!dbItem) {
        console.warn(`[Order API Warning] Menu item "${item.menu_item_id}" does not exist in database.`)
        return NextResponse.json(
          { error: `Selected menu item is invalid or does not exist.` },
          { status: 400 }
        )
      }

      if (dbItem.restaurant_id !== restaurantId) {
        console.warn(`[Order API Warning] Menu item "${dbItem.name}" restaurant ID "${dbItem.restaurant_id}" does not match order restaurant ID "${restaurantId}".`)
        return NextResponse.json(
          { error: `Menu item "${dbItem.name}" does not belong to this restaurant.` },
          { status: 400 }
        )
      }

      if (!dbItem.is_available) {
        console.warn(`[Order API Warning] Menu item "${dbItem.name}" is currently unavailable.`)
        return NextResponse.json(
          { error: `Sorry, "${dbItem.name}" just became unavailable — please remove it and try again.` },
          { status: 400 }
        )
      }
    }

    // 6. Calculate total amount server-side (do NOT trust client prices)
    let total_amount = 0
    for (const item of items) {
      const dbItem = dbItemsMap.get(item.menu_item_id)!
      const price = parseFloat(dbItem.price.toString())
      total_amount += price * item.quantity
    }

    // 7. Set initial payment_status based on payment_mode
    let paymentStatus = 'unpaid'
    if (payment_mode === 'online_now') {
      paymentStatus = 'pending_online'
    } else if (payment_mode === 'cash_at_counter') {
      paymentStatus = 'pending_cash'
    }

    // 8. Insert Order & Order Items using sequential inserts with manual rollback on failure
    let orderId: string | null = null
    let receiptNumber = ''
    let attempts = 0
    let insertError = null

    // Retry insertion if there is a receipt_number collision (up to 3 times)
    while (attempts < 3) {
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      receiptNumber = `T${tableData.table_number}-${randomNum}`

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          status: 'received',
          payment_mode: payment_mode,
          payment_status: paymentStatus,
          receipt_number: receiptNumber,
          total_amount: total_amount
        })
        .select('id')
        .single()

      if (orderError) {
        // Code 23505 is Postgres unique_violation (likely receipt_number collision)
        if (orderError.code === '23505') {
          attempts++
          insertError = orderError
          continue
        }
        console.error('[Order API Error] Failed to insert order. Code:', orderError.code, 'Error:', orderError.message)
        return NextResponse.json(
          { error: `Failed to create order: ${orderError.message}` },
          { status: 500 }
        )
      }

      orderId = newOrder.id
      break
    }

    if (!orderId) {
      console.error('[Order API Error] Failed to generate a unique order receipt after attempts. Last error:', insertError?.message)
      return NextResponse.json(
        { error: `Failed to generate a unique order receipt: ${insertError?.message || 'Unique violation'}` },
        { status: 500 }
      )
    }

    // Prepare order items
    const orderItemsToInsert = items.map(item => {
      const dbItem = dbItemsMap.get(item.menu_item_id)!
      return {
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes || null,
        item_status: 'received',
        price_at_order: parseFloat(dbItem.price.toString())
      }
    })

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)

    if (itemsInsertError) {
      console.error(`[Order API Error] Failed to insert order items for order ID ${orderId}. Error:`, itemsInsertError.message, '. Initiating rollback.')
      
      // Rollback: delete the created order row
      const { error: rollbackError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (rollbackError) {
        console.error(`[Order API Critical] Rollback deletion failed for order ID ${orderId}. Database state may be orphaned. Error:`, rollbackError.message)
      }

      return NextResponse.json(
        { error: `Failed to submit order items: ${itemsInsertError.message}. Order rolled back.` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      receiptNumber
    })

  } catch (err: any) {
    console.error(`[Order API Exception] Unexpected error processing request from IP ${ip}:`, err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while processing the order.' },
      { status: 500 }
    )
  }
}

