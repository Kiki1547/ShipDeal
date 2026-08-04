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
      invoice?: string | null
    }

    if (session.payment_status === 'paid') {
      const isBulk = session.metadata?.bulk === 'true'
      let invoiceUrl: string | null = null

      if (session.invoice) {
        try {
          const stripe = getStripe()
          const invoice = await stripe.invoices.retrieve(session.invoice)
          invoiceUrl = invoice.hosted_invoice_url || null
        } catch (err) {
          console.error('Failed to retrieve invoice:', err)
        }
      }

      const updateData: { status: string; invoice_url?: string } = { status: 'paid' }
      if (invoiceUrl) updateData.invoice_url = invoiceUrl

      if (isBulk && session.metadata?.orderIds) {
        const ids = session.metadata.orderIds.split(',')
        await supabase.from('orders').update(updateData).in('id', ids)
      } else if (session.metadata?.orderId) {
        await supabase.from('orders').update(updateData).eq('id', session.metadata.orderId)
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