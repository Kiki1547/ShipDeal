import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { getPriceForWeight } from '@/lib/pricing'

interface OrderRow {
  weight_kg: number
  recipient_name: string
  recipient_address: string
  recipient_city: string
  recipient_zip: string
  recipient_country: string
}

export async function POST(req: NextRequest) {
  try {
    const { userId, orders } = await req.json()

    if (!userId || !orders?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createSupabaseServiceClient()

    // Calculate total price
    const totalPrice = (orders as OrderRow[]).reduce((sum, o) => sum + getPriceForWeight(o.weight_kg), 0)
    const totalCents = Math.round(totalPrice * 100)

    // Create ONE bulk order with all recipients stored as JSON
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: userId,
      weight_kg: 0,
      price_usd: totalPrice,
      status: 'pending_payment',
      recipient_name: `Bulk order (${orders.length} labels)`,
      recipient_address: '',
      recipient_city: '',
      recipient_country: '',
      recipient_zip: '',
      is_bulk: true,
      bulk_recipients: orders,
    }).select().single()

    if (orderError || !order) {
      console.error('DB error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `ShipDeal — Bulk order (${orders.length} labels)`,
            description: `${orders.length} FedEx International Priority labels`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=1`,
      metadata: { orderId: order.id, userId, bulk: 'true' },
    })

    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Bulk checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}