import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createSupabaseServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { orderId?: string }; payment_status?: string }
    const orderId = session.metadata?.orderId

    if (orderId && session.payment_status === 'paid') {
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
      console.log(`✅ Order ${orderId} paid — ready for label generation`)
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as { metadata?: { orderId?: string } }
    const orderId = session.metadata?.orderId
    if (orderId) {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
    }
  }

  return NextResponse.json({ received: true })
}
