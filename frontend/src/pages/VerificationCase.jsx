import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'

export default function VerificationCase() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [notes, setNotes] = useState('')

  function load() {
    api.get(`/verification/cases/${caseId}`).then((res) => setItem(res.data)).catch(() => {})
  }
  useEffect(() => { load() }, [caseId])

  async function act(action) {
    await api.post(`/verification/cases/${caseId}/action`, { action, notes })
    navigate('/verification-queue')
  }

  if (!item) return <Layout title="Verification Case"><div className="text-sm text-gray-500">Loading…</div></Layout>

  return (
    <Layout title={`Verification Case — ${item.id.slice(0,8)}`}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 h-64 flex items-center justify-center text-gray-400 text-sm">
          📄 Document + AI-suggested fields (linked from OCR Results)
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm text-gray-500 mb-1">Record</div>
          <div className="font-mono text-sm mb-4">{item.record_id}</div>
          <div className="text-sm text-gray-500 mb-1">Risk Score</div>
          <div className="text-2xl font-bold text-govnavy mb-4">{item.risk_score}</div>
          <div className="text-sm text-gray-500 mb-1">Status</div>
          <div className="mb-4">{item.status}</div>
          <label className="text-xs text-gray-500">Verifier Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm mt-1" rows={3}
            placeholder="e.g. Cross-checked with FMB sketch, area discrepancy confirmed as surveyor error" />
          <div className="flex gap-3 mt-4">
            <button onClick={() => act('Approve')} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm">Approve</button>
            <button onClick={() => act('Reject')} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm">Reject</button>
            <button onClick={() => act('Escalate')} className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm">Escalate to Tehsildar</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
