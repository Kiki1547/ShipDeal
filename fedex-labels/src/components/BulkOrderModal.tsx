'use client'
import { useState } from 'react'
import { X, Loader2, FileSpreadsheet, Trash2, ShoppingCart } from 'lucide-react'
import { getPriceForWeight } from '@/lib/pricing'
import { supabase } from '@/lib/supabase'

interface BulkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

interface Row {
  weight_kg: number
  recipient_name: string
  recipient_address: string
  recipient_city: string
  recipient_zip: string
  recipient_country: string
  price: number
  error?: string
}

function parseCSV(text: string): Row[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] || '' })
    const weight_kg = parseFloat(obj['weight_kg'] || obj['weight'] || '0')
    return {
      weight_kg,
      recipient_name: obj['recipient_name'] || obj['name'] || '',
      recipient_address: obj['recipient_address'] || obj['address'] || '',
      recipient_city: obj['recipient_city'] || obj['city'] || '',
      recipient_zip: obj['recipient_zip'] || obj['zip'] || '',
      recipient_country: obj['recipient_country'] || obj['country'] || '',
      price: getPriceForWeight(weight_kg),
      error: !weight_kg || weight_kg > 30 ? 'Invalid weight' : undefined,
    }
  }).filter(r => r.recipient_name)
}

export default function BulkOrderModal({ isOpen, onClose, userId }: BulkOrderModalProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setRows([])
    setError('')
    setLoading(false)
    onClose()
  }

  const handleFile = async (file: File) => {
    setError('')
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        setRows(parseCSV(text))
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_csv(ws)
        setRows(parseCSV(data))
      } else {
        setError('Please upload a CSV or Excel file')
      }
    } catch {
      setError('Failed to parse file')
    }
  }

  const validRows = rows.filter(r => !r.error)
  const total = validRows.reduce((s, r) => s + r.price, 0)

  const handleCheckout = async () => {
    if (!validRows.length) return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/checkout-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId, orders: validRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Reset state before redirect
      setRows([])
      setError('')
      if (data.url) {
        const url = data.url
        setTimeout(() => { window.location.href = url }, 0)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-bright)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 700,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'Space Grotesk' }}>Bulk order</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Upload a CSV or Excel file to order multiple labels at once</p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Template */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Required columns</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              weight_kg, recipient_name, recipient_address, recipient_city, recipient_zip, recipient_country
            </div>
          </div>
          <a href="data:text/csv;charset=utf-8,weight_kg,recipient_name,recipient_address,recipient_city,recipient_zip,recipient_country%0A0.5,John Doe,123 Main St,New York,10001,United States%0A2,Jane Smith,456 Oak Ave,London,SW1A 1AA,United Kingdom"
            download="shipdeal-template.csv"
            style={{ padding: '7px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-bright)', borderRadius: 7, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' }}>
            ↓ Download template
          </a>
        </div>

        {/* Drop zone */}
        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '32px', borderRadius: 10, cursor: 'pointer', marginBottom: 20,
            border: `2px dashed ${dragOver ? 'var(--accent)' : rows.length ? '#00D4AA' : 'var(--border-bright)'}`,
            background: dragOver ? 'var(--accent-dim)' : rows.length ? 'rgba(0,212,170,0.05)' : 'var(--bg-elevated)',
            transition: 'all 0.2s'
          }}>
          <FileSpreadsheet size={28} color={rows.length ? '#00D4AA' : 'var(--text-dim)'} />
          <div style={{ textAlign: 'center' }}>
            {rows.length ? (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#00D4AA' }}>{rows.length} rows loaded — click to replace</div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Drop your CSV or Excel file here</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>or click to browse</div>
              </>
            )}
          </div>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} style={{ display: 'none' }} />
        </label>

        {/* Preview table */}
        {rows.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{rows.length} labels detected</span>
              <button onClick={() => setRows([])} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['Recipient', 'City', 'Country', 'Weight', 'Price'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)', background: row.error ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: row.error ? '#EF4444' : 'var(--text)' }}>{row.recipient_name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{row.recipient_city}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>{row.recipient_country}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                        {row.weight_kg < 1 ? `${(row.weight_kg * 1000).toFixed(0)}g` : `${row.weight_kg}kg`}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: row.error ? '#EF4444' : 'var(--accent)', fontFamily: 'Space Grotesk' }}>
                        {row.error ? row.error : `$${row.price.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.some(r => r.error) && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#F59E0B' }}>
                ⚠️ {rows.filter(r => r.error).length} row(s) with errors will be skipped
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {validRows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 10, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{validRows.length} labels</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Ready to order</div>
            </div>
            <div style={{ fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>
              ${total.toFixed(2)}
            </div>
          </div>
        )}

        <button onClick={handleCheckout} disabled={loading || !validRows.length} style={{
          width: '100%', padding: '13px', background: 'var(--accent)', border: 'none',
          borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
          cursor: loading || !validRows.length ? 'not-allowed' : 'pointer',
          opacity: !validRows.length ? 0.4 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          <ShoppingCart size={16} />
          {loading ? 'Redirecting to payment...' : `Pay $${total.toFixed(2)} for ${validRows.length} label${validRows.length > 1 ? 's' : ''} →`}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}