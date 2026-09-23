import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser, getScopedRecords } from '../data/access'

const viewLabels = {
  all: 'All processed records',
  verified: 'Verified records',
  pending: 'Records pending verification',
  conflicts: 'High-risk conflicts',
}

const statusStyles = {
  Verified: 'pill-teal',
  'Pending verification': 'pill-amber',
  Conflict: 'pill-red',
  Processing: 'pill-amber',
}

function StatusPill({ status }) {
  return <span className={`status-pill ${statusStyles[status] || ''}`}><i />{status}</span>
}

export default function Records() {
  const user = getCurrentUser()
  const records = getScopedRecords(user)
  const districts = [...new Set(records.map((record) => record.district))].sort()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('All districts')
  const [status, setStatus] = useState('All statuses')
  const [risk, setRisk] = useState('All risk levels')
  const [verification, setVerification] = useState('All verification states')
  const view = viewLabels[searchParams.get('view')] ? searchParams.get('view') : 'all'

  const filteredRecords = useMemo(() => records.filter((record) => {
    const searchText = search.trim().toLowerCase()
    const matchesSearch = !searchText || [record.id, record.district, record.taluk, record.village, record.surveyNo, record.owner].some((value) => value.toLowerCase().includes(searchText))
    const matchesView = view === 'all' || (view === 'verified' && record.verificationStatus === 'Verified') || (view === 'pending' && record.verificationStatus === 'Pending') || (view === 'conflicts' && record.riskLevel === 'High')
    return matchesSearch && matchesView && (district === 'All districts' || record.district === district) && (status === 'All statuses' || record.status === status) && (risk === 'All risk levels' || record.riskLevel === risk) && (verification === 'All verification states' || record.verificationStatus === verification)
  }), [district, records, risk, search, status, verification, view])

  function clearFilters() {
    setSearch('')
    setDistrict('All districts')
    setStatus('All statuses')
    setRisk('All risk levels')
    setVerification('All verification states')
    setSearchParams({ view })
  }

  return <Layout title="Land records">
    <div className="dashboard-intro"><div><p className="text-sm text-slate-500">Review the records available within your role scope.</p><p className="text-xs text-slate-400 mt-1">{filteredRecords.length} of {records.length} records shown</p></div>{user.role === 'Common Man' && <Link to="/upload" className="primary-button">+ Upload new record</Link>}</div>
    <section className="panel">
      <div className="panel-heading"><div><h3>{viewLabels[view]}</h3><p>Search by owner, location, survey number, or record ID.</p></div><button type="button" onClick={clearFilters} className="view-all">Clear filters</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
        <label className="field-label">Search<input value={search} onChange={(event) => setSearch(event.target.value)} className="field-input" placeholder="Search records" /></label>
        <label className="field-label">District<select value={district} onChange={(event) => setDistrict(event.target.value)} className="field-input"><option>All districts</option>{districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field-label">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="field-input"><option>All statuses</option><option>Verified</option><option>Pending verification</option><option>Conflict</option><option>Processing</option></select></label>
        <label className="field-label">Risk level<select value={risk} onChange={(event) => setRisk(event.target.value)} className="field-input"><option>All risk levels</option><option>Low</option><option>Medium</option><option>High</option></select></label>
        <label className="field-label">Verification status<select value={verification} onChange={(event) => setVerification(event.target.value)} className="field-input"><option>All verification states</option><option>Verified</option><option>Pending</option><option>Requires review</option><option>Queued</option></select></label>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Record</th><th>Location</th><th>Identifiers</th><th>Owner / area</th><th>Status</th><th>Trust</th><th>Updated</th></tr></thead><tbody>{filteredRecords.map((record) => <tr key={record.id}><td><strong className="text-[#183755]">{record.id}</strong><span className="block text-[10px] text-slate-400 mt-1">{record.documentType}</span></td><td><strong className="text-[#183755]">{record.village}</strong><span className="block text-[10px] text-slate-400 mt-1">{record.taluk}, {record.district}</span></td><td><span className="block">Survey {record.surveyNo}</span><span className="block text-[10px] text-slate-400 mt-1">Khasra {record.khasraNo} / Khata {record.khataNo}</span></td><td><strong className="text-[#183755]">{record.owner}</strong><span className="block text-[10px] text-slate-400 mt-1">{record.area}</span></td><td><StatusPill status={record.status} /><span className="block text-[10px] text-slate-400 mt-1">{record.conflictType}</span></td><td><div className="score-cell"><span>{record.trustScore}</span><div className="score-track"><i style={{ width: `${record.trustScore}%` }} /></div></div><span className="block text-[10px] text-slate-400 mt-1">{record.riskLevel} risk</span></td><td className="text-slate-400">{record.lastUpdated}</td></tr>)}{filteredRecords.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">No records match these filters.</td></tr>}</tbody></table></div>
    </section>
  </Layout>
}
