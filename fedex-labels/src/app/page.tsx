'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import AuthModal from '@/components/AuthModal'
import OrderModal from '@/components/OrderModal'
import { PRICING_TIERS, getPriceForWeight } from '@/lib/pricing'
import { Package, Zap, Shield, Clock, ChevronDown, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [previewWeight, setPreviewWeight] = useState(1.0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleOrderClick = () => {
    if (user) setOrderOpen(true)
    else setAuthOpen(true)
  }

  const previewPrice = getPriceForWeight(previewWeight)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} onSignIn={() => setAuthOpen(true)} onSignOut={handleSignOut} />

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
          opacity: 0.4
        }} />
        {/* Orange glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,107,0,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', maxWidth: 720, textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 28
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>FedEx International Priority</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 76px)', fontFamily: 'Space Grotesk',
            fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em',
            color: 'var(--text)', marginBottom: 24
          }}>
            Ship anywhere.<br />
            <span style={{ color: 'var(--accent)' }}>Pay almost nothing.</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Genuine FedEx International Priority labels from <strong style={{ color: 'var(--text)' }}>$2.40</strong>. 
            One-time purchase, no subscription. Label delivered in minutes.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleOrderClick} style={{
              padding: '14px 32px', background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 32px rgba(255,107,0,0.35)', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,107,0,0.45)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,107,0,0.35)' }}>
              Buy a label <ArrowRight size={16} />
            </button>
            <a href="#pricing" style={{
              padding: '14px 32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
              borderRadius: 10, color: 'var(--text)', fontSize: 16, fontWeight: 500,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.2s'
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-dim)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}>
              See pricing
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {[
              { icon: <Shield size={14} />, text: 'Secure payment via Stripe' },
              { icon: <Zap size={14} />, text: 'Label ready in minutes' },
              { icon: <Clock size={14} />, text: 'No subscription needed' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <a href="#pricing" style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: 'var(--text-dim)', animation: 'bounce 2s infinite' }}>
          <ChevronDown size={22} />
        </a>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: '100px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
              Simple pricing
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              One price per weight tier
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 420, margin: '0 auto' }}>
              No hidden fees. No minimum order. You pay only for what you ship.
            </p>
          </div>

          {/* Interactive pricer */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-bright)',
            borderRadius: 20, padding: '36px 40px', marginBottom: 40,
            boxShadow: '0 0 0 1px rgba(255,107,0,0.05), 0 24px 48px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }} className="pricing-grid">
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 16 }}>Move the slider to see your price</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                  <span style={{ fontSize: 56, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    ${previewPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>/ label</span>
                </div>
                <input type="range" min="0.05" max="30" step="0.05"
                  value={previewWeight}
                  onChange={e => setPreviewWeight(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)' }}>
                  <span>50g</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    {previewWeight < 1 ? `${(previewWeight * 1000).toFixed(0)} g` : `${previewWeight.toFixed(2)} kg`}
                  </span>
                  <span>30 kg</span>
                </div>
                <button onClick={handleOrderClick} style={{
                  marginTop: 24, width: '100%', padding: '12px',
                  background: 'var(--accent)', border: 'none', borderRadius: 8,
                  color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  Order this label <ArrowRight size={15} />
                </button>
              </div>
              <div>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weight range</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</span>
                  </div>
                  {PRICING_TIERS.map((tier, i) => {
                    const active = previewWeight <= tier.maxKg && (i === 0 || previewWeight > PRICING_TIERS[i - 1].maxKg)
                    return (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr auto',
                        gap: 8, padding: '12px 16px',
                        background: active ? 'var(--accent-dim)' : 'transparent',
                        borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                        transition: 'all 0.25s ease'
                      }}>
                        <span style={{ fontSize: 14, color: active ? 'var(--text)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {active && <CheckCircle size={13} color="var(--accent)" />}
                          {tier.label}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                          ${tier.price.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .pricing-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" style={{ padding: '80px 24px 100px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)' }}>
              From order to shipment in 3 steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="steps-grid">
            {[
              { step: '01', icon: <Package size={22} color="var(--accent)" />, title: 'Select your weight', desc: 'Enter your package weight and destination. Our system instantly shows your price — no surprises.' },
              { step: '02', icon: <Shield size={22} color="var(--accent)" />, title: 'Pay securely', desc: 'Complete checkout via Stripe with any major card. Your payment is encrypted and processed instantly.' },
              { step: '03', icon: <Zap size={22} color="var(--accent)" />, title: 'Get your label', desc: 'We generate your FedEx label and send it directly to your email. Print and ship — it\'s that simple.' },
            ].map((item) => (
              <div key={item.step} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 28, position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  fontSize: 48, fontFamily: 'Space Grotesk', fontWeight: 800,
                  color: 'var(--border-bright)', lineHeight: 1, userSelect: 'none'
                }}>
                  {item.step}
                </div>
                <div style={{ marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .steps-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Ready to ship smarter?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 36 }}>
            Join customers saving on every international shipment. Get your first label now.
          </p>
          <button onClick={handleOrderClick} style={{
            padding: '16px 40px', background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 8px 32px rgba(255,107,0,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,107,0,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,107,0,0.35)' }}>
            Buy a label — from $2.40 <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={13} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              Ship<span style={{ color: 'var(--accent)' }}>Deal</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            © 2025 ShipDeal. FedEx is a registered trademark of FedEx Corporation.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); setOrderOpen(true) }} />
      {user && <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} userId={user.id} />}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes bounce { 0%,100% { transform:translateX(-50%) translateY(0) } 50% { transform:translateX(-50%) translateY(6px) } }
      `}</style>
    </div>
  )
}
