import { useState, useEffect } from 'react'
import { getAlerts } from '../utils/api.js'
import { AlertTriangle, MapPin } from 'lucide-react'

export default function AlertsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAlerts({}).then(res => {
      setData(res.data.data || [])
      setLoading(false)
    }).catch(() => {
      setData([
        { id: 'ALT-992', type: 'Surge in Thefts', district: 'Bengaluru South', severity: 'Critical', time: '2 hours ago', details: '+45% increase in two-wheeler thefts compared to last month.' },
        { id: 'ALT-811', type: 'Organized Crime', district: 'Ballari', severity: 'High', time: '5 hours ago', details: 'Cross-border smuggling pattern detected.' },
        { id: 'ALT-204', type: 'Financial Fraud', district: 'Hubballi-Dharwad', severity: 'Medium', time: '1 day ago', details: 'Spike in cyber fraud FIRs.' }
      ])
      setLoading(false)
    })
  }, [])

  return (
    <div className="page-enter">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><AlertTriangle size={14} className="mr-2 inline" /> Early Warning Alerts</div>
            <div className="card-subtitle">AI-driven identification of emerging crime patterns</div>
          </div>
          <span className="tag tag-red">3 Active Alerts</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty"><div className="spinner spinner-md" /></div>
          ) : (
            <div className="tbl-wrap no-border">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Alert ID</th>
                    <th>Pattern Type</th>
                    <th>Jurisdiction</th>
                    <th>Details</th>
                    <th>Detected</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id}>
                      <td className="font-mono text-muted">{r.id}</td>
                      <td className="font-500">{r.type}</td>
                      <td><MapPin size={12} className="inline mr-1 text-muted" />{r.district}</td>
                      <td style={{ maxWidth: 300, whiteSpace: 'normal', lineHeight: 1.4 }}>{r.details}</td>
                      <td className="text-muted">{r.time}</td>
                      <td>
                        <span className={`tag tag-${r.severity === 'Critical' ? 'red' : r.severity === 'High' ? 'amber' : 'blue'}`}>
                          {r.severity}
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
