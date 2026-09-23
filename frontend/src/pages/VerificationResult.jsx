import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getDemoUpload, saveDemoUpload, updateDemoRecord } from '../data/demoStore'

const resultFields = [['Owner Name', 'owner'], ['Survey Number', 'surveyNo'], ['Khasra Number', 'khasraNo'], ['Khata Number', 'khataNo'], ['Area', 'area'], ['Location', 'location']]

export default function VerificationResult() {
  const [upload, setUpload] = useState(getDemoUpload)
  const [editing, setEditing] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [draft, setDraft] = useState(upload.extracted)
  const navigate = useNavigate()
  const comparisons = useMemo(() => resultFields.map(([label, key]) => ({ label, key, extracted: upload.extracted[key], evidence: upload.evidence[key], matched: upload.extracted[key] === upload.evidence[key] })), [upload])
  const conflicts = comparisons.filter((item) => !item.matched)
  const missing = comparisons.filter((item) => !item.extracted)
  const isConsistent = conflicts.length === 0 && missing.length === 0

  function saveEdit() {
    const editedUpload = { ...upload, extracted: draft, confidence: Object.keys(draft).every((key) => draft[key] === upload.evidence[key]) ? 94 : 61, risk: Object.keys(draft).every((key) => draft[key] === upload.evidence[key]) ? 'Low' : 'High', reason: Object.keys(draft).every((key) => draft[key] === upload.evidence[key]) ? 'Edited values now match the existing evidence.' : 'Edited record still contains fields that require officer review.', status: 'Pending verification' }
    setUpload(editedUpload)
    saveDemoUpload(editedUpload)
    updateDemoRecord('Pending verification')
    setEditing(false)
    setSavedMessage('Changes saved. The record is pending verification.')
  }

  function decide(status) {
    const nextUpload = { ...upload, status }
    setUpload(nextUpload)
    saveDemoUpload(nextUpload)
    updateDemoRecord(status)
    setSavedMessage(status === 'Verified' ? 'Record approved and marked verified.' : 'Record sent to the human verification queue.')
  }

  return <Layout title="Verification result">
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs"><span className="text-slate-400">1 Upload</span><span className="text-slate-300">→</span><span className="text-slate-400">2 Extract</span><span className="text-slate-300">→</span><span className="text-slate-400">3 Match</span><span className="text-slate-300">→</span><span className="status-pill pill-teal">4 Result</span></div>
    <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_.65fr] gap-5"><section className="panel"><div className="panel-heading"><div><h3>Verification decision</h3><p>{upload.fileName} · {upload.documentType}</p></div><span className={`status-pill ${isConsistent ? 'pill-teal' : 'pill-red'}`}>{isConsistent ? 'Record consistent' : 'Human verification required'}</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{resultFields.map(([label, key]) => <label key={key} className="field-label">{label}{editing ? <input value={draft[key] || ''} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="field-input" /> : <div className={`mt-2 p-3 rounded-md border text-sm ${upload.extracted[key] === upload.evidence[key] ? 'border-[#b9ded3] bg-[#f4fbf8] text-[#183755]' : 'border-[#f1c9c5] bg-[#fff7f7] text-[#9e3e3e]'}`}>{upload.extracted[key] || 'Missing'}<span className="block text-[10px] mt-1 opacity-70">Evidence: {upload.evidence[key] || 'Missing'}</span></div>}</label>)}</div><div className="mt-5 rounded-lg bg-[#f7fafb] border p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Reason for verification</div><p className="text-sm text-[#183755] mt-2">{upload.reason}</p></div><div className="flex flex-wrap gap-3 mt-5">{editing ? <><button onClick={saveEdit} className="primary-button">Save edited record</button><button onClick={() => { setDraft(upload.extracted); setEditing(false) }} className="secondary-button">Cancel</button></> : <><button onClick={() => decide('Verified')} className="primary-button">Approve</button><button onClick={() => { setDraft(upload.extracted); setEditing(true) }} className="secondary-button">Edit</button><button onClick={() => decide('Pending verification')} className="secondary-button">Send for verification</button></>}</div>{savedMessage && <div className="mt-4 text-sm font-semibold text-[#18745f]">{savedMessage}</div>}</section><section className="panel"><div className="eyebrow">Decision summary</div><div className="text-4xl font-bold text-[#183755] mt-3">{upload.confidence}%</div><div className="text-xs uppercase tracking-wide text-slate-400 mt-1">Confidence score</div><div className="mt-6 pt-5 border-t"><div className="text-xs uppercase tracking-wide text-slate-400">Risk level</div><div className={`text-xl font-bold mt-1 ${upload.risk === 'Low' ? 'text-[#18856f]' : 'text-[#c05252]'}`}>{upload.risk}</div></div><div className="mt-6 pt-5 border-t grid grid-cols-3 gap-2"><div><div className="text-xs text-slate-400">Matched</div><div className="text-lg font-bold text-[#18856f] mt-1">{comparisons.length - conflicts.length - missing.length}</div></div><div><div className="text-xs text-slate-400">Conflicting</div><div className="text-lg font-bold text-[#c05252] mt-1">{conflicts.length}</div></div><div><div className="text-xs text-slate-400">Missing</div><div className="text-lg font-bold text-[#183755] mt-1">{missing.length}</div></div></div><button onClick={() => navigate('/records')} className="secondary-button w-full mt-8">Return to land records</button></section></div>
  </Layout>
}
