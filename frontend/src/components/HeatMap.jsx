import { useState, useEffect } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import api from '../utils/api.js'

export default function HeatMap() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/map').then(res => {
      // Filter out invalid coordinates and extreme outliers for Karnataka
      const validPoints = (res.data.data || []).filter(d => 
        d.lat > 11.5 && d.lat < 18.5 && 
        d.lon > 74.0 && d.lon < 78.5
      )
      setData(validPoints)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty"><div className="spinner spinner-md" /></div>

  return (
    <div style={{ position: 'relative', width: '100%', height: 400, background: '#0F172A', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {/* Karnataka Bounding Box */}
          <XAxis type="number" dataKey="lon" domain={[74.0, 78.5]} hide />
          <YAxis type="number" dataKey="lat" domain={[11.5, 18.5]} hide />
          <ZAxis type="number" range={[2, 10]} />
          
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)', padding: 8, borderRadius: 4, color: '#fff', fontSize: 11 }}>
                    <div className="font-500">{data.district}</div>
                    <div style={{ color: 'var(--color-accent-light)' }}>{data.crime_group}</div>
                    <div className="font-mono text-muted" style={{ marginTop: 4 }}>Lat: {data.lat.toFixed(4)}, Lon: {data.lon.toFixed(4)}</div>
                  </div>
                )
              }
              return null
            }}
          />
          <Scatter name="Crimes" data={data} fill="#0369A1" fillOpacity={0.4} />
        </ScatterChart>
      </ResponsiveContainer>
      
      <div style={{ position: 'absolute', top: 12, left: 16, color: '#fff', fontWeight: 600, fontSize: 13 }}>
        Geospatial Scatter Map
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>Karnataka Regional Topology</div>
      </div>
      
      <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, padding: '4px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
        {data.length.toLocaleString()} FIR Density Points (Live)
      </div>
    </div>
  )
}
