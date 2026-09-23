import { useEffect, useState } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'
import { dashboardData } from '../data/dummy'

function ChartPanel({ title, subtitle, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><button className="more-button" aria-label={`More options for ${title}`}>...</button></div>{children}</section>
}

function StatusPill({ status }) {
  const styles = { Verified: 'pill-teal', Conflict: 'pill-red', 'In review': 'pill-amber' }
  return <span className={`status-pill ${styles[status] || ''}`}><i />{status}</span>
}

export default function Dashboard() {
  const [data, setData] = useState(dashboardData)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/summary').then((response) => {
      if (response.data) setData((current) => ({ ...current, apiSummary: response.data }))
    }).catch(() => {})
  }, [])

  return <Layout title="Command dashboard">
    <div className="dashboard-intro"><p className="text-sm text-slate-500">Good morning, {localStorage.getItem('bhusutra_name') || 'Aditi Rao'}. Here is today&apos;s validation overview.</p><div className="flex flex-wrap gap-3"><button onClick={() => navigate('/upload')} className="secondary-button">+ Upload new record</button><button onClick={() => navigate('/verification-queue')} className="primary-button compact">Start verification <span>-&gt;</span></button></div></div>
    <div className="kpi-grid">{data.kpis.map((kpi) => <button type="button" onClick={() => kpi.view && navigate(`/records?view=${kpi.view}`)} className={`kpi-card kpi-${kpi.tone} text-left w-full`} key={kpi.label}><div className="kpi-top"><span>{kpi.label}</span><span className="kpi-arrow">&#8599;</span></div><div className="kpi-value">{kpi.value}</div><div className="kpi-bottom"><span className="kpi-change">{kpi.change}</span><span>{kpi.note}</span></div></button>)}</div>
    <div className="chart-grid-top">
      <ChartPanel title="Monthly records processed" subtitle="Volume of records validated through the platform" className="records-chart"><ResponsiveContainer width="100%" height={230}><AreaChart data={data.monthlyRecords} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="recordsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f8b8d" stopOpacity={0.28} /><stop offset="100%" stopColor="#0f8b8d" stopOpacity={0.02} /></linearGradient></defs><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a9caf' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8a9caf' }} /><Tooltip contentStyle={{ border: '0', borderRadius: '8px' }} /><Area type="monotone" dataKey="records" stroke="#0f8b8d" strokeWidth={3} fill="url(#recordsFill)" /></AreaChart></ResponsiveContainer></ChartPanel>
      <ChartPanel title="Trust score distribution" subtitle="Confidence across seeded records"><div className="donut-layout"><ResponsiveContainer width="52%" height={190}><PieChart><Pie data={data.trustDistribution} dataKey="value" innerRadius={57} outerRadius={77} paddingAngle={3} stroke="none">{data.trustDistribution.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="donut-number">{data.averageTrustScore}</text><text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="donut-label">AVG SCORE</text></PieChart></ResponsiveContainer><div className="legend-list">{data.trustDistribution.map((item) => <div key={item.name}><span className="legend-dot" style={{ background: item.color }} />{item.name}<strong>{item.value}%</strong></div>)}</div></div></ChartPanel>
    </div>
    <div className="chart-grid-bottom">
      <ChartPanel title="Validation status" subtitle="Current record disposition"><div className="donut-layout status-donut"><ResponsiveContainer width="47%" height={185}><PieChart><Pie data={data.validationStatus} dataKey="value" innerRadius={53} outerRadius={75} paddingAngle={3} stroke="none">{data.validationStatus.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="legend-list status-legend">{data.validationStatus.map((item) => <div key={item.name}><span className="legend-dot" style={{ background: item.color }} />{item.name}<strong>{item.value.toLocaleString()}</strong></div>)}</div></div></ChartPanel>
      <ChartPanel title="District processing progress" subtitle="Percentage of assigned records completed"><ResponsiveContainer width="100%" height={205}><BarChart data={data.districts} layout="vertical" margin={{ top: 4, right: 12, left: 2, bottom: 0 }}><XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="district" axisLine={false} tickLine={false} width={66} tick={{ fontSize: 11, fill: '#62778c' }} /><Tooltip formatter={(value) => [`${value}%`, 'Completed']} cursor={{ fill: '#f3f7f8' }} /><Bar dataKey="completed" fill="#2c5aa0" radius={[0, 4, 4, 0]} barSize={16} /></BarChart></ResponsiveContainer></ChartPanel>
    </div>
    <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent validation activity</h3><p>Latest record decisions across all connected districts</p></div><button className="view-all" onClick={() => navigate('/validation')}>View all activity -&gt;</button></div><div className="table-wrap"><table><thead><tr><th>Survey number</th><th>Khasra number</th><th>Khata number</th><th>Status</th><th>Trust score</th><th>Last updated</th></tr></thead><tbody>{data.activity.map((row) => <tr key={row.survey}><td className="font-semibold text-[#183755]">{row.survey}</td><td>{row.khasra}</td><td>{row.khata}</td><td><StatusPill status={row.status} /></td><td><div className="score-cell"><span>{row.score}</span><div className="score-track"><i style={{ width: `${row.score}%` }} /></div></div></td><td className="text-slate-400">{row.updated}</td></tr>)}</tbody></table></div></section>
    <div className="action-strip"><div><strong>Ready to keep records moving?</strong><span>Upload a new batch or review the next priority case.</span></div><div className="flex gap-3"><button onClick={() => navigate('/gis-map')} className="secondary-button light">View GIS map</button><button onClick={() => navigate('/export')} className="primary-button compact">Generate report <span>-&gt;</span></button></div></div>
  </Layout>
}
