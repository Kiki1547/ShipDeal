'use client'
import { useState } from 'react'
import { X, Package, Weight, MapPin, User, Loader2, ChevronRight } from 'lucide-react'
import { getPriceForWeight, PRICING_TIERS } from '@/lib/pricing'


interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function OrderModal({ isOpen, onClose, userId }: OrderModalProps) {
  const [step, setStep] = useState(1)
  const [weightKg, setWeightKg] = useState(0.5)
  const [recipientName, setRecipientName] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [recipientCity, setRecipientCity] = useState('')
  const [recipientCountry, setRecipientCountry] = useState('')
  const [recipientZip, setRecipientZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const price = getPriceForWeight(weightKg)
  const currentTier = PRICING_TIERS.find(t => weightKg <= t.maxKg) ?? PRICING_TIERS[PRICING_TIERS.length - 1]

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weightKg, recipientName, recipientAddress, recipientCity, recipientCountry, recipientZip }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) { window.location.href = data.url } else { throw new Error("No checkout URL") }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
    borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-bright)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  height: 4, width: s === step ? 32 : 16, borderRadius: 2,
                  background: s <= step ? 'var(--accent)' : 'var(--border-bright)',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {step === 1 ? 'Package details' : 'Recipient info'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Step {step} of 2 — {step === 1 ? 'Set weight to get your price' : 'Where is this going?'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Weight slider */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 16 }}>
                <Weight size={14} /> Package weight
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 36, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)', minWidth: 80 }}>
                  {weightKg < 1 ? `${(weightKg * 1000).toFixed(0)}g` : `${weightKg}kg`}
                </span>
                <div style={{ flex: 1 }}>
                  <input type="range" min="0.05" max="30" step="0.05"
                    value={weightKg}
                    onChange={e => setWeightKg(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    <span>50g</span><span>30 kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price display */}
            <div style={{
              background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
              borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Your price
                </div>
                <div style={{ fontSize: 38, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>
                  ${price.toFixed(2)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Tier: {currentTier.label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>FedEx Intl Priority</div>
                <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>✓ Express delivery</div>
              </div>
            </div>

            {/* Tier table */}
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {PRICING_TIERS.map((tier, i) => {
                const active = currentTier === tier
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    background: active ? 'var(--accent-dim)' : (i % 2 === 0 ? 'var(--bg-elevated)' : 'transparent'),
                    borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontSize: 13, color: active ? 'var(--text)' : 'var(--text-muted)' }}>{tier.label}</span>
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                      ${tier.price.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>

            <button onClick={() => setStep(2)} style={{
              padding: '13px', background: 'var(--accent)', border: 'none',
              borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary */}
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 10, padding: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={16} color="var(--accent)" />
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {weightKg < 1 ? `${(weightKg * 1000).toFixed(0)}g` : `${weightKg}kg`}
                </span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
                ${price.toFixed(2)}
              </span>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                <User size={13} /> Recipient name
              </label>
              <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                placeholder="John Doe" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')} />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                <MapPin size={13} /> Street address
              </label>
              <input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)}
                placeholder="123 Main Street" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>City</label>
                <input value={recipientCity} onChange={e => setRecipientCity(e.target.value)}
                  placeholder="New York" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>ZIP / Postal</label>
                <input value={recipientZip} onChange={e => setRecipientZip(e.target.value)}
                  placeholder="10001" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Country</label>
              <input value={recipientCountry} onChange={e => setRecipientCountry(e.target.value)}
                placeholder="United States" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')} />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '12px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-bright)', borderRadius: 8, color: 'var(--text)',
                cursor: 'pointer', fontSize: 14, fontWeight: 500
              }}>
                ← Back
              </button>
              <button onClick={handleCheckout} disabled={loading || !recipientName || !recipientAddress || !recipientCity || !recipientCountry || !recipientZip}
                style={{
                  flex: 2, padding: '12px', background: 'var(--accent)', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer', opacity: (!recipientName || !recipientAddress || !recipientCity || !recipientCountry || !recipientZip) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Pay ${price.toFixed(2)} →
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
