import { NavLink, useNavigate } from 'react-router-dom'

const menu = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' }, { to: '/upload', label: 'Upload Documents', icon: 'upload' },
  { to: '/ocr-results/doc-142', label: 'OCR Results', icon: 'scan' }, { to: '/validation', label: 'Validation Engine', icon: 'shield' },
  { to: '/verification-queue', label: 'Human Verification', icon: 'users' }, { to: '/gis-map', label: 'GIS Map View', icon: 'map' },
  { to: '/audit-trail', label: 'Audit Trail', icon: 'history' }, { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/export', label: 'Export Reports', icon: 'download' }, { to: '/admin/users', label: 'Settings', icon: 'settings' },
]

function Icon({ name, size = 18 }) {
  const paths = { grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', upload: 'M12 16V4m0 0L7 9m5-5 5 5M5 20h14', scan: 'M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10M12 7v10', shield: 'M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3zM9 12l2 2 4-4', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6zM9 3v15M15 6v15', history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2', chart: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8', download: 'M12 3v12m0 0 5-5m-5 5-5-5M5 21h14', settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.4-1.4.1-.1A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.6-1H7.6v-2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L9 9l1.4-1.4.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2H21a1.7 1.7 0 0 0-1.6 1z' }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

export default function Sidebar() {
  const navigate = useNavigate()
  const name = localStorage.getItem('bhusutra_name')
  const role = localStorage.getItem('bhusutra_role')

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="w-[256px] shrink-0 bg-[#08213f] text-white flex flex-col min-h-screen">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3"><div className="brand-mark small">B</div><div><div className="text-lg font-bold tracking-wide">BhuSutra</div><div className="text-[10px] uppercase tracking-[0.18em] text-[#86d6d0]">Land intelligence</div></div></div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <div className="px-3 pb-3 text-[10px] uppercase tracking-[0.18em] text-white/35">Workspace</div>
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition ${
                isActive ? 'bg-[#e6f5f3] text-[#0a5960] font-semibold' : 'hover:bg-white/10 text-white/65'
              }`
            }
          >
            <Icon name={item.icon} size={16} />{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-3"><div className="avatar">{(name || 'U').slice(0, 1)}</div><div><div className="font-semibold text-sm">{name || 'District Admin'}</div><div className="text-white/50 text-[11px]">{role || 'Administrator'}</div></div></div>
        <button onClick={logout} className="mt-4 text-[#86d6d0] hover:text-white text-xs">Sign out securely</button>
      </div>
    </div>
  )
}
