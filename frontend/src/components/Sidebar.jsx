import { NavLink, useNavigate } from 'react-router-dom'
import { getCurrentUser, ROLE } from '../data/access'

const menuByRole = {
  [ROLE.CITIZEN]: [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/upload', label: 'Upload document', icon: 'upload' },
    { to: '/records', label: 'My documents', icon: 'records' },
    { to: '/copilot', label: 'AI Copilot', icon: 'chat' },
  ],
  [ROLE.OFFICER]: [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/verification-queue', label: 'Officer review queue', icon: 'users' },
    { to: '/records', label: 'Documents', icon: 'records' },
    { to: '/audit-trail', label: 'Audit trail', icon: 'history' },
  ],
  [ROLE.ADMIN]: [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/admin/users', label: 'Staff accounts', icon: 'users' },
    { to: '/verification-queue', label: 'Officer review queue', icon: 'records' },
    { to: '/records', label: 'Documents', icon: 'records' },
    { to: '/audit-trail', label: 'Audit trail', icon: 'history' },
  ],
  [ROLE.AUDITOR]: [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/verification-queue', label: 'Verification cases', icon: 'records' },
    { to: '/records', label: 'Documents', icon: 'records' },
    { to: '/audit-trail', label: 'Audit trail', icon: 'history' },
  ],
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    upload: 'M12 16V4m0 0L7 9m5-5 5 5M5 20h14',
    records: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2',
    chat: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

export default function Sidebar() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const menu = menuByRole[user?.role] || []

  function logout() {
    localStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-[256px] shrink-0 bg-[#08213f] text-white flex flex-col min-h-screen">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3"><div className="brand-mark small">B</div><div><div className="text-lg font-bold tracking-wide">BhuSutra</div><div className="text-[10px] uppercase tracking-[0.18em] text-[#86d6d0]">Land intelligence</div></div></div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Workspace">
        <div className="px-3 pb-3 text-[10px] uppercase tracking-[0.18em] text-white/35">Workspace</div>
        {menu.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] transition ${isActive ? 'bg-[#e6f5f3] text-[#0a5960] font-semibold' : 'hover:bg-white/10 text-white/65'}`}>
            <Icon name={item.icon} size={16} />{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-3"><div className="avatar">{user?.name?.slice(0, 1) || '?'}</div><div><div className="font-semibold text-sm">{user?.name}</div><div className="text-white/50 text-[11px]">{user?.role}</div></div></div>
        <button onClick={logout} className="mt-4 text-[#86d6d0] hover:text-white text-xs">Sign out securely</button>
      </div>
    </aside>
  )
}
