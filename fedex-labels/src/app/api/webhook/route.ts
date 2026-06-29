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
    const session = event.data.object as {
      metadata?: { orderId?: string; orderIds?: string; bulk?: string }
      payment_status?: string
    }

    if (session.payment_status === 'paid') {
      const isBulk = session.metadata?.bulk === 'true'

      if (isBulk && session.metadata?.orderIds) {
        // Bulk order — update all orders
        const ids = session.metadata.orderIds.split(',')
        await supabase.from('orders').update({ status: 'paid' }).in('id', ids)
        console.log(`✅ Bulk order paid — ${ids.length} orders updated`)
      } else if (session.metadata?.orderId) {
        // Single order
        await supabase.from('orders').update({ status: 'paid' }).eq('id', session.metadata.orderId)
        console.log(`✅ Order ${session.metadata.orderId} paid`)
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as {
      metadata?: { orderId?: string; orderIds?: string; bulk?: string }
    }

    const isBulk = session.metadata?.bulk === 'true'
    if (isBulk && session.metadata?.orderIds) {
      const ids = session.metadata.orderIds.split(',')
      await supabase.from('orders').update({ status: 'cancelled' }).in('id', ids)
    } else if (session.metadata?.orderId) {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', session.metadata.orderId)
    }
  }

  return NextResponse.json({ received: true })
}