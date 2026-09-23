import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { createDemoUpload } from '../data/demoStore'

const steps = ['Upload document', 'Document preview', 'Extracted record', 'Identifier matching', 'Validation', 'Result']

export default function Upload() {
  const [file, setFile] = useState(null)
  const [scenario, setScenario] = useState('consistent')
  const navigate = useNavigate()

  function startDemo(event) {
    event.preventDefault()
    if (!file) return
    createDemoUpload(file.name, scenario)
    navigate('/ocr-results/demo-upload')
  }

  return <Layout title="Upload document">
    <div className="mb-6"><div className="flex flex-wrap items-center gap-2">{steps.map((step, index) => <div key={step} className="flex items-center gap-2"><span className={`grid place-items-center w-7 h-7 rounded-full text-[11px] font-bold ${index === 0 ? 'bg-[#0f8b8d] text-white' : 'bg-white border text-slate-400'}`}>{index + 1}</span><span className={`text-xs ${index === 0 ? 'font-bold text-[#183755]' : 'text-slate-400'}`}>{step}</span>{index < steps.length - 1 && <span className="text-slate-300 mx-1">→</span>}</div>)}</div></div>
    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-5">
      <section className="panel"><div className="panel-heading"><div><h3>Start a verification case</h3><p>Upload a land document to simulate OCR and evidence matching.</p></div><span className="status-pill pill-teal">Mock OCR</span></div><form onSubmit={startDemo} className="space-y-5"><label className="field-label">Land document<input required type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff,image/*,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="field-input file:mr-3 file:border-0 file:bg-[#e6f5f3] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0a5960]" /><span className="block text-[11px] text-slate-400 mt-2">Accepted formats: PDF, JPG, PNG, TIFF</span></label><div><div className="field-label mb-2">Demo scenario</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button type="button" onClick={() => setScenario('consistent')} className={`text-left p-4 rounded-lg border ${scenario === 'consistent' ? 'border-[#0f8b8d] bg-[#f0fbfa]' : 'border-slate-200'}`}><strong className="block text-sm text-[#183755]">Consistent record</strong><span className="block text-xs text-slate-500 mt-1">All identifiers match existing evidence.</span></button><button type="button" onClick={() => setScenario('conflict')} className={`text-left p-4 rounded-lg border ${scenario === 'conflict' ? 'border-[#d75959] bg-[#fff7f7]' : 'border-slate-200'}`}><strong className="block text-sm text-[#183755]">Conflict example</strong><span className="block text-xs text-slate-500 mt-1">Khasra 92 conflicts with existing Khasra 87.</span></button></div></div><button type="submit" className="primary-button w-full sm:w-auto">Preview and extract <span>-&gt;</span></button></form></section>
      <section className="panel bg-[#0b3457] text-white"><div className="eyebrow light">Verification pipeline</div><h2 className="text-xl font-bold mt-3">From paper to trusted record.</h2><p className="text-sm text-white/65 leading-6 mt-3">The prototype simulates extraction, compares every identifier against existing evidence, and highlights exactly why an officer may need to review the case.</p><div className="mt-7 space-y-4">{['Preview the uploaded document', 'Review extracted land fields', 'Compare Survey, Khasra and Khata', 'Approve or send for verification'].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="grid place-items-center w-6 h-6 rounded-full bg-[#8de1d9] text-[#08213f] text-xs font-bold">{index + 1}</span><span className="text-sm text-white/80">{item}</span></div>)}</div></section>
    </div>
  </Layout>
}
