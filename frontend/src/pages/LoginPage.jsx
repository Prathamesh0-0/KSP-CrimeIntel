import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { Shield, Eye, EyeOff, Lock, User, Terminal } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/chat')
    } catch (err) {
      setError('ACCESS DENIED: Invalid Credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0B0F19 0%, #030712 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Background cyber grid effect */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.3) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        opacity: 0.8,
        pointerEvents: 'none'
      }} />

      {/* Decorative ambient glow */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '15%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%', right: '15%',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div className="login-card" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(14, 165, 233, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(14, 165, 233, 0.05)',
        overflow: 'hidden',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Subtle top indicator bar */}
        <div style={{
          height: '3px',
          width: '100%',
          background: 'linear-gradient(90deg, #0ea5e9, #6366f1)'
        }} />

        <div className="login-head" style={{
          padding: '40px 32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div className="login-emblem" style={{
            width: '84px',
            height: '84px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1.5px solid rgba(14, 165, 233, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)',
            transition: 'transform 0.3s ease'
          }}>
            <img src="/logo.png" alt="KSP Logo" style={{ width: 68, height: 68, objectFit: 'contain' }} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '20px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '1.5px',
            margin: 0
          }}>KSP CRIMEINTEL</h2>
          <p style={{
            fontSize: '11px',
            color: 'rgba(14, 165, 233, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: '6px',
            fontWeight: 600
          }}>Secure Analytics & Intelligence Portal</p>
        </div>

        <div className="login-body" style={{ padding: '32px' }}>
          <form className="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="login-input-wrap" style={{
              background: 'rgba(3, 7, 18, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              padding: '2px 14px',
              transition: 'all 0.2s ease'
            }}>
              <User size={16} style={{ color: 'rgba(14, 165, 233, 0.5)', marginRight: '10px' }} />
              <input
                id="login-username"
                className="login-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username / Badge ID"
                autoComplete="username"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  padding: '12px 0',
                  caretColor: '#0ea5e9'
                }}
              />
            </div>

            <div className="login-input-wrap" style={{
              background: 'rgba(3, 7, 18, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              padding: '2px 14px',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}>
              <Lock size={16} style={{ color: 'rgba(14, 165, 233, 0.5)', marginRight: '10px' }} />
              <input
                id="login-password"
                className="login-field"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Secure Access Key"
                autoComplete="current-password"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  padding: '12px 30px 12px 0',
                  caretColor: '#0ea5e9'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(14, 165, 233, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="login-error" style={{
                fontSize: '12px',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}>
                <Shield size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(90deg, #0ea5e9, #2563eb)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  <span>DECRYPTING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <Terminal size={16} />
                  <span>AUTHORIZE ACCESS</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="login-footer" style={{
          padding: '16px 32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          background: 'rgba(3, 7, 18, 0.4)',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.3)',
          textAlign: 'center',
          letterSpacing: '0.8px',
          lineHeight: '1.4'
        }}>
          WARNING: UNAUTHORIZED USE OF THIS SYSTEM IS STRICTLY PROHIBITED AND SUBJECT TO CRIMINAL PROSECUTION UNDER THE INFORMATION TECHNOLOGY ACT.
        </div>
      </div>
    </div>
  )
}
