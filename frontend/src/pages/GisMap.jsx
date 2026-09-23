import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { tamilNaduMapRecords } from '../data/mapRecords'

const mapCenter = [10.9, 78.3]
const statusMeta = {
  Verified: { label: 'Verified', color: '#18856f', fill: '#d8f0e9' },
  'Pending verification': { label: 'Pending', color: '#b07d13', fill: '#fff0c9' },
  Conflict: { label: 'Conflict', color: '#c05252', fill: '#f9dede' },
}

export default function GisMap() {
  const [filter, setFilter] = useState('All')
  const visibleRecords = useMemo(() => tamilNaduMapRecords.filter((record) => filter === 'All' || (filter === 'Pending' ? record.status === 'Pending verification' : record.status === filter)), [filter])

  return <Layout title="Tamil Nadu land-record map">
    <div className="flex flex-wrap items-start justify-between gap-4 mb-4"><div><p className="text-sm text-slate-500">Illustrative sample records across selected Tamil Nadu districts.</p><p className="text-[11px] text-slate-400 mt-1">Prototype locations only. These are not government cadastral boundaries or official parcel data.</p></div><div className="flex flex-wrap gap-2">{['All', 'Verified', 'Pending', 'Conflict'].map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`text-xs px-3 py-2 rounded-md border font-semibold ${filter === item ? 'bg-[#0b3457] text-white border-[#0b3457]' : 'bg-white text-[#496277] border-[#dce6ea]'}`}>{item}</button>)}</div></div>
    <div className="panel p-3"><div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3"><div className="flex flex-wrap gap-4 text-xs">{Object.entries(statusMeta).map(([status, meta]) => <span key={status} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />{meta.label}</span>)}</div><span className="text-xs text-slate-400">{visibleRecords.length} sample records shown</span></div><div className="overflow-hidden rounded-lg" style={{ height: 560 }}><MapContainer center={mapCenter} zoom={7} minZoom={6} maxZoom={12} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />{visibleRecords.map((record) => { const meta = statusMeta[record.status] || statusMeta.Verified; return <CircleMarker key={record.id} center={record.coordinates} radius={9} pathOptions={{ color: meta.color, fillColor: meta.fill, fillOpacity: 0.95, weight: 3 }}><Popup><div className="text-xs min-w-[190px]"><strong className="block text-sm text-[#183755] mb-2">{record.district}</strong><div><b>Record ID:</b> {record.id}</div><div><b>Village:</b> {record.village}</div><div><b>Survey:</b> {record.surveyNo}</div><div><b>Owner:</b> {record.owner}</div><div><b>Status:</b> {meta.label}</div><div><b>Confidence:</b> {record.trustScore}%</div><Link to={`/records/${record.id}`} className="primary-button compact mt-3 w-full">View record</Link></div></Popup></CircleMarker> })}</MapContainer></div></div>
  </Layout>
}
