import { useEffect, useRef, useState } from 'react'

const NODE_RADIUS = { district: 18, crime: 12 }
const W = 640, H = 380

function forceSimulate(nodes, edges, iterations = 200) {
  const pos = nodes.map((_, i) => ({
    x: W / 2 + (Math.random() - 0.5) * 300,
    y: H / 2 + (Math.random() - 0.5) * 200,
    vx: 0, vy: 0,
  }))

  const idxMap = {}
  nodes.forEach((n, i) => idxMap[n.id] = i)

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations

    // Repulsion
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i].x - pos[j].x
        const dy = pos[i].y - pos[j].y
        const d  = Math.max(Math.sqrt(dx*dx + dy*dy), 1)
        const f  = (6000 / (d * d)) * alpha
        pos[i].vx += dx / d * f
        pos[i].vy += dy / d * f
        pos[j].vx -= dx / d * f
        pos[j].vy -= dy / d * f
      }
    }

    // Attraction (edges)
    for (const e of edges) {
      const si = idxMap[e.from], ti = idxMap[e.to]
      if (si == null || ti == null) continue
      const dx = pos[ti].x - pos[si].x
      const dy = pos[ti].y - pos[si].y
      const d  = Math.max(Math.sqrt(dx*dx + dy*dy), 1)
      const f  = (d - 160) * 0.05 * alpha
      pos[si].vx += dx / d * f
      pos[si].vy += dy / d * f
      pos[ti].vx -= dx / d * f
      pos[ti].vy -= dy / d * f
    }

    // Center gravity
    for (const p of pos) {
      p.vx += (W/2 - p.x) * 0.01 * alpha
      p.vy += (H/2 - p.y) * 0.01 * alpha
      p.vx *= 0.85
      p.vy *= 0.85
      p.x   = Math.max(40, Math.min(W - 40, p.x + p.vx))
      p.y   = Math.max(40, Math.min(H - 40, p.y + p.vy))
    }
  }
  return pos
}

export default function NetworkGraph({ nodes = [], edges = [], onNodeClick }) {
  const [positions, setPositions] = useState([])
  const [hovered,   setHovered]   = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    if (!nodes.length) return
    const pos = forceSimulate(nodes, edges, 180)
    setPositions(pos)
  }, [nodes, edges])

  if (!nodes.length) return (
    <div className="empty" style={{ height: 200 }}>
      <div className="empty-desc">No network data</div>
    </div>
  )

  const idxMap = {}
  nodes.forEach((n, i) => idxMap[n.id] = i)

  const maxWeight = Math.max(...edges.map(e => e.weight || 1), 1)

  return (
    <div style={{ position: 'relative', height: H, background: '#0F172A', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <svg ref={svgRef} width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const si = idxMap[e.from], ti = idxMap[e.to]
          if (si == null || ti == null || !positions[si] || !positions[ti]) return null
          const opacity = 0.3 + 0.5 * (e.weight / maxWeight)
          return (
            <line key={i}
              x1={positions[si].x} y1={positions[si].y}
              x2={positions[ti].x} y2={positions[ti].y}
              stroke="var(--border-strong)"
              strokeWidth={1 + 2 * (e.weight / maxWeight)}
              strokeOpacity={opacity}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((n, i) => {
          if (!positions[i]) return null
          const r = NODE_RADIUS[n.type] || 12
          const isHov = hovered === n.id
          return (
            <g key={n.id}
              transform={`translate(${positions[i].x},${positions[i].y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick && onNodeClick(n)}
            >
              <circle r={r} fill={n.color || '#1E40AF'} fillOpacity={0.85}
                stroke={isHov ? '#fff' : '#0F172A'} strokeWidth={isHov ? 2 : 1.5} />
              <text textAnchor="middle" dy="0.3em"
                fontSize={n.type === 'district' ? 6 : 5}
                fill="#fff" fontWeight={600} fontFamily="var(--font-mono)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {n.label?.length > 10 ? n.label.slice(0, 10) : n.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 12, background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E40AF' }} />
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>District</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706' }} />
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Crime Type</span>
        </div>
      </div>
    </div>
  )
}
