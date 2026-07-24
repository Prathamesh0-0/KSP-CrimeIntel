import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import api from '../utils/api.js'
import { Shield, UserPlus, CheckCircle, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'investigator',
    badge: ''
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/chat')
    }
  }, [user, navigate])

  if (!user || user.role !== 'admin') return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      await api.post('/admin/users', form)
      setMsg({ type: 'success', text: `User ${form.username} created successfully!` })
      setForm({ username: '', password: '', role: 'investigator', badge: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 600, margin: '40px auto' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><Shield size={16} className="mr-2 inline" /> System Administration</div>
            <div className="card-subtitle">Role-Based Access Control - User Provisioning</div>
          </div>
        </div>
        
        <div className="card-body">
          {msg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'success' ? '#10B981' : '#EF4444',
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 20
            }}>
              {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span style={{ fontSize: 13, fontWeight: 500 }}>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="text-muted block mb-2 text-xs font-500 uppercase">Username (Login ID)</label>
              <div className="input-wrap">
                <input name="username" value={form.username} onChange={handleChange} className="input-field" placeholder="e.g. inspector_ravi" required />
              </div>
            </div>
            
            <div>
              <label className="text-muted block mb-2 text-xs font-500 uppercase">Password</label>
              <div className="input-wrap">
                <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Enter secure password" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="text-muted block mb-2 text-xs font-500 uppercase">System Role</label>
                <div className="input-wrap">
                  <select name="role" value={form.role} onChange={handleChange} className="input-field" style={{ cursor: 'pointer' }}>
                    <option value="admin">Admin</option>
                    <option value="investigator">Investigator</option>
                    <option value="analyst">Analyst</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-muted block mb-2 text-xs font-500 uppercase">Badge Number</label>
                <div className="input-wrap">
                  <input name="badge" value={form.badge} onChange={handleChange} className="input-field" placeholder="e.g. KSP-1049" required />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <div className="spinner spinner-sm" /> : <><UserPlus size={16} className="inline mr-2" /> Provision Account</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
