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

    // Create all orders in DB
    const insertedOrders = []
    for (const order of orders as OrderRow[]) {
      const priceUsd = getPriceForWeight(order.weight_kg)
      const { data, error } = await supabase.from('orders').insert({
        user_id: userId,
        weight_kg: order.weight_kg,
        price_usd: priceUsd,
        status: 'pending_payment',
        recipient_name: order.recipient_name,
        recipient_address: order.recipient_address,
        recipient_city: order.recipient_city,
        recipient_country: order.recipient_country,
        recipient_zip: order.recipient_zip,
      }).select().single()
      if (!error && data) insertedOrders.push(data)
    }

    if (!insertedOrders.length) {
      return NextResponse.json({ error: 'Failed to create orders' }, { status: 500 })
    }

    const totalCents = insertedOrders.reduce((s, o) => s + Math.round(o.price_usd * 100), 0)
    const orderIds = insertedOrders.map(o => o.id).join(',')

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: insertedOrders.map(order => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `FedEx Label — ${order.recipient_name}`,
            description: `${order.weight_kg < 1 ? `${(order.weight_kg * 1000).toFixed(0)}g` : `${order.weight_kg}kg`} · ${order.recipient_city}, ${order.recipient_country}`,
          },
          unit_amount: Math.round(order.price_usd * 100),
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=1`,
      metadata: { orderIds, userId, bulk: 'true' },
    })

    // Store session ID on all orders
    await supabase.from('orders')
      .update({ stripe_session_id: session.id })
      .in('id', insertedOrders.map(o => o.id))

    return NextResponse.json({ url: session.url, total: totalCents / 100 })
  } catch (err) {
    console.error('Bulk checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}