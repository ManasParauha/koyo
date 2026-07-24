import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const headerList = await headers()
    const signature = headerList.get('x-razorpay-signature')

    if (!signature) {
      console.warn('[Webhook Warning] Missing x-razorpay-signature header.')
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Webhook Error] RAZORPAY_WEBHOOK_SECRET is not configured on the server.')
      return NextResponse.json(
        { error: 'Webhook secret is not configured.' },
        { status: 500 }
      )
    }

    // 1. Verify webhook signature using timing-safe comparison
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')

    let isSignatureValid = false
    if (expectedBuffer.length === signatureBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    }

    if (!isSignatureValid) {
      console.error('[Webhook Error] Signature verification failed. Expected vs Received buffers did not match.')
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 400 }
      )
    }

    // 2. Parse payload safely
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (parseErr: any) {
      console.error('[Webhook Error] Failed to parse raw body JSON:', parseErr.message)
      return NextResponse.json(
        { error: 'Malformed JSON payload.' },
        { status: 400 }
      )
    }

    const event = payload?.event
    console.log(`[Webhook Info] Received event: ${event}`)

    // 3. Handle payment events
    if (event === 'payment.captured') {
      const rpPaymentEntity = payload?.payload?.payment?.entity
      const rpOrderId = rpPaymentEntity?.order_id
      const rpPaymentId = rpPaymentEntity?.id

      if (!rpOrderId) {
        console.warn('[Webhook Warning] Event "payment.captured" does not contain a razorpay order_id.')
        return NextResponse.json(
          { error: 'Missing order_id in payment payload.' },
          { status: 200 }
        )
      }

      const supabase = await createAdminClient()

      // Find the corresponding payment record using rpOrderId or rpPaymentId
      const { data: payment, error: paymentFetchError } = await supabase
        .from('payments')
        .select('*')
        .or(`gateway_txn_id.eq.${rpOrderId},gateway_txn_id.eq.${rpPaymentId}`)
        .single()

      if (paymentFetchError || !payment) {
        console.warn(`[Webhook Warning] No matching payment found in DB for Razorpay order ID: ${rpOrderId}. Error:`, paymentFetchError?.message)
        return NextResponse.json(
          { error: 'No matching payment transaction record found.' },
          { status: 200 }
        )
      }

      // Update payment record to success and store the actual payment ID
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          gateway_txn_id: rpPaymentId
        })
        .eq('id', payment.id)

      if (paymentUpdateError) {
        console.error(`[Webhook Error] Failed to update payment ID "${payment.id}" to success. Database error:`, paymentUpdateError.message)
        return NextResponse.json(
          { error: 'Failed to update transaction status.' },
          { status: 500 }
        )
      }

      // Update order payment status to paid
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid'
        })
        .eq('id', payment.order_id)

      if (orderUpdateError) {
        console.error(`[Webhook Error] Failed to update order ID "${payment.order_id}" status to paid. Database error:`, orderUpdateError.message)
        return NextResponse.json(
          { error: 'Failed to update order payment status.' },
          { status: 500 }
        )
      }

      console.log(`[Webhook Success] Payment succeeded for order ID: ${payment.order_id}`)
      return NextResponse.json({
        success: true,
        message: 'Payment captured and order payment status updated to paid.'
      })
    } 

    if (event === 'payment.failed') {
      const rpPaymentEntity = payload?.payload?.payment?.entity
      const rpOrderId = rpPaymentEntity?.order_id
      const rpPaymentId = rpPaymentEntity?.id

      if (!rpOrderId) {
        console.warn('[Webhook Warning] Event "payment.failed" does not contain a razorpay order_id.')
        return NextResponse.json(
          { error: 'Missing order_id in failure payload.' },
          { status: 200 }
        )
      }

      const supabase = await createAdminClient()

      const { data: payment, error: paymentFetchError } = await supabase
        .from('payments')
        .select('*')
        .or(`gateway_txn_id.eq.${rpOrderId},gateway_txn_id.eq.${rpPaymentId}`)
        .single()

      if (paymentFetchError || !payment) {
        console.warn(`[Webhook Warning] No matching payment found in DB for failed Razorpay order ID: ${rpOrderId}. Error:`, paymentFetchError?.message)
        return NextResponse.json(
          { error: 'No matching payment transaction record found.' },
          { status: 200 }
        )
      }

      // Mark payment transaction as failed
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          gateway_txn_id: rpPaymentId
        })
        .eq('id', payment.id)

      if (paymentUpdateError) {
        console.error(`[Webhook Error] Failed to update payment ID "${payment.id}" to failed. Database error:`, paymentUpdateError.message)
        return NextResponse.json(
          { error: 'Failed to update transaction status.' },
          { status: 500 }
        )
      }

      console.log(`[Webhook Info] Payment marked failed for order ID: ${payment.order_id}`)
      return NextResponse.json({
        success: true,
        message: 'Payment transaction marked as failed.'
      })
    }

    // Acknowledge other event types with 200 OK
    return NextResponse.json({
      success: true,
      message: `Acknowledged event: ${event}`
    })

  } catch (err: any) {
    console.error('[Webhook Exception] Unexpected error inside webhook handler:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error in webhook handler.' },
      { status: 500 }
    )
  }
}

