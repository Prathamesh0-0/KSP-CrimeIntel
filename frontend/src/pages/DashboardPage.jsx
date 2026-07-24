import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { AlertTriangle, Users, TrendingUp, Award, MapPin, Database, RefreshCw } from 'lucide-react'
import { getKPIs, getOverview } from '../utils/api.js'

const COLORS = ['#1E40AF', '#D97706', '#16A34A', '#DC2626', '#7C3AED', '#3B82F6', '#F59E0B', '#CA8A04']
const BLUE   = '#1E40AF'

function KpiCard({ label, value, sub, colorClass, icon: Icon }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-3">
        <div className={`kpi-icon ${colorClass}`}>
          <Icon size={14} />
        </div>
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value mt-3">
        {typeof value === 'number' ? value.toLocaleString() : (value || '—')}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function MiniBarChart({ data, xKey, yKey, height = 200 }) {
  if (!data?.length) return <div className="empty" style={{ height }}><div className="empty-desc">Loading…</div></div>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'var(--font-sans)' }} angle={-35} textAnchor="end" interval={0} tickMargin={5} />
        <YAxis tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'var(--font-mono)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, fontFamily:'var(--font-sans)' }} itemStyle={{ fontFamily:'var(--font-mono)' }} />
        <Bar dataKey={yKey} radius={[2,2,0,0]} maxBarSize={28}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function MiniLineChart({ data, xKey, yKey, color = BLUE, height = 200 }) {
  if (!data?.length) return <div className="empty" style={{ height }}><div className="empty-desc">Loading…</div></div>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'var(--font-mono)' }} />
        <YAxis tick={{ fill:'var(--text-muted)', fontSize:10, fontFamily:'var(--font-mono)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, fontFamily:'var(--font-sans)' }} itemStyle={{ fontFamily:'var(--font-mono)' }} />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={{ r:3, fill:color }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function MiniPieChart({ data, nameKey, valueKey, height = 220 }) {
  if (!data?.length) return <div className="empty" style={{ height }}><div className="empty-desc">Loading…</div></div>
  const top8 = data.slice(0, 8)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={top8} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} innerRadius={35} paddingAngle={2} stroke="none">
          {top8.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:11, fontFamily:'var(--font-sans)' }}
          itemStyle={{ fontFamily:'var(--font-mono)' }}
          formatter={(v, n, p) => [`${v?.toLocaleString()} (${p.payload.pct || ''}%)`, n]} />
        <Legend formatter={v => <span style={{ color:'var(--text-secondary)' }}>{v?.length > 25 ? v.slice(0,25)+'…' : v}</span>} wrapperStyle={{ fontSize:10, fontFamily:'var(--font-sans)' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function DashboardPage() {
  const [kpis,     setKpis]     = useState(null)
  const [overview, setOverview] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [k, o] = await Promise.all([getKPIs(), getOverview()])
      setKpis(k.data)
      setOverview(o.data)
      setLastRefresh(new Date())
    } catch (e) {
      setError('Backend not reachable. Start the Python server: python main.py')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const hotspots  = overview?.hotspots?.data  || []
  const breakdown = overview?.breakdown?.data || []
  const trend     = overview?.trend?.data     || []
  const monthly   = overview?.monthly?.data   || []

  return (
    <div className="page-enter">
      {/* Error Banner */}
      {error && (
        <div className="err-banner">
          <AlertTriangle size={14} />{error}
        </div>
      )}

      {/* Header Area */}
      <div className="flex items-center mb-6">
        <div>
          <h2 className="section-title" style={{ margin: 0, fontSize: 13 }}>Karnataka Crime Overview</h2>
          <div className="text-muted mt-3" style={{ fontSize: 11 }}>
            Real-time data from SCRB — Last refreshed: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm ml-auto" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total FIRs"       value={kpis?.total_firs}       sub={`${kpis?.year_range || ''} data`}  colorClass="kpi-blue"   icon={Database} />
        <KpiCard label="Districts"         value={kpis?.total_districts}  sub="Police jurisdictions"              colorClass="kpi-amber"  icon={MapPin} />
        <KpiCard label="Top Crime"         value={kpis?.top_crime}        sub="Most reported category"            colorClass="kpi-red"    icon={AlertTriangle} />
        <KpiCard label="Conviction Rate"   value={kpis?.conviction_rate != null ? `${kpis.conviction_rate}%` : null}  sub="Cases with conviction" colorClass="kpi-green"  icon={Award} />
        <KpiCard label="Top District"      value={kpis?.top_district}     sub="By total FIR count"               colorClass="kpi-purple" icon={MapPin} />
        <KpiCard label="Victim Records"    value={kpis?.total_firs}       sub="Cross-matched victim entries"      colorClass="kpi-blue"   icon={Users} />
      </div>

      {/* Charts Grid */}
      <div className="dash-grid">
        {/* Hotspot bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Crime Districts</div>
              <div className="card-subtitle">By total FIR count — all years</div>
            </div>
            <span className="tag tag-blue">Hotspot</span>
          </div>
          <div className="card-body">
            <MiniBarChart data={hotspots} xKey="district" yKey="cases" height={220} />
          </div>
        </div>

        {/* Crime breakdown pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Crime Category Distribution</div>
              <div className="card-subtitle">Proportion by crime group</div>
            </div>
            <span className="tag tag-amber">Breakdown</span>
          </div>
          <div className="card-body">
            <MiniPieChart data={breakdown} nameKey="crime_group" valueKey="cases" height={220} />
          </div>
        </div>

        {/* Trend line — full width */}
        <div className="card col-full">
          <div className="card-header">
            <div>
              <div className="card-title">Crime Trend (2016–2023)</div>
              <div className="card-subtitle">Year-over-year FIR registration in Karnataka</div>
            </div>
            <span className="tag tag-green">Trend</span>
          </div>
          <div className="card-body">
            <MiniLineChart data={trend} xKey="year" yKey="cases" color="#16A34A" height={200} />
          </div>
        </div>

        {/* Monthly pattern */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Monthly Pattern</div>
              <div className="card-subtitle">Seasonal crime distribution</div>
            </div>
            <span className="tag tag-purple">Seasonal</span>
          </div>
          <div className="card-body">
            <MiniBarChart data={monthly} xKey="month" yKey="cases" height={200} />
          </div>
        </div>

        {/* Quick stats table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Hotspot Districts</div>
              <div className="card-subtitle">Ranked by case count</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="tbl-wrap no-border">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>District</th>
                    <th>Cases</th>
                    <th>Victims</th>
                    <th>Stations</th>
                  </tr>
                </thead>
                <tbody>
                  {hotspots.slice(0, 8).map((r, i) => (
                    <tr key={r.district}>
                      <td className="num text-muted">{i+1}</td>
                      <td className="font-500">{r.district}</td>
                      <td className="num">{(r.cases||0).toLocaleString()}</td>
                      <td className="num">{(r.victims||0).toLocaleString()}</td>
                      <td className="num">{r.stations||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
