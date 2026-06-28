import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = await createSupabaseServiceClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, role } = await req.json()
  if (!userId || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!['customer', 'reseller', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const supabase = await createSupabaseServiceClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const supabase = await createSupabaseServiceClient()
  // Delete from auth (cascades to profiles)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
