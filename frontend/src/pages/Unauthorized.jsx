import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser } from '../data/access'

export default function Unauthorized() {
  const user = getCurrentUser()
  return <Layout title="Access restricted"><section className="panel max-w-2xl"><div className="eyebrow">Role boundary</div><h2 className="text-2xl font-bold text-[#183755] mt-3">This workspace is not available for your role.</h2><p className="text-sm text-slate-500 mt-3">{user.role} accounts can only access the workflows assigned to their role. Your records and data remain protected.</p><Link to="/dashboard" className="primary-button mt-6">Return to my dashboard</Link></section></Layout>
}
