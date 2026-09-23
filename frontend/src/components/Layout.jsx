import Sidebar from './Sidebar'

export default function Layout({ children, title }) {
  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="topbar px-8 py-5 flex items-center justify-between">
          <div><div className="eyebrow">State Land Records Department</div><h1 className="text-2xl font-bold text-[#112c4c] mt-1">{title}</h1></div>
          <div className="flex items-center gap-4"><div className="hidden md:block text-right"><div className="text-xs font-semibold text-[#112c4c]">Wednesday, 23 September 2026</div><div className="text-[11px] text-slate-400 mt-1">Last synced 2 minutes ago</div></div><div className="topbar-icon">⌕</div><div className="notification">3</div></div>
        </div>
        <div className="p-5 md:p-8 max-w-[1600px]">{children}</div>
      </div>
    </div>
  )
}
