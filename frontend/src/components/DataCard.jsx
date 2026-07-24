import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceArea
} from 'recharts'
import { Table, BarChart2, TrendingUp, PieChart as PieIcon, Network, ScatterChart as ScatterIcon, ChevronDown, ChevronUp } from 'lucide-react'
import NetworkGraph from './NetworkGraph.jsx'

const COLORS = ['#1E40AF', '#D97706', '#16A34A', '#DC2626', '#7C3AED', '#3B82F6', '#F59E0B', '#CA8A04']
const BLUE   = '#1E40AF'
const ORANGE = '#D97706'
const GREEN  = '#16A34A'

const VIZ_ICONS = {
  bar:     BarChart2,
  line:    TrendingUp,
  pie:     PieIcon,
  scatter: ScatterIcon,
  table:   Table,
  network: Network,
}

const VIZ_LABELS = {
  bar:     'Bar Chart',
  line:    'Line Chart',
  pie:     'Pie Chart',
  scatter: 'Scatter Plot',
  table:   'Data Table',
  network: 'Network Graph',
}

/* ─── Individual chart components ─────────────────────────── */

function BarViz({ data }) {
  if (!data?.length) return <Empty />
  const numKeys = Object.keys(data[0]).filter(k => k !== 'district' && k !== 'crime_group' && k !== 'month' && k !== 'category' && k !== 'mode' && k !== 'type' && typeof data[0][k] === 'number')
  const labelKey = data[0].district ? 'district' : data[0].crime_group ? 'crime_group' : data[0].month ? 'month' : data[0].category ? 'category' : data[0].mode ? 'mode' : Object.keys(data[0])[0]
  const valueKey = numKeys[0] || 'cases'

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-sans)' }}
          angle={-35} textAnchor="end" interval={0} tickMargin={5}
        />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-sans)' }}
          labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
        />
        <Bar dataKey={valueKey} fill={BLUE} radius={[2, 2, 0, 0]} maxBarSize={32}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
        {numKeys[1] && <Bar dataKey={numKeys[1]} fill={GREEN} radius={[2, 2, 0, 0]} maxBarSize={32} />}
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineViz({ data }) {
  if (!data?.length) return <Empty />
  const isPredict = data.some(d => d.type)
  const actualData    = isPredict ? data.filter(d => d.type === 'actual')    : data
  const predictedData = isPredict ? data.filter(d => d.type === 'predicted') : []
  const numKeys = Object.keys(data[0]).filter(k => k !== 'year' && k !== 'type' && k !== 'month_num' && typeof data[0][k] === 'number')
  const yKey = numKeys[0] || 'cases'

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart margin={{ top: 10, right: 10, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="year" type="category" allowDuplicatedCategory={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-sans)' }}
          labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
          itemStyle={{ fontFamily: 'var(--font-mono)' }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-sans)' }} />
        <Line data={actualData} type="monotone" dataKey={yKey} stroke={BLUE} strokeWidth={2} dot={{ r: 3, fill: BLUE }} name="Actual" />
        {isPredict && predictedData.length > 0 && (
          <>
            <Line data={[...actualData.slice(-1), ...predictedData]} type="monotone" dataKey={yKey} stroke={ORANGE} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: ORANGE }} name="Predicted" />
            <ReferenceArea x1={actualData[actualData.length - 1].year} x2={predictedData[predictedData.length - 1].year} fill="var(--color-accent-sub)" fillOpacity={0.5} />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

function PieViz({ data }) {
  if (!data?.length) return <Empty />
  const labelKey = data[0].crime_group ? 'crime_group' : data[0].category ? 'category' : data[0].mode ? 'mode' : Object.keys(data[0])[0]
  const valueKey = Object.keys(data[0]).find(k => k !== labelKey && typeof data[0][k] === 'number') || 'cases'

  const trimmed = data.slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={trimmed} dataKey={valueKey} nameKey={labelKey}
          cx="50%" cy="50%" outerRadius={90} innerRadius={40}
          paddingAngle={2} stroke="none"
        >
          {trimmed.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-sans)' }}
          itemStyle={{ fontFamily: 'var(--font-mono)' }}
          formatter={(v, n, p) => [`${v?.toLocaleString()} (${p.payload.pct || ''}%)`, n]}
        />
        <Legend
          formatter={v => <span style={{ color: 'var(--text-secondary)' }}>{v?.length > 28 ? v.slice(0, 28) + '…' : v}</span>}
          wrapperStyle={{ fontSize: 10, lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ScatterViz({ data }) {
  if (!data?.length) return <Empty />
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="literacy" type="number" name="Literacy (%)" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          label={{ value: 'Literacy Rate (%)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)', fontSize: 10 }} />
        <YAxis dataKey="crime_rate" type="number" name="Crime Rate" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          label={{ value: 'Crime Rate per 100k', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-sans)' }}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter data={data} fill={BLUE} opacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

function TableViz({ data }) {
  if (!data?.length) return <Empty />
  const cols = Object.keys(data[0])
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const pages = Math.ceil(data.length / PAGE_SIZE)
  const rows  = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const fmt = v => {
    if (v == null) return '—'
    if (typeof v === 'number') return v >= 1000 ? v.toLocaleString() : v
    if (typeof v === 'string' && v.length > 50) return v.slice(0, 50) + '…'
    return v
  }

  return (
    <div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {cols.map(c => <th key={c}>{c.replace(/_/g,' ')}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c} className={typeof row[c] === 'number' ? 'num' : ''}>
                    {fmt(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12, fontSize:11 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}>← Prev</button>
          <span style={{ color:'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Page {page+1} / {pages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages-1,p+1))} disabled={page===pages-1}>Next →</button>
        </div>
      )}
    </div>
  )
}

function Empty() {
  return <div className="empty"><div className="empty-desc">No data to display</div></div>
}

/* ─── Main DataCard ──────────────────────────────────────── */

export default function DataCard({ vizType, data, totalRows, summary }) {
  const [collapsed, setCollapsed] = useState(false)
  if (!vizType || vizType === 'none') return null
  if (!data) return null

  const Icon  = VIZ_ICONS[vizType] || BarChart2
  const label = VIZ_LABELS[vizType] || vizType

  const isNetwork = vizType === 'network'
  const isEmpty = !data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && !data.nodes && !Array.isArray(data))

  if (isEmpty) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Icon size={12} />
          {label}
          {totalRows != null && (
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4, fontFamily: 'var(--font-sans)', fontSize: 10, textTransform: 'none' }}>
              — {totalRows.toLocaleString()} records
            </span>
          )}
        </div>
        <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={() => setCollapsed(v => !v)}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="card-body">
          {vizType === 'bar'     && <BarViz     data={data} />}
          {vizType === 'line'    && <LineViz    data={data} />}
          {vizType === 'pie'     && <PieViz     data={data} />}
          {vizType === 'scatter' && <ScatterViz data={data} />}
          {vizType === 'table'   && <TableViz   data={data} />}
          {vizType === 'network' && <NetworkGraph nodes={data.nodes || []} edges={data.edges || []} />}
        </div>
      )}
    </div>
  )
}
