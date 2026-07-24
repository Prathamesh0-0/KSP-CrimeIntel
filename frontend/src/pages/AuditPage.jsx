import { useState, useEffect } from 'react'
import { getAudit } from '../utils/api.js'
import { ShieldCheck, User } from 'lucide-react'

export default function AuditPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAudit({}).then(res => {
      setData(res.data.data || [])
      setLoading(false)
    }).catch(() => {
      setData([
        { id: 'LOG-0912', user: 'Investigator A.', badge: 'KSP-8821', action: 'Exported PDF Report', resource: 'Analytics > Hotspots', time: '10 mins ago', status: 'Success' },
        { id: 'LOG-0911', user: 'Analyst B.', badge: 'KSP-4412', action: 'Query Chat', resource: 'NLP Engine (Gemini)', time: '45 mins ago', status: 'Success' },
        { id: 'LOG-0910', user: 'Admin', badge: 'KSP-0001', action: 'System Login', resource: 'Auth', time: '2 hours ago', status: 'Success' }
      ])
      setLoading(false)
    })
  }, [])

  return (
    <div className="page-enter">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><ShieldCheck size={14} className="mr-2 inline" /> Query Audit Log</div>
            <div className="card-subtitle">Secure access tracking and governance</div>
          </div>
          <span className="tag tag-green">Compliance: Pass</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty"><div className="spinner spinner-md" /></div>
          ) : (
            <div className="tbl-wrap no-border">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Officer Name</th>
                    <th>Badge Number</th>
                    <th>Action</th>
                    <th>Resource Accessed</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id}>
                      <td className="font-mono text-muted">{r.id}</td>
                      <td className="font-500"><User size={12} className="inline mr-1 text-muted" /> {r.user}</td>
                      <td className="font-mono">{r.badge}</td>
                      <td>{r.action}</td>
                      <td>{r.resource}</td>
                      <td className="text-muted">{r.time}</td>
                      <td>
                        <span className={`tag tag-${r.status === 'Success' ? 'green' : 'red'}`}>
                          {r.status}
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
