import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react'

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
    } catch {
      setError('Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-head">
          <div className="login-emblem" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/logo.png" alt="KSP Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </div>
          <div className="login-title">KSP CRIMEINTEL</div>
          <div className="login-subtitle">
            Karnataka State Police — Secure Intelligence Portal
          </div>
        </div>

        <div className="login-body">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-wrap">
              <User size={16} />
              <input
                id="login-username"
                className="login-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username / Badge ID"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-input-wrap" style={{ position: 'relative' }}>
              <Lock size={16} />
              <input
                id="login-password"
                className="login-field"
                style={{ paddingRight: 36 }}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer'
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <div className="login-error">⚠ {error}</div>}

            <button id="login-btn" className="login-btn mt-3" type="submit" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> : null}
              {loading ? 'AUTHENTICATING…' : 'SIGN IN TO PORTAL'}
            </button>
          </form>
        </div>


        <div className="login-footer">
          RESTRICTED ACCESS — AUTHORISED KSP PERSONNEL ONLY
        </div>
      </div>
    </div>
  )
}
