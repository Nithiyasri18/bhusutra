import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCurrentUser, getRecordStats, getScopedRecords, ROLE } from '../data/access'

function Metric({ label, value, tone = 'blue' }) {
  return <div className={`kpi-card kpi-${tone}`}><div className="kpi-top"><span>{label}</span></div><div className="kpi-value">{value}</div></div>
}

function RecordRows({ records, emptyText }) {
  if (!records.length) return <div className="py-10 text-center text-sm text-slate-400">{emptyText}</div>
  return <div className="table-wrap"><table><thead><tr><th>Record</th><th>Location</th><th>Status</th><th>Trust score</th><th></th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong className="text-[#183755]">{record.id}</strong><span className="block text-[10px] text-slate-400 mt-1">{record.owner}</span></td><td>{record.village}, {record.district}</td><td><span className={`status-pill ${record.status === 'Verified' ? 'pill-teal' : record.status === 'Conflict' ? 'pill-red' : 'pill-amber'}`}><i />{record.status}</span></td><td>{record.trustScore}%</td><td><Link to={`/records/${record.id}`} className="view-all">View record</Link></td></tr>)}</tbody></table></div>
}

function CitizenDashboard({ user, records, stats }) {
  return <Layout title="My land records"><div className="dashboard-intro"><div><p className="text-sm text-slate-500">Welcome, {user.name}. Track your land-document verification in one place.</p><p className="text-xs text-slate-400 mt-1">Private citizen workspace · prototype data</p></div><Link to="/upload" className="primary-button">Upload New Land Document <span>-&gt;</span></Link></div><div className="kpi-grid grid-cols-1 sm:grid-cols-3"><Metric label="My uploaded documents" value={stats.totalRecords} tone="blue" /><Metric label="Verified records" value={stats.verifiedRecords} tone="teal" /><Metric label="Needs officer review" value={stats.pendingRecords + stats.conflictRecords} tone="amber" /></div><div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-5"><section className="panel"><div className="panel-heading"><div><h3>My verification status</h3><p>Only your submitted land records are shown.</p></div><Link to="/records" className="view-all">View all</Link></div><RecordRows records={records} emptyText="No land records uploaded yet." /></section><section className="panel"><div className="eyebrow">Personal GIS</div><h3 className="text-lg font-bold text-[#183755] mt-3">My land map</h3><p className="text-sm text-slate-500 mt-2">View only your own sample parcel locations and verification status.</p><Link to="/gis-map" className="secondary-button mt-6">Open My GIS Map</Link></section></div></Layout>
}

function VerifierDashboard({ records, stats }) {
  const pending = records.filter((record) => record.status !== 'Verified')
  return <Layout title="Verification workspace"><div className="dashboard-intro"><div><p className="text-sm text-slate-500">Review submitted records and resolve the next officer action.</p><p className="text-xs text-slate-400 mt-1">System verification scope · synthetic prototype records</p></div><Link to="/verification-queue" className="primary-button">Review Pending Records <span>-&gt;</span></Link></div><div className="kpi-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Awaiting verification" value={stats.pendingRecords} tone="amber" /><Metric label="Currently under review" value={stats.reviewRecords} tone="blue" /><Metric label="Verified records" value={stats.verifiedRecords} tone="teal" /><Metric label="Conflicts" value={stats.conflictRecords} tone="red" /></div><div className="grid grid-cols-1 lg:grid-cols-[1.3fr_.7fr] gap-5"><section className="panel"><div className="panel-heading"><div><h3>Pending officer actions</h3><p>Open a record to review OCR, evidence, GIS, and audit history.</p></div><Link to="/verification-queue" className="view-all">Open queue</Link></div><RecordRows records={pending.slice(0, 6)} emptyText="No records are awaiting verification." /></section><section className="panel"><div className="eyebrow">System verification map</div><h3 className="text-lg font-bold text-[#183755] mt-3">Relevant submitted land</h3><p className="text-sm text-slate-500 mt-2">Inspect submitted records across the verification scope with status and risk filters.</p><Link to="/gis-map" className="secondary-button mt-6">Open GIS Map</Link></section></div></Layout>
}

function DistrictDashboard({ user, records, stats }) {
  const highRisk = records.filter((record) => record.riskLevel === 'High')
  return <Layout title={`${user.district} district overview`}><div className="dashboard-intro"><div><p className="text-sm text-slate-500">Monitor verification progress across {user.district} district.</p><p className="text-xs text-slate-400 mt-1">District officer scope · values calculated from current demo records</p></div><Link to="/analytics" className="primary-button">View Verification Analytics <span>-&gt;</span></Link></div><div className="kpi-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"><Metric label="District records" value={stats.totalRecords} tone="blue" /><Metric label="Verified" value={stats.verifiedRecords} tone="teal" /><Metric label="Pending" value={stats.pendingRecords} tone="amber" /><Metric label="Conflicts" value={stats.conflictRecords} tone="red" /><Metric label="Average trust" value={`${stats.averageTrustScore}%`} tone="green" /></div><div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-5"><section className="panel"><div className="panel-heading"><div><h3>Recent district activity</h3><p>Current records in {user.district}.</p></div><Link to="/records" className="view-all">District records</Link></div><RecordRows records={records} emptyText="No records are available for this district." /></section><section className="panel"><div className="eyebrow">High-risk monitoring</div><h3 className="text-lg font-bold text-[#183755] mt-3">{highRisk.length} records need attention</h3><p className="text-sm text-slate-500 mt-2">Review conflicts and low-confidence records on the district map.</p><Link to="/gis-map" className="secondary-button mt-6">Open District GIS</Link></section></div></Layout>
}

export default function RoleDashboard() {
  const user = getCurrentUser()
  const records = getScopedRecords(user)
  const stats = getRecordStats(records)
  if (user.role === ROLE.CITIZEN) return <CitizenDashboard user={user} records={records} stats={stats} />
  if (user.role === ROLE.DISTRICT) return <DistrictDashboard user={user} records={records} stats={stats} />
  return <VerifierDashboard records={records} stats={stats} />
}
