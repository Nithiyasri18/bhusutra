import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { getAllRecords, getCurrentUser, ROLE } from '../data/access'

const fields = [['District', 'district'], ['Taluk', 'taluk'], ['Village', 'village'], ['Survey Number', 'surveyNo'], ['Khasra Number', 'khasraNo'], ['Khata Number', 'khataNo'], ['Owner Name', 'owner'], ['Area', 'area'], ['Document Type', 'documentType'], ['Conflict Type', 'conflictType'], ['Last Updated', 'lastUpdated']]

export default function RecordDetails() {
  const { recordId } = useParams()
  const user = getCurrentUser()
  const record = getAllRecords().find((item) => item.id === recordId)
  if (!record || (user.role === ROLE.CITIZEN && record.ownerUserId !== user.id)) return <Layout title="Record not found"><div className="panel text-sm text-slate-500">This record is not available in your workspace. <Link to="/gis-map" className="view-all">Return to map</Link></div></Layout>
  const statusClass = record.status === 'Verified' ? 'pill-teal' : record.status === 'Conflict' ? 'pill-red' : 'pill-amber'

  return <Layout title="Record details"><div className="flex flex-wrap items-start justify-between gap-4 mb-5"><div><div className="eyebrow">Prototype sample record</div><h2 className="text-xl font-bold text-[#183755] mt-2">{record.id}</h2><p className="text-sm text-slate-500 mt-1">{record.village}, {record.taluk}, {record.district}</p></div><div className="flex gap-2"><span className={`status-pill ${statusClass}`}>{record.status}</span><Link to="/gis-map" className="secondary-button">Back to map</Link></div></div><div className="grid grid-cols-1 lg:grid-cols-[1fr_.35fr] gap-5"><section className="panel"><div className="panel-heading"><div><h3>Land record information</h3><p>Values are seeded for the BhuSutra prototype demonstration.</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">{fields.map(([label, key]) => <div key={key} className="py-3 border-b border-slate-100"><span className="block text-[10px] uppercase tracking-wide text-slate-400">{label}</span><strong className="block text-sm text-[#183755] mt-1">{record[key]}</strong></div>)}</div></section><section className="panel"><div className="eyebrow">Trust assessment</div><div className="text-4xl font-bold text-[#183755] mt-3">{record.trustScore}%</div><div className="text-xs uppercase tracking-wide text-slate-400 mt-1">Confidence score</div><div className="mt-6 pt-5 border-t"><span className="block text-[10px] uppercase tracking-wide text-slate-400">Risk level</span><strong className={`block text-xl mt-1 ${record.riskLevel === 'Low' ? 'text-[#18856f]' : record.riskLevel === 'High' ? 'text-[#c05252]' : 'text-[#b07d13]'}`}>{record.riskLevel}</strong></div><div className="mt-6 pt-5 border-t"><span className="block text-[10px] uppercase tracking-wide text-slate-400">Verification</span><strong className="block text-sm text-[#183755] mt-1">{record.verificationStatus}</strong></div></section></div></Layout>
}
