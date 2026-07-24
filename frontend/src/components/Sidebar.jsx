import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import {
  LayoutDashboard, MessageSquare, BarChart2,
  Network, Users, FolderSearch, AlertTriangle, ShieldCheck,
  Shield, LogOut, FilePlus
} from 'lucide-react'

const NAV = [
  { group: 'Operations', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat',      label: 'Intelligence Chat', icon: MessageSquare },
  ]},
  { group: 'Analytics', items: [
    { to: '/analytics', label: 'Deep Analytics', icon: BarChart2 },
    { to: '/network',   label: 'Network Explorer', icon: Network },
    { to: '/offenders', label: 'Offender Profiling', icon: Users },
  ]},
  { group: 'Investigation', items: [
    { to: '/cases',     label: 'Case Explorer', icon: FolderSearch },
    { to: '/register',  label: 'Register FIR',  icon: FilePlus },
    { to: '/alerts',    label: 'Early Warning', icon: AlertTriangle, badge: '3', badgeColor: 'red' },
    { to: '/audit',     label: 'Query Audit Log', icon: ShieldCheck },
  ]},
  { group: 'Admin', adminOnly: true, items: [
    { to: '/admin',     label: 'System Admin',  icon: Shield },
  ]}
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0,2).join('') || 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon" style={{ background: 'transparent' }}>
          <img src="/logo.png" alt="KSP Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div className="brand-name">CRIMEINTEL</div>
          <div className="brand-sub">Karnataka State Police</div>
        </div>
      </div>

      <div className="sidebar-alert-strip" onClick={() => navigate('/alerts')}>
        <div className="sidebar-alert-dot" />
        <div className="sidebar-alert-text">High-Risk Alerts</div>
        <div className="sidebar-alert-count">3</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => {
          if (group.adminOnly && user?.role !== 'admin') return null
          return (
            <div key={group.group}>
              <div className="nav-group-label">{group.group}</div>
              {group.items.map(item => {
                if (item.adminOnly && user?.role !== 'admin') return null
                return (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <item.icon size={15} />
                    {item.label}
                    {item.badge && <span className={`nav-badge nav-badge-${item.badgeColor}`}>{item.badge}</span>}
                  </NavLink>
                )
              })}
            </div>
          )
        })}

        <div className="nav-group-label" style={{ marginTop: '16px' }}>Data Sources</div>
        <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Karnataka FIR', count: '1.67M', color: 'blue' },
            { label: 'IPC District',  count: '2001–14', color: 'amber' },
            { label: 'Socioeconomic', count: '700', color: 'green' },
          ].map(ds => (
            <div key={ds.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--color-${ds.color})` }} />
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.5)' }}>{ds.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: `var(--color-${ds.color})` }}>{ds.count}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name truncate">{user?.name || 'Investigator'}</div>
          <div className="user-role truncate">
            <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>{user?.role?.toUpperCase()}</span>
            &nbsp;• {user?.badge}
          </div>
        </div>
        <button className="user-logout" onClick={handleLogout} title="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
