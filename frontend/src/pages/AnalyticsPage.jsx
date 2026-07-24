import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Filter, TrendingUp, Network, Users, BarChart2, AlertTriangle } from 'lucide-react'
import { getHotspots, getTrends, getPredict, getVictim, getConviction, getSocio, getBreakdown } from '../utils/api.js'
import DataCard from '../components/DataCard.jsx'
import NetworkGraph from '../components/NetworkGraph.jsx'
import { getNetwork } from '../utils/api.js'

const COLORS = ['#1E40AF', '#D97706', '#16A34A', '#DC2626', '#7C3AED', '#3B82F6', '#F59E0B', '#CA8A04']

const CRIME_OPTIONS = [
  '', 'murder', 'rape', 'theft', 'robbery', 'kidnapping', 'fraud', 'assault',
  'drug', 'gambling', 'traffic', 'corruption', 'riot', 'dowry', 'arson',
]

const DISTRICT_OPTIONS = [
  '', 'Bagalkot', 'Bengaluru Urban', 'Bengaluru Rural', 'Belagavi', 'Ballari',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri',
  'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara',
  'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir',
]

function Section({ id, title, subtitle, tag, tagClass = 'blue', children }) {
  return (
    <div className="card mb-6">
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
        {tag && <span className={`tag tag-${tagClass}`}>{tag}</span>}
      </div>
      <div className="card-body" id={id}>{children}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [crimeType,  setCrimeType]  = useState('')
  const [district,   setDistrict]   = useState('')
  const [yearStart,  setYearStart]  = useState('2016')
  const [yearEnd,    setYearEnd]    = useState('2023')
  const [targetYear, setTargetYear] = useState('2026')

  const [hotspots,   setHotspots]   = useState([])
  const [trends,     setTrends]     = useState([])
  const [predicted,  setPredicted]  = useState([])
  const [victim,     setVictim]     = useState([])
  const [conviction, setConviction] = useState([])
  const [socio,      setSocio]      = useState([])
  const [network,    setNetwork]    = useState({ nodes:[], edges:[] })
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const run = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        crime_type:  crimeType || undefined,
        district:    district  || undefined,
        year_start:  yearStart,
        year_end:    yearEnd,
        target_year: targetYear,
        top_n:       12,
      }
      const [h, t, p, v, c, s, n] = await Promise.all([
        getHotspots(params),
        getTrends({ crime_type: params.crime_type, district: params.district, year_start: yearStart, year_end: yearEnd }),
        getPredict({ crime_type: params.crime_type, district: params.district, target_year: targetYear }),
        getVictim({ crime_type: params.crime_type, district: params.district }),
        getConviction({ top_n: 12 }),
        getSocio(),
        getNetwork({ crime_type: params.crime_type, district: params.district }),
      ])
      setHotspots(h.data.data    || [])
      setTrends(t.data.data      || [])
      setPredicted(p.data.data   || [])
      setVictim(v.data.data      || [])
      setConviction(c.data.data  || [])
      setSocio(s.data.data       || [])
      const nd = n.data.data || {}
      setNetwork({ nodes: nd.nodes || [], edges: nd.edges || [] })
    } catch (e) {
      setError('Backend not reachable. Ensure Python server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { run() }, [])

  return (
    <div className="page-enter">
      {/* Filter Bar */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-6 items-end flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="text-muted block mb-1 text-xs font-500 uppercase">Crime Type</label>
              <select className="input-field w-full" style={{ padding: '8px 12px' }} value={crimeType} onChange={e => setCrimeType(e.target.value)}>
                {CRIME_OPTIONS.map(o => <option key={o} value={o}>{o || 'All Crimes'}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-muted block mb-1 text-xs font-500 uppercase">District</label>
              <select className="input-field w-full" style={{ padding: '8px 12px' }} value={district} onChange={e => setDistrict(e.target.value)}>
                {DISTRICT_OPTIONS.map(o => <option key={o} value={o}>{o || 'All Districts'}</option>)}
              </select>
            </div>
            <div className="flex-none">
              <label className="text-muted block mb-1 text-xs font-500 uppercase">Year Range</label>
              <div className="flex gap-2">
                <input className="input-field" style={{ width: 80, padding: '8px 12px' }} type="number" min="2016" max="2023" value={yearStart} onChange={e => setYearStart(e.target.value)} />
                <input className="input-field" style={{ width: 80, padding: '8px 12px' }} type="number" min="2016" max="2023" value={yearEnd} onChange={e => setYearEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex-none">
              <label className="text-muted block mb-1 text-xs font-500 uppercase">Predict To</label>
              <input className="input-field" style={{ width: 90, padding: '8px 12px' }} type="number" min="2024" max="2030" value={targetYear} onChange={e => setTargetYear(e.target.value)} />
            </div>
            <div className="flex-none">
              <button className="btn btn-primary" onClick={run} disabled={loading} style={{ height: 35, padding: '0 16px' }}>
                {loading ? <div className="spinner spinner-sm mr-2" /> : <Filter size={14} className="mr-2" />}
                {loading ? 'ANALYSING…' : 'RUN ANALYSIS'}
              </button>
            </div>
          </div>
          {error && (
            <div className="err-banner mt-4">
              <AlertTriangle size={12} className="mr-2" />{error}
            </div>
          )}
        </div>
      </div>

      {/* 1. Hotspot Analysis */}
      <Section id="hotspots-chart" title="Crime Hotspot Analysis" subtitle="Top districts by case count" tag="Hotspot" tagClass="red">
        <DataCard vizType="bar" data={hotspots} totalRows={hotspots.length} />
      </Section>

      {/* 2. Trend + Prediction */}
      <Section id="trend-chart" title="Crime Trend & Prediction" subtitle={`Historical data ${yearStart}–${yearEnd} with forecast to ${targetYear}`} tag="Predictive" tagClass="amber">
        <DataCard vizType="line" data={predicted} totalRows={predicted.length} />
      </Section>

      {/* 3. Network Graph */}
      <Section id="network-chart" title="District–Crime Pattern Network" subtitle="Force-directed graph: districts linked to crime types by case volume" tag="Network" tagClass="purple">
        <NetworkGraph nodes={network.nodes} edges={network.edges} />
      </Section>

      {/* 4. Victim Profile */}
      <Section id="victim-chart" title="Victim & Accused Demographic Profile" subtitle="Gender and age breakdown from FIR records" tag="Demographics" tagClass="green">
        <DataCard vizType="bar" data={victim} totalRows={victim.length} />
      </Section>

      {/* 5. Conviction Rate */}
      <Section id="conviction-chart" title="Justice Performance — Conviction Rates" subtitle="Districts ranked by conviction & chargesheet rates" tag="Performance" tagClass="blue">
        <DataCard vizType="bar" data={conviction} totalRows={conviction.length} />
      </Section>

      {/* 6. Socioeconomic Correlation */}
      <Section id="socio-chart" title="Socioeconomic Factors vs Crime Rate" subtitle="Scatter: literacy rate vs crime rate per 100k population" tag="Socio" tagClass="amber">
        {socio.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top:10, right:20, left:-10, bottom:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="literacy" type="number" name="Literacy %" tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'var(--font-mono)' }}
                label={{ value:'Literacy Rate (%)', position:'insideBottom', offset:-10, fill:'var(--text-muted)', fontSize:10 }} />
              <YAxis dataKey="crime_rate" type="number" name="Crime Rate" tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'var(--font-mono)' }}
                label={{ value:'Crime Rate per 100k', angle:-90, position:'insideLeft', fill:'var(--text-muted)', fontSize:10 }} />
              <Tooltip contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, fontFamily:'var(--font-sans)' }}
                cursor={{ strokeDasharray:'3 3' }}
                formatter={(v, n) => [v?.toLocaleString(), n]} />
              <Scatter data={socio} fill="#1E40AF" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty"><div className="empty-desc">Click "Run Analysis" to load data</div></div>
        )}
      </Section>
    </div>
  )
}
