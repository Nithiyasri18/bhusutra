import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { getDemoUpload } from '../data/demoStore'

function confColor(c) {
  if (c >= 90) return 'bg-green-100 text-green-800'
  if (c >= 75) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

const fields = [['Owner Name', 'owner'], ['Survey Number', 'surveyNo'], ['Khasra Number', 'khasraNo'], ['Khata Number', 'khataNo'], ['Area', 'area'], ['Location', 'location']]

export default function OcrResults() {
  const upload = getDemoUpload()
  const navigate = useNavigate()
  return <Layout title="Document preview and extraction">
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs"><span className="status-pill pill-teal">1 Upload complete</span><span className="text-slate-300">→</span><span className="status-pill pill-amber">2 OCR simulated</span><span className="text-slate-300">→</span><span className="text-slate-400">3 Match evidence</span><span className="text-slate-300">→</span><span className="text-slate-400">4 Verify result</span></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><section className="panel"><div className="panel-heading"><div><h3>Document preview</h3><p>Uploaded source document</p></div><span className="status-pill pill-teal">Ready</span></div><div className="min-h-[330px] rounded-lg border border-dashed border-[#b9d6d8] bg-[#f6fbfb] flex flex-col items-center justify-center text-center"><div className="brand-mark small dark mb-4">B</div><strong className="text-sm text-[#183755] break-all px-6">{upload.fileName}</strong><span className="text-xs text-slate-400 mt-2">{upload.documentType} · Mock document preview</span></div><div className="grid grid-cols-3 gap-3 mt-5"><div><span className="block text-[10px] uppercase text-slate-400">Document type</span><strong className="text-sm text-[#183755]">{upload.documentType}</strong></div><div><span className="block text-[10px] uppercase text-slate-400">District</span><strong className="text-sm text-[#183755]">{upload.district}</strong></div><div><span className="block text-[10px] uppercase text-slate-400">Village</span><strong className="text-sm text-[#183755]">{upload.village}</strong></div></div></section><section className="panel"><div className="panel-heading"><div><h3>Extracted land record</h3><p>Fields detected by the mock OCR pipeline</p></div><span className="status-pill pill-amber">{upload.confidence}% confidence</span></div><div className="space-y-2">{fields.map(([label, key]) => <div key={key} className="flex items-center justify-between border-b border-slate-100 py-3"><span className="text-xs text-slate-500">{label}</span><strong className="text-sm text-[#183755] text-right">{upload.extracted[key]}</strong></div>)}</div><div className={`mt-5 rounded-lg p-4 ${upload.risk === 'Low' ? 'bg-[#eaf7f3]' : 'bg-[#fff3f1]'}`}><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Initial assessment</div><div className="text-sm font-bold text-[#183755] mt-1">{upload.risk === 'Low' ? 'Likely consistent' : 'Potential conflict detected'}</div><p className="text-xs text-slate-500 mt-1">{upload.reason}</p></div><button onClick={() => navigate('/validation?doc=demo-upload')} className="primary-button mt-5 w-full">Compare against existing evidence <span>-&gt;</span></button></section></div>
  </Layout>
}
