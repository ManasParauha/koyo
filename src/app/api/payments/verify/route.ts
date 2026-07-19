import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing signature verification parameters.' },
        { status: 400 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json(
        { error: 'Razorpay configuration key secret is missing on the server.' },
        { status: 500 }
      )
    }

    // 1. Recreate signature: razorpay_order_id + "|" + razorpay_payment_id
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    // 2. Validate
    if (generatedSignature === razorpay_signature) {
      return NextResponse.json({
        success: true,
        message: 'Signature verified successfully.'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      )
    }

  } catch (err: any) {
    console.error('Error verifying payment signature:', err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during verification.' },
      { status: 500 }
    )
  }
}
