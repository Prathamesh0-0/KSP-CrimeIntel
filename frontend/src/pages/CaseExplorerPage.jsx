import { useState, useEffect } from 'react'
import { getFIR, getSimilarity } from '../utils/api.js'
import { FolderSearch, Search, FileText } from 'lucide-react'

export default function CaseExplorerPage() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = () => {
    setLoading(true)
    // Simulate API call for semantic case search
    setTimeout(() => {
      setData([
        { id: 'FIR-2023-8812', title: 'Armed Robbery at Jewelry Store', date: '2023-04-12', district: 'Bengaluru Urban', similarity: '98%', status: 'Under Investigation' },
        { id: 'FIR-2022-4190', title: 'Theft from ATM', date: '2022-11-05', district: 'Mysuru', similarity: '85%', status: 'Chargesheet Filed' },
        { id: 'FIR-2023-1102', title: 'Snatching of gold chain', date: '2023-01-20', district: 'Mangaluru', similarity: '76%', status: 'Convicted' }
      ])
      setLoading(false)
    }, 800)
  }

  return (
    <div className="page-enter">
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-muted block mb-1 text-xs font-500 uppercase">Semantic FIR Search</label>
              <div className="input-wrap">
                <Search size={16} className="ml-3 text-muted" />
                <input
                  className="input-field"
                  style={{ paddingLeft: 36, width: '100%' }}
                  placeholder="Describe the case details, modus operandi, or incident..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading} style={{ height: 38 }}>
              {loading ? <div className="spinner spinner-sm mr-2" /> : <FolderSearch size={14} className="mr-2" />}
              {loading ? 'SEARCHING…' : 'FIND SIMILAR CASES'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Similar Past Cases</div>
            <div className="card-subtitle">AI-matched historical records based on modus operandi</div>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {data.length === 0 ? (
            <div className="empty"><div className="empty-desc">Enter a query to find similar past cases</div></div>
          ) : (
            <div className="tbl-wrap no-border">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Match %</th>
                    <th>FIR ID</th>
                    <th>Case Summary</th>
                    <th>Date</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id}>
                      <td className="font-500 text-green">{r.similarity}</td>
                      <td className="font-mono">{r.id}</td>
                      <td>{r.title}</td>
                      <td className="text-muted">{r.date}</td>
                      <td>{r.district}</td>
                      <td>
                        <span className={`tag tag-${r.status === 'Convicted' ? 'green' : r.status === 'Under Investigation' ? 'amber' : 'blue'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" title="View FIR details"><FileText size={14} /></button>
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
