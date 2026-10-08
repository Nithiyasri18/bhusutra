import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'
import { getCurrentUser, ROLE } from '../data/access'

const metrics = [
  ['Total Documents', 'total_documents', 'blue'],
  ['Verified Documents', 'verified_documents', 'teal'],
  ['Pending Reviews', 'pending_reviews', 'amber'],
  ['Rejected Documents', 'rejected_documents', 'red'],
  ['High Risk Cases', 'high_risk_cases', 'violet'],
]

export default function Dashboard() {
  const user = getCurrentUser()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/dashboard/summary')
      .then((response) => { if (active) setSummary(response.data) })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.detail || 'Could not load your dashboard.')
      })
    return () => { active = false }
  }, [])

  return <Layout title="Dashboard">
    <div className="dashboard-intro">
      <div><p className="text-sm text-slate-500">Welcome, {user?.name}. These counts are read from PostgreSQL.</p></div>
      {user?.role === ROLE.CITIZEN && <div className="flex gap-3"><Link to="/records" className="secondary-button">My documents</Link><Link to="/upload" className="primary-button">Upload document</Link></div>}
      {user?.role !== ROLE.CITIZEN && <Link to="/verification-queue" className="primary-button">Review queue</Link>}
    </div>

    {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
    {!summary && !error && <p className="text-sm text-slate-500" role="status">Loading database counts...</p>}
    {summary && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map(([label, key, tone]) => <section className={`kpi-card kpi-${tone}`} key={key} aria-label={label}>
        <div className="kpi-top"><span>{label}</span></div>
        <div className="kpi-value">{summary[key]}</div>
      </section>)}
    </div>}

    <section className="panel mt-6">
      <div className="panel-heading"><div><h3>{user?.role === ROLE.CITIZEN ? 'Your documents' : 'Review workflow'}</h3>
        <p>{user?.role === ROLE.CITIZEN ? 'Uploads are private to your account unless reviewed by authorized staff.' : 'Documents awaiting officer review are never marked verified without authoritative matching.'}</p></div></div>
      {user?.role === ROLE.CITIZEN
        ? <Link to="/records" className="view-all">View upload history -&gt;</Link>
        : <Link to="/verification-queue" className="view-all">Open the review queue -&gt;</Link>}
    </section>
  </Layout>
}
