'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Menu, X } from 'lucide-react'

interface NavbarProps {
  user?: { email?: string } | null
  onSignIn?: () => void
  onSignOut?: () => void
}

export default function Navbar({ user, onSignIn, onSignOut }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,14,26,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.3s ease',
      padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Package size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Ship<span style={{ color: 'var(--accent)' }}>Deal</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          <a href="#pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 14px', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Pricing
          </a>
          <a href="#how-it-works" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 14px', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            How it works
          </a>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/dashboard" style={{
                padding: '8px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                borderRadius: 8, color: 'var(--text)', textDecoration: 'none', fontSize: 14, fontWeight: 500
              }}>
                Dashboard
              </Link>
              <button onClick={onSignOut} style={{
                padding: '8px 18px', background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: 500
              }}>
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={onSignIn} style={{
                padding: '8px 18px', background: 'transparent', border: '1px solid var(--border-bright)',
                borderRadius: 8, color: 'var(--text)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}>
                Sign in
              </button>
              <button onClick={onSignIn} style={{
                padding: '8px 18px', background: 'var(--accent)', border: 'none',
                borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Get started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'none'
        }} className="mobile-menu-btn">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 15 }}>Pricing</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 15 }}>How it works</a>
          {user ? (
            <>
              <Link href="/dashboard" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Dashboard</Link>
              <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, textAlign: 'left', padding: 0 }}>Sign out</button>
            </>
          ) : (
            <button onClick={() => { onSignIn?.(); setMenuOpen(false) }} style={{
              padding: '10px', background: 'var(--accent)', border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600
            }}>
              Get started
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
