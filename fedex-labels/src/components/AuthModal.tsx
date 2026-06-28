'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Mail, Lock, Loader2, Package } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onSuccess()
        onClose()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-bright)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>ShipDeal</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {mode === 'signin' ? 'Sign in to access your labels' : 'Start buying labels in minutes'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 14,
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none'
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-bright)')}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'var(--success-dim)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--success)', fontSize: 13 }}>
              {success}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '12px', background: 'var(--accent)', border: 'none',
            borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 4, transition: 'opacity 0.2s'
          }}>
            {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
