import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing required field: order_id' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 1. Fetch order details from DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found.' },
        { status: 404 }
      )
    }

    // 2. Verify order is not already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid.' },
        { status: 400 }
      )
    }

    // 3. Initialize Razorpay Client
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay configuration keys are missing on the server.' },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // 4. Calculate amount in paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(parseFloat(order.total_amount.toString()) * 100)

    // 5. Create order in Razorpay
    const rpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${order.id.slice(0, 8)}`,
    })

    // 6. Insert pending payment record in payments table
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
      console.error('Failed to create payment transaction record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to record pending transaction.' },
        { status: 500 }
      )
    }

    // 7. Return details to client
    return NextResponse.json({
      success: true,
      razorpay_order_id: rpOrder.id,
      razorpay_key: keyId,
      amount: amountInPaise,
      currency: 'INR'
    })

  } catch (err: any) {
    console.error('Error creating payment order:', err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while generating payment order.' },
      { status: 500 }
    )
  }
}
