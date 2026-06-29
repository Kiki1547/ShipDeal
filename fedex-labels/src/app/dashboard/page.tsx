'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Download, Clock, CheckCircle, XCircle, Plus, ArrowLeft, LogOut, RefreshCw } from 'lucide-react'
import OrderModal from '@/components/OrderModal'
import BulkOrderModal from '@/components/BulkOrderModal'

interface Order {
  id: string
  weight_kg: number
  price_usd: number
  status: 'pending_payment' | 'paid' | 'label_ready' | 'cancelled'
  label_url: string | null
  recipient_name: string
  recipient_city: string
  recipient_country: string
  created_at: string
}

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending payment', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={13} /> },
  paid: { label: 'Processing', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: <RefreshCw size={13} style={{ animation: 'spin 2s linear infinite' }} /> },
  label_ready: { label: 'Label ready', color: 'var(--success)', bg: 'var(--success-dim)', icon: <CheckCircle size={13} /> },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={13} /> },
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [orderOpen, setOrderOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const router = useRouter()

  const fetchOrders = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      fetchOrders(data.user.id)
    })
  }, [router, fetchOrders])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return null

  const stats = {
    total: orders.length,
    ready: orders.filter(o => o.status === 'label_ready').length,
    spent: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.price_usd, 0),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1000, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
              <ArrowLeft size={14} /> Home
            </Link>
            <span style={{ color: 'var(--border-bright)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
                Ship<span style={{ color: 'var(--accent)' }}>Deal</span>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</span>
            <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid var(--border-bright)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
        <h1 style={{ fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>
          My labels
        </h1>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }} className="stats-grid">
          {[
            { label: 'Total orders', value: stats.total },
            { label: 'Labels ready', value: stats.ready },
            { label: 'Total spent', value: `$${stats.spent.toFixed(2)}` },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text)' }}>Order history</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => user && fetchOrders(user.id)} style={{
              padding: '9px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
              borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => setBulkOpen(true)} style={{
              padding: '9px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
              borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 7
            }}>
              📦 Bulk order
            </button>
            <button onClick={() => setOrderOpen(true)} style={{
              padding: '9px 18px', background: 'var(--accent)', border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 7
            }}>
              <Plus size={15} /> New label
            </button>
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '60px 24px', textAlign: 'center'
          }}>
            <div style={{ width: 56, height: 56, background: 'var(--bg-elevated)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Package size={24} color="var(--text-dim)" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>No orders yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Your first label is one click away.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setOrderOpen(true)} style={{
                padding: '11px 24px', background: 'var(--accent)', border: 'none',
                borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600
              }}>
                Buy your first label
              </button>
              <button onClick={() => setBulkOpen(true)} style={{
                padding: '11px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600
              }}>
                📦 Bulk order
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map(order => {
              const config = STATUS_CONFIG[order.status]
              const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div key={order.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '18px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, flexWrap: 'wrap', transition: 'border-color 0.2s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--bg-elevated)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={17} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {order.recipient_name} — {order.recipient_city}, {order.recipient_country}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {order.weight_kg < 1 ? `${(order.weight_kg * 1000).toFixed(0)}g` : `${order.weight_kg}kg`} · {date} · #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 16, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>
                      ${order.price_usd.toFixed(2)}
                    </span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 6,
                      background: config.bg, color: config.color, fontSize: 12, fontWeight: 500
                    }}>
                      {config.icon} {config.label}
                    </div>
                    {order.label_url && (
                      <a href={order.label_url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', background: 'var(--success-dim)',
                        border: '1px solid rgba(0,212,170,0.2)', borderRadius: 7,
                        color: 'var(--success)', textDecoration: 'none', fontSize: 13, fontWeight: 500
                      }}>
                        <Download size={13} /> Download
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} userId={user.id} />
      <BulkOrderModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} userId={user.id} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}