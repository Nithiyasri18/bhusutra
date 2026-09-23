import Layout from '../components/Layout'
import { getCurrentUser } from '../data/access'

export default function Profile() {
  const user = getCurrentUser()
  return <Layout title="Profile"><section className="panel max-w-2xl"><div className="eyebrow">Signed-in identity</div><h2 className="text-2xl font-bold text-[#183755] mt-3">{user.name}</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"><div><span className="block text-[10px] uppercase tracking-wide text-slate-400">Email</span><strong className="block text-sm text-[#183755] mt-1">{user.email}</strong></div><div><span className="block text-[10px] uppercase tracking-wide text-slate-400">Role</span><strong className="block text-sm text-[#183755] mt-1">{user.role}</strong></div><div><span className="block text-[10px] uppercase tracking-wide text-slate-400">Data scope</span><strong className="block text-sm text-[#183755] mt-1">{user.role === 'Common Man' ? 'Personal records only' : user.role === 'District Officer' ? `${user.district} district` : 'System workspace'}</strong></div></div></section></Layout>
}
