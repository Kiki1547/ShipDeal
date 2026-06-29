'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package, Users, ShieldCheck, LogOut, RefreshCw,
  CheckCircle, Clock, XCircle, Download, UserCog,
  Trash2, ChevronDown, ArrowLeft, Crown
} from 'lucide-react'

interface Order {
  id: string
  user_id: string
  weight_kg: number
  price_usd: number
  status: 'pending_payment' | 'paid' | 'label_ready' | 'cancelled'
  label_url: string | null
  recipient_name: string
  recipient_city: string
  recipient_country: string
  assigned_to: string | null
  created_at: string
}

interface Profile {
  id: string
  email: string
  role: 'customer' | 'reseller' | 'admin'
  created_at: string
}

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
  paid: { label: 'Processing', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: <RefreshCw size={12} /> },
  label_ready: { label: 'Ready', color: '#00D4AA', bg: 'rgba(0,212,170,0.1)', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={12} /> },
}

const ROLE_CONFIG = {
  customer: { label: 'Customer', color: '#7A8AA0', bg: 'rgba(122,138,160,0.1)' },
  reseller: { label: 'Reseller', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  admin: { label: 'Admin', color: '#FF6B00', bg: 'rgba(255,107,0,0.15)' },
}

type Tab = 'orders' | 'users'

export default function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading')
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [resellers, setResellers] = useState<Profile[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async (token: string) => {
    setDataLoading(true)
    const [ordersRes, usersRes] = await Promise.all([
      fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    if (ordersRes.ok) setOrders(await ordersRes.json().then((d: { orders: Order[] }) => d.orders))
    if (usersRes.ok) {
      const data = await usersRes.json()
      setUsers(data.users)
      setResellers(data.users.filter((u: Profile) => u.role === 'reseller' || u.role === 'admin'))
    }
    setDataLoading(false)
  }, [])

  useEffect(() => {
  setStatus('authorized')
  const run = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) fetchData(session.access_token)
  }
  run()
}, [fetchData])

  useEffect(() => {
    if (status === 'unauthorized') {
      router.push('/')
    }
  }, [status, router])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }

  const updateRole = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    const token = await getToken()
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, role: newRole }),
    })
    fetchData(token)
    setActionLoading(null)
  }

  const assignOrder = async (orderId: string, resellerId: string) => {
    setActionLoading(orderId)
    const token = await getToken()
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, assignedTo: resellerId || null }),
    })
    fetchData(token)
    setActionLoading(null)
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setActionLoading(userId)
    const token = await getToken()
    await fetch(`/api/admin/users?userId=${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchData(token)
    setActionLoading(null)
  }

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Checking permissions...</div>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Redirecting...</div>
      </div>
    )
  }

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    ready: orders.filter(o => o.status === 'label_ready').length,
    revenue: orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment').reduce((s, o) => s + o.price_usd, 0),
  }

  const btnStyle = (active: boolean) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
    background: active ? 'var(--accent)' : 'var(--bg-elevated)',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={13} /> Home
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={18} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>Admin Panel</h1>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Full access</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={async () => fetchData(await getToken())} style={{ padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="stats-grid">
          {[
            { label: 'Total orders', value: stats.total, icon: <Package size={16} color="var(--accent)" /> },
            { label: 'Awaiting label', value: stats.paid, icon: <Clock size={16} color="#3B82F6" /> },
            { label: 'Labels ready', value: stats.ready, icon: <CheckCircle size={16} color="#00D4AA" /> },
            { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: <ShieldCheck size={16} color="#8B5CF6" /> },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, background: 'var(--bg-elevated)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button onClick={() => setTab('orders')} style={btnStyle(tab === 'orders')}>
            <Package size={14} style={{ display: 'inline', marginRight: 6 }} />Orders
          </button>
          <button onClick={() => setTab('users')} style={btnStyle(tab === 'users')}>
            <Users size={14} style={{ display: 'inline', marginRight: 6 }} />Users
          </button>
        </div>

        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'pending_payment', 'paid', 'label_ready', 'cancelled'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)',
                  background: statusFilter === f ? 'var(--bg-elevated)' : 'transparent',
                  color: statusFilter === f ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: 13, fontWeight: statusFilter === f ? 600 : 400,
                  borderColor: statusFilter === f ? 'var(--border-bright)' : 'var(--border)'
                }}>
                  {f === 'all' ? 'All' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label}
                  {f !== 'all' && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                    ({orders.filter(o => o.status === f).length})
                  </span>}
                </button>
              ))}
            </div>

            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredOrders.map(order => {
                  const cfg = STATUS_CONFIG[order.status]
                  return (
                    <div key={order.id} style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '16px 20px', display: 'flex',
                      alignItems: 'center', gap: 14, flexWrap: 'wrap'
                    }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                          {order.recipient_name} — {order.recipient_city}, {order.recipient_country}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {order.weight_kg < 1 ? `${(order.weight_kg * 1000).toFixed(0)}g` : `${order.weight_kg}kg`} · #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <span style={{ fontSize: 15, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>
                        ${order.price_usd.toFixed(2)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 500 }}>
                        {cfg.icon} {cfg.label}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={order.assigned_to || ''}
                          onChange={e => assignOrder(order.id, e.target.value)}
                          disabled={actionLoading === order.id}
                          style={{
                            padding: '6px 28px 6px 10px', borderRadius: 7,
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                            color: order.assigned_to ? '#8B5CF6' : 'var(--text-muted)',
                            fontSize: 12, cursor: 'pointer', appearance: 'none', minWidth: 130
                          }}>
                          <option value="">Unassigned</option>
                          {resellers.map(r => (
                            <option key={r.id} value={r.id}>{r.email.split('@')[0]}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                      </div>
                      {order.label_url && (
                        <a href={order.label_url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                          background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)',
                          borderRadius: 7, color: '#00D4AA', textDecoration: 'none', fontSize: 12, fontWeight: 500
                        }}>
                          <Download size={12} /> Label
                        </a>
                      )}
                    </div>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>No orders found</div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
            ) : users.map(user => {
              const roleCfg = ROLE_CONFIG[user.role]
              return (
                <div key={user.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 20px', display: 'flex',
                  alignItems: 'center', gap: 14, flexWrap: 'wrap'
                }}>
                  <div style={{ width: 38, height: 38, background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{user.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: roleCfg.bg, color: roleCfg.color, fontSize: 12, fontWeight: 600 }}>
                    {roleCfg.label}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value)}
                      disabled={actionLoading === user.id}
                      style={{
                        padding: '6px 28px 6px 10px', borderRadius: 7,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                        color: 'var(--text)', fontSize: 12, cursor: 'pointer', appearance: 'none'
                      }}>
                      <option value="customer">Customer</option>
                      <option value="reseller">Reseller</option>
                      <option value="admin">Admin</option>
                    </select>
                    <UserCog size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                  </div>
                  <button onClick={() => deleteUser(user.id)} disabled={actionLoading === user.id} style={{
                    padding: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 7, color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
            {!dataLoading && users.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>No users found</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}