import { useState, useEffect } from 'react'
import { getNetwork, getMap } from '../utils/api.js'
import NetworkGraph from '../components/NetworkGraph.jsx'
import { Network, Search, Link, Map as MapIcon } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function NetworkPage() {
  const [network, setNetwork] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  
  const [mapData, setMapData] = useState([])
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    getNetwork({}).then(res => {
      setNetwork(res.data.data || { nodes: [], edges: [] })
      setLoading(false)
    }).catch(() => setLoading(false))

    getMap({}).then(res => {
      setMapData(res.data.data || [])
      setMapLoading(false)
    }).catch(() => setMapLoading(false))
  }, [])

  const connectedEdges = selectedNode 
    ? network.edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).sort((a,b) => b.weight - a.weight)
    : []

  return (
    <div className="page-enter" style={{ display: 'flex', gap: 'var(--sp-5)' }}>
      <div className="card" style={{ flex: 1, minHeight: 'calc(100vh - 120px)' }}>
        <div className="card-header">
          <div>
            <div className="card-title"><Network size={14} className="mr-2 inline" /> Criminal Network Explorer</div>
            <div className="card-subtitle">Force-directed analysis of districts and crime co-occurrences</div>
          </div>
          <span className="tag tag-purple">Live Feed</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty"><div className="spinner spinner-md" /></div>
          ) : (
            <NetworkGraph 
              nodes={network.nodes} 
              edges={network.edges} 
              onNodeClick={setSelectedNode} 
            />
          )}
        </div>
      </div>

      <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
        {selectedNode && (
          <div className="card" style={{ animation: 'pageIn 0.2s ease' }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ fontSize: 16 }}>{selectedNode.label}</div>
                <div className="font-mono text-muted" style={{ textTransform: 'capitalize' }}>
                  {selectedNode.type} Node
                </div>
              </div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedNode.color || 'var(--color-primary)' }} />
            </div>
            
            <div className="card-body" style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '16px 0 8px' }}>
                <Link size={12} className="inline mr-1" /> Strongest Connections
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {connectedEdges.slice(0, 5).map((e, i) => {
                  const targetId = e.from === selectedNode.id ? e.to : e.from
                  const targetNode = network.nodes.find(n => n.id === targetId)
                  if (!targetNode) return null
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{targetNode.label}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--color-accent)' }}>
                        Weight: {e.weight}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ flex: 1, minHeight: 400 }}>
          <div className="card-header">
            <div>
              <div className="card-title"><MapIcon size={14} className="mr-2 inline" /> Geospatial Overlay</div>
              <div className="card-subtitle">Karnataka Regional Topology</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', flex: 1, minHeight: 400 }}>
             {mapLoading ? (
               <div className="empty"><div className="spinner spinner-md" /></div>
             ) : (
               <MapContainer center={[15.3173, 75.7139]} zoom={6} style={{ height: '100%', width: '100%', minHeight: 400, zIndex: 1 }}>
                 <TileLayer 
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                   attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                 />
                 {mapData.map((pt, i) => (
                   <CircleMarker 
                     key={i} 
                     center={[pt.lat, pt.lon]} 
                     radius={5} 
                     pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8, weight: 1 }}
                   >
                     <Tooltip>{pt.crime_group} - {pt.district}</Tooltip>
                   </CircleMarker>
                 ))}
               </MapContainer>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
