import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getClientIp, rateLimit } from '@/lib/rate-limiter'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const ip = getClientIp(request)

  try {
    // 1. Rate Limiting Check (Max 5 verification attempts per minute per IP)
    const limitResult = rateLimit(ip, 5, 60000)
    if (!limitResult.success) {
      console.warn(`[Payment Verify API Warning] Rate limit exceeded for IP: ${ip}`)
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
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    // 2. Validate input presence and types
    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn(`[Payment Verify API Warning] Validation failed for IP ${ip}: Missing signature verification parameters.`)
      return NextResponse.json(
        { error: 'Missing signature verification parameters.' },
        { status: 400 }
      )
    }

    if (
      typeof order_id !== 'string' ||
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      console.warn(`[Payment Verify API Warning] Validation failed for IP ${ip}: Invalid parameter types.`)
      return NextResponse.json(
        { error: 'Invalid verification parameter formats.' },
        { status: 400 }
      )
    }

    if (!UUID_REGEX.test(order_id)) {
      console.warn(`[Payment Verify API Warning] Validation failed for IP ${ip}: Invalid order_id UUID "${order_id}".`)
      return NextResponse.json(
        { error: 'Invalid order_id format.' },
        { status: 400 }
      )
    }

    // Limit length of parameters to prevent large memory payload abuse
    if (
      razorpay_order_id.length > 255 ||
      razorpay_payment_id.length > 255 ||
      razorpay_signature.length > 512
    ) {
      console.warn(`[Payment Verify API Warning] Validation failed for IP ${ip}: Parameter length bounds exceeded.`)
      return NextResponse.json(
        { error: 'Verification parameter length exceeded.' },
        { status: 400 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.error('[Payment Verify API Critical] Razorpay key secret is not configured on the server.')
      return NextResponse.json(
        { error: 'Razorpay configuration key secret is missing on the server.' },
        { status: 500 }
      )
    }

    // 3. Recreate signature: razorpay_order_id + "|" + razorpay_payment_id
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    // 4. Validate signature using timing-safe comparison
    const expectedBuffer = Buffer.from(generatedSignature, 'hex')
    const signatureBuffer = Buffer.from(razorpay_signature, 'hex')

    let isSignatureValid = false
    if (expectedBuffer.length === signatureBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    }

    if (isSignatureValid) {
      return NextResponse.json({
        success: true,
        message: 'Signature verified successfully.'
      })
    } else {
      console.warn(`[Payment Verify API Warning] Signature verification failed for order ID ${order_id} from IP ${ip}.`)
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      )
    }

  } catch (err: any) {
    console.error(`[Payment Verify API Exception] Unexpected error for request from IP ${ip}:`, err)
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during verification.' },
      { status: 500 }
    )
  }
}

