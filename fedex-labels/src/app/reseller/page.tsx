'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Upload, CheckCircle, Clock, RefreshCw, LogOut, ArrowLeft, X, Loader2, Download } from 'lucide-react'

interface Recipient {
  weight_kg: number
  recipient_name: string
  recipient_address: string
  recipient_city: string
  recipient_zip: string
  recipient_country: string
}

interface Order {
  id: string
  weight_kg: number
  price_usd: number
  status: 'pending_payment' | 'paid' | 'label_ready' | 'cancelled'
  label_url: string | null
  recipient_name: string
  recipient_address: string
  recipient_city: string
  recipient_country: string
  recipient_zip: string
  is_bulk: boolean
  bulk_recipients: Recipient[] | null
  created_at: string
}

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 90 }}>{label} :</span>
    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value}</span>
  </div>
)

export default function ResellerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModal, setUploadModal] = useState<Order | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const router = useRouter()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/reseller/orders', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (res.ok) setOrders(await res.json().then((d: { orders: Order[] }) => d.orders))
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      fetchOrders()
    })
  }, [router, fetchOrders])

  const downloadExcel = async (order: Order) => {
    const XLSX = await import('xlsx')
    const recipients = order.bulk_recipients || []
    const data = recipients.map((r, i) => ({
      '#': i + 1,
      'Nom': r.recipient_name,
      'Adresse': r.recipient_address,
      'Ville': r.recipient_city,
      'Code postal': r.recipient_zip,
      'Pays': r.recipient_country,
      'Poids': r.weight_kg < 1 ? `${(r.weight_kg * 1000).toFixed(0)}g` : `${r.weight_kg}kg`,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Labels')
    XLSX.writeFile(wb, `shipdeal-order-${order.id.slice(0, 8)}.xlsx`)
  }

  const handleUpload = async () => {
    if (!uploadModal || !pdfFile) return
    setUploading(true)
    setUploadError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fileName = `${uploadModal.id}-${Date.now()}.pdf`
      const { error: uploadErr } = await supabase.storage
        .from('labels')
        .upload(fileName, pdfFile, { contentType: 'application/pdf', upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)
      const { data: urlData } = supabase.storage.from('labels').getPublicUrl(fileName)
      const labelUrl = urlData.publicUrl
      const res = await fetch('/api/reseller/upload-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ orderId: uploadModal.id, labelUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadModal(null)
      setPdfFile(null)
      fetchOrders()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const pending = orders.filter(o => o.status === 'paid')
  const done = orders.filter(o => o.status === 'label_ready')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <ArrowLeft size={13} /> Home
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: '#8B5CF6', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>Reseller Panel</h1>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Your assigned orders</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchOrders} style={{ padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'rgba(59,130,246,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Awaiting label</div>
              <div style={{ fontSize: 26, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>{pending.length}</div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'rgba(0,212,170,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color="#00D4AA" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Labels delivered</div>
              <div style={{ fontSize: 26, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>{done.length}</div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 16, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
          Awaiting label upload
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : pending.length === 0 ? (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', marginBottom: 28 }}>
            <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All caught up! No pending orders.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {pending.map(order => (
              <div key={order.id} style={{
                background: 'var(--bg-surface)', border: `1px solid ${order.is_bulk ? 'rgba(139,92,246,0.3)' : 'rgba(59,130,246,0.25)'}`,
                borderRadius: 12, padding: '20px 22px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                      {order.is_bulk && (
                        <div style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>
                          BULK — {order.bulk_recipients?.length || 0} labels
                        </div>
                      )}
                    </div>
                    {order.is_bulk ? (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {order.bulk_recipients?.length} recipients · ${order.price_usd.toFixed(2)} total
                      </div>
                    ) : (
                      <>
                        <InfoRow label="Nom" value={order.recipient_name} />
                        <InfoRow label="Adresse" value={order.recipient_address} />
                        <InfoRow label="Ville" value={order.recipient_city} />
                        <InfoRow label="Code postal" value={order.recipient_zip} />
                        <InfoRow label="Pays" value={order.recipient_country} />
                        <InfoRow label="Poids" value={order.weight_kg < 1 ? `${(order.weight_kg * 1000).toFixed(0)} g` : `${order.weight_kg} kg`} />
                        <InfoRow label="Prix" value={`$${order.price_usd.toFixed(2)}`} />
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {order.is_bulk && (
                      <button onClick={() => downloadExcel(order)} style={{
                        padding: '9px 16px', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)',
                        borderRadius: 8, color: '#00D4AA', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <Download size={14} /> Download Excel
                      </button>
                    )}
                    <button onClick={() => { setUploadModal(order); setPdfFile(null); setUploadError('') }} style={{
                      padding: '9px 16px', background: '#8B5CF6', border: 'none',
                      borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <Upload size={14} /> Upload label
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, fontFamily: 'Space Grotesk', fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Completed</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {done.map(order => (
                <div key={order.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '14px 20px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {order.is_bulk ? `Bulk — ${order.bulk_recipients?.length} labels` : `${order.recipient_name} — ${order.recipient_city}`}
                      </div>
                      {order.is_bulk && (
                        <div style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>BULK</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>#{order.id.slice(0, 8).toUpperCase()} · ${order.price_usd.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {order.is_bulk && (
                      <button onClick={() => downloadExcel(order)} style={{
                        padding: '6px 12px', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)',
                        borderRadius: 7, color: '#00D4AA', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 5
                      }}>
                        <Download size={12} /> Excel
                      </button>
                    )}
                    <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(0,212,170,0.1)', color: '#00D4AA', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> Label delivered
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {uploadModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000
        }} onClick={e => e.target === e.currentTarget && setUploadModal(null)}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-bright)',
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 440,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>Upload label PDF</h3>
              <button onClick={() => setUploadModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              {uploadModal.is_bulk ? (
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  Bulk order — <strong style={{ color: 'var(--text)' }}>{uploadModal.bulk_recipients?.length} labels</strong> · ${uploadModal.price_usd.toFixed(2)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <InfoRow label="Nom" value={uploadModal.recipient_name} />
                  <InfoRow label="Adresse" value={uploadModal.recipient_address} />
                  <InfoRow label="Ville" value={uploadModal.recipient_city} />
                  <InfoRow label="Code postal" value={uploadModal.recipient_zip} />
                  <InfoRow label="Pays" value={uploadModal.recipient_country} />
                  <InfoRow label="Poids" value={uploadModal.weight_kg < 1 ? `${(uploadModal.weight_kg * 1000).toFixed(0)} g` : `${uploadModal.weight_kg} kg`} />
                </div>
              )}
            </div>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '24px', borderRadius: 10, cursor: 'pointer', marginBottom: 16,
              border: `2px dashed ${pdfFile ? '#8B5CF6' : 'var(--border-bright)'}`,
              background: pdfFile ? 'rgba(139,92,246,0.08)' : 'var(--bg-elevated)',
              transition: 'all 0.2s'
            }}>
              <Upload size={24} color={pdfFile ? '#8B5CF6' : 'var(--text-dim)'} />
              {pdfFile ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#8B5CF6' }}>{pdfFile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{(pdfFile.size / 1024).toFixed(0)} KB</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Click to select PDF</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>FedEx label PDF only</div>
                </div>
              )}
              <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </label>

            {uploadError && (
              <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13, marginBottom: 14 }}>
                {uploadError}
              </div>
            )}

            <button onClick={handleUpload} disabled={uploading || !pdfFile} style={{
              width: '100%', padding: '12px', background: '#8B5CF6', border: 'none',
              borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: uploading || !pdfFile ? 'not-allowed' : 'pointer',
              opacity: !pdfFile ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              {uploading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {uploading ? 'Uploading...' : 'Confirm & deliver to customer'}
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}