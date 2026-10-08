import Sidebar from './Sidebar'

export default function Layout({ children, title }) {
  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="topbar px-8 py-5 flex items-center justify-between">
          <div><div className="eyebrow">BhuSutra · Land record services</div><h1 className="text-2xl font-bold text-[#112c4c] mt-1">{title}</h1></div>
        </div>
        <div className="p-5 md:p-8 max-w-[1600px]">{children}</div>
      </div>
    </div>
  )
}
