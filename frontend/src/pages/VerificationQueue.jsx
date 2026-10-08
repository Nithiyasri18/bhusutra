import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'
import { getCurrentUser, ROLE } from '../data/access'

export default function VerificationQueue() {
  const user = getCurrentUser()
  const [cases, setCases] = useState([])
  const [notes, setNotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const canResolve = user?.role === ROLE.OFFICER || user?.role === ROLE.ADMIN

  const refresh = useCallback(async () => {
    const response = await api.get('/verification/cases')
    setCases(response.data)
  }, [])

  useEffect(() => {
    refresh().catch((requestError) => setError(requestError.response?.data?.detail || 'Could not load the officer queue.'))
      .finally(() => setLoading(false))
  }, [refresh])

  async function assign(id) {
    setBusyId(id)
    setError('')
    try {
      await api.post(`/verification/cases/${id}/assign`)
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not assign this case.')
    } finally {
      setBusyId('')
    }
  }

  async function resolve(id, action) {
    const note = (notes[id] || '').trim()
    if (!note) {
      setError('Enter a review note before approving or rejecting a case.')
      return
    }
    setBusyId(id)
    setError('')
    try {
      await api.post(`/verification/cases/${id}/action`, { action, notes: note })
      setNotes((current) => ({ ...current, [id]: '' }))
      await refresh()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || `Could not ${action.toLowerCase()} this case.`)
    } finally {
      setBusyId('')
    }
  }

  return <Layout title="Officer review queue">
    <p className="mb-5 text-sm text-slate-500">Every case shows extracted fields and review reasons. Official ownership verification is unavailable; human review is required.</p>
    {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
    {loading && <p className="text-sm text-slate-500" role="status">Loading review cases...</p>}
    {!loading && cases.length === 0 && <section className="panel py-10 text-center text-sm text-slate-500">No verification cases are waiting for review.</section>}
    <div className="space-y-4">{cases.map((item) => <section className="panel" key={item.id}>
      <div className="panel-heading">
        <div><h3>{item.document?.filename || `Case ${item.id.slice(0, 8)}`}</h3><p>Created {new Date(item.created_at).toLocaleString()} · Case status: {item.status}</p></div>
        {item.score != null && <span className="status-pill">{item.score}/100 review readiness</span>}
      </div>
      {item.document_id && <Link to={`/documents/${item.document_id}`} className="view-all">Open document and extracted fields -&gt;</Link>}
      {item.reasons?.length > 0 && <ul className="my-4 list-disc space-y-1 pl-5 text-sm text-amber-800">{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
      {item.notes && <p className="my-3 text-sm text-slate-600">Previous notes: {item.notes}</p>}
      {item.status === 'Open' && canResolve && <div className="mt-4 border-t border-slate-100 pt-4">
        <label className="field-label">Officer review note<textarea rows={2} maxLength={4000} value={notes[item.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} className="field-input" placeholder="Document your review findings and decision." /></label>
        <div className="mt-3 flex flex-wrap gap-3">
          {!item.assigned_to && <button disabled={busyId === item.id} onClick={() => assign(item.id)} className="secondary-button">Assign to me</button>}
          <button disabled={busyId === item.id} onClick={() => resolve(item.id, 'Approve')} className="primary-button disabled:opacity-50">Approve after review</button>
          <button disabled={busyId === item.id} onClick={() => resolve(item.id, 'Reject')} className="secondary-button disabled:opacity-50">Reject after review</button>
        </div>
      </div>}
    </section>)}</div>
  </Layout>
}
