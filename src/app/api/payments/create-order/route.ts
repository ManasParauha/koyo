import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import { getClientIp, rateLimit } from '@/lib/rate-limiter'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const ip = getClientIp(request)

  try {
    // 1. Rate Limiting Check (Max 5 payment creation attempts per minute per IP)
    const limitResult = rateLimit(ip, 5, 60000)
    if (!limitResult.success) {
      console.warn(`[Payment API Warning] Rate limit exceeded for IP: ${ip}`)
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

    const body = await request.json()
    const { order_id } = body

    // 2. Input Sanitization & Validation
    if (!order_id) {
      console.warn(`[Payment API Warning] Validation failed for IP ${ip}: Missing order_id.`)
      return NextResponse.json(
        { error: 'Missing required field: order_id' },
        { status: 400 }
      )
    }

    if (typeof order_id !== 'string' || !UUID_REGEX.test(order_id)) {
      console.warn(`[Payment API Warning] Validation failed for IP ${ip}: Invalid order_id UUID format "${order_id}".`)
      return NextResponse.json(
        { error: 'Invalid order_id format.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 3. Fetch order details from DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error(`[Payment API Error] Order not found for ID "${order_id}". Database error:`, orderError?.message || 'Not found')
      return NextResponse.json(
        { error: 'Order not found.' },
        { status: 404 }
      )
    }

    // 4. Verify order is not already paid
    if (order.payment_status === 'paid') {
      console.warn(`[Payment API Warning] Payment attempt for already paid order ID "${order_id}".`)
      return NextResponse.json(
        { error: 'Order is already paid.' },
        { status: 400 }
      )
    }

    // 5. Initialize Razorpay Client
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error('[Payment API Critical] Razorpay configuration keys are missing on the server.')
      return NextResponse.json(
        { error: 'Razorpay configuration keys are missing on the server.' },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // 6. Calculate amount in paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(parseFloat(order.total_amount.toString()) * 100)

    // 7. Create order in Razorpay
    const rpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${order.id.slice(0, 8)}`,
    })

    // 8. Insert pending payment record in payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        amount: order.total_amount,
        method: 'online',
        gateway_txn_id: rpOrder.id, // Store Razorpay Order ID (e.g. order_xxx)
        status: 'pending'
      })

    if (paymentError) {
      console.error(`[Payment API Error] Failed to create database payment transaction record for order ID ${order.id}. Error:`, paymentError.message)
      return NextResponse.json(
        { error: 'Failed to record pending transaction.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      razorpay_order_id: rpOrder.id,
      razorpay_key: keyId,
      amount: amountInPaise,
      currency: 'INR'
    })

  } catch (err: any) {
    console.error(`[Payment API Exception] Unexpected error for request from IP ${ip}:`, err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while generating payment order.' },
      { status: 500 }
    )
  }
}

