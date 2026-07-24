import { useState, useEffect } from 'react'
import { getOffenders } from '../utils/api.js'
import { Users, AlertTriangle } from 'lucide-react'

export default function OffenderPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOffenders({}).then(res => {
      setData(res.data.data || [])
      setLoading(false)
    }).catch(() => {
      // Mock data for demo if backend endpoint is not ready
      setData([
        { id: 'OFF-2391', name: 'Ramesh K.', type: 'Theft, Robbery', risk: 85, district: 'Bengaluru Urban', cases: 14 },
        { id: 'OFF-1024', name: 'Syed M.', type: 'Fraud', risk: 72, district: 'Mysuru', cases: 8 },
        { id: 'OFF-8842', name: 'Gowda S.', type: 'Assault', risk: 64, district: 'Mandya', cases: 5 }
      ])
      setLoading(false)
    })
  }, [])

  return (
    <div className="page-enter">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Offender Profiling & Modus Operandi</div>
            <div className="card-subtitle">Behavioral analysis and recidivism risk assessment</div>
          </div>
        </div>
        
        <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '12px 20px', borderBottom: '1px solid rgba(217, 119, 6, 0.3)', display: 'flex', alignItems: 'center', gap: 12, color: '#F59E0B' }}>
          <AlertTriangle size={18} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Synthetic Data Demonstration</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>The raw dataset lacks structured individual offender timelines. This page demonstrates the profiling capability using simulated data.</div>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {loading ? (
            <div className="empty"><div className="spinner spinner-md" /></div>
          ) : (
            <div className="tbl-wrap no-border">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Offender ID</th>
                    <th>Known Alias / Name</th>
                    <th>Primary Offense</th>
                    <th>Operating District</th>
                    <th>Cases Linked</th>
                    <th>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id}>
                      <td className="font-mono text-muted">{r.id}</td>
                      <td className="font-500">{r.name}</td>
                      <td>{r.type}</td>
                      <td>{r.district}</td>
                      <td className="num">{r.cases}</td>
                      <td>
                        <span className={`tag tag-${r.risk >= 80 ? 'red' : r.risk >= 60 ? 'amber' : 'green'}`}>
                          {r.risk}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
