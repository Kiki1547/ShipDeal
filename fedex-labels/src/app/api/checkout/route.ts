import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { getPriceForWeight } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, weightKg, recipientName, recipientAddress, recipientCity, recipientCountry, recipientZip } = body

    if (!userId || !weightKg || !recipientName || !recipientAddress || !recipientCity || !recipientCountry || !recipientZip) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const priceUsd = getPriceForWeight(parseFloat(weightKg))
    const priceInCents = Math.round(priceUsd * 100)

    const supabase = await createSupabaseServiceClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        weight_kg: parseFloat(weightKg),
        price_usd: priceUsd,
        status: 'pending_payment',
        recipient_name: recipientName,
        recipient_address: recipientAddress,
        recipient_city: recipientCity,
        recipient_country: recipientCountry,
        recipient_zip: recipientZip,
      })
      .select()
      .single()

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
            name: 'FedEx International Priority Label',
            description: `${weightKg < 1 ? `${(weightKg * 1000).toFixed(0)}g` : `${weightKg}kg`} · To: ${recipientName}, ${recipientCity}, ${recipientCountry}`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1&order=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=1`,
      metadata: { orderId: order.id, userId },
    })

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
