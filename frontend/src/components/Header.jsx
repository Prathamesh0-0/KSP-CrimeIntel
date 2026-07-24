import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

const PAGE_SUBTITLES = {
  '/dashboard': 'Overview of Karnataka crime statistics',
  '/chat':      'Ask questions in natural language (English or Kannada)',
  '/analytics': 'Deep-dive analytical tools and predictive models',
  '/network':   'Interactive criminal network graph',
  '/offenders': 'Repeat offender profiles and risk scoring',
  '/cases':     'FIR search and case similarity',
  '/alerts':    'Early warning dashboard and alert thresholds',
  '/audit':     'Query audit log and data access tracking'
}

export default function Header({ title }) {
  const { user } = useAuth()
  const location = useLocation()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const subtitle = PAGE_SUBTITLES[location.pathname] || ''

  const handleExport = () => {
    const el = document.getElementById('chat-messages') || document.body
    const html = el.innerHTML
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>KSP CrimeIntel Export — ${new Date().toLocaleDateString()}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;color:#000;background:#fff;padding:20px;}
      .chat-bbl-inner{border:1px solid #ccc;padding:8px;margin:4px 0;border-radius:4px;}
      </style></head><body>
      <h1 style="font-size:16px">KSP CrimeIntel — Intelligence Report</h1>
      <p style="font-size:11px;color:#666">Generated: ${new Date().toLocaleString()} | Officer: ${user?.name} (${user?.badge})</p>
      <hr/>${html}</body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <header className="app-header">
      <div>
        <div className="header-title">{title}</div>
        <div className="header-subtitle">{subtitle}</div>
      </div>
      <div className="flex gap-4 items-center ml-auto">
        <div className="status-live">
          <div className="live-dot" />
          Live
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExport} title="Export to PDF">
          <Download size={13} />
          Export
        </button>
      </div>
    </header>
  )
}
