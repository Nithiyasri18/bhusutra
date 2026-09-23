import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getDemoUpload } from '../data/demoStore'

const comparisonFields = [['Survey Number', 'surveyNo'], ['Khasra Number', 'khasraNo'], ['Khata Number', 'khataNo'], ['Owner Name', 'owner'], ['Area', 'area']]

export default function Validation() {
  const upload = getDemoUpload()
  const navigate = useNavigate()
  const comparisons = useMemo(() => comparisonFields.map(([label, key]) => ({ label, extracted: upload.extracted[key], evidence: upload.evidence[key], matched: upload.extracted[key] === upload.evidence[key] })), [upload])
  const matched = comparisons.filter((item) => item.matched)
  const conflicts = comparisons.filter((item) => !item.matched)
  return <Layout title="Identifier matching and validation">
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs"><span className="text-slate-400">1 Upload</span><span className="text-slate-300">→</span><span className="text-slate-400">2 Extract</span><span className="text-slate-300">→</span><span className="status-pill pill-amber">3 Match evidence</span><span className="text-slate-300">→</span><span className="text-slate-400">4 Verify result</span></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5"><div className="panel"><div className="text-xs uppercase text-slate-400">Matched fields</div><div className="text-2xl font-bold text-[#18856f] mt-1">{matched.length}</div></div><div className="panel"><div className="text-xs uppercase text-slate-400">Conflicting fields</div><div className="text-2xl font-bold text-[#c05252] mt-1">{conflicts.length}</div></div><div className="panel"><div className="text-xs uppercase text-slate-400">Missing fields</div><div className="text-2xl font-bold text-[#183755] mt-1">0</div></div></div>
    <section className="panel"><div className="panel-heading"><div><h3>Evidence comparison</h3><p>{upload.fileName} compared with the existing land-record evidence</p></div><span className={`status-pill ${conflicts.length ? 'pill-red' : 'pill-teal'}`}>{conflicts.length ? 'Review required' : 'Record consistent'}</span></div><div className="table-wrap"><table><thead><tr><th>Field</th><th>Extracted document</th><th>Existing evidence</th><th>Match</th></tr></thead><tbody>{comparisons.map((item) => <tr key={item.label}><td className="font-semibold text-[#183755]">{item.label}</td><td>{item.extracted || <span className="text-slate-400">Missing</span>}</td><td>{item.evidence || <span className="text-slate-400">Missing</span>}</td><td><span className={`status-pill ${item.matched ? 'pill-teal' : 'pill-red'}`}><i />{item.matched ? 'Matched' : 'Conflict'}</span></td></tr>)}</tbody></table></div>{conflicts.length ? <div className="mt-5 rounded-lg border border-[#f1c9c5] bg-[#fff7f7] p-4"><strong className="text-sm text-[#9e3e3e]">Khasra Number Mismatch</strong><p className="text-xs text-[#a65b5b] mt-1">Extracted Khasra {upload.extracted.khasraNo} does not match existing Khasra {upload.evidence.khasraNo}. Human verification required.</p></div> : <div className="mt-5 rounded-lg border border-[#b9ded3] bg-[#f1fbf8] p-4"><strong className="text-sm text-[#18745f]">Record Consistent</strong><p className="text-xs text-[#4e8175] mt-1">Survey, Khasra, Khata, owner, and area all match the existing evidence.</p></div>}<div className="flex justify-end mt-5"><button onClick={() => navigate('/verification-result/demo-upload')} className="primary-button">View verification result <span>-&gt;</span></button></div></section>
  </Layout>
}
