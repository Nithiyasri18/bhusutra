import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get('/audit')
      .then((response) => { if (active) setLogs(response.data) })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.detail || 'Could not load the audit trail.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <Layout title="Audit trail">
    <section className="panel">
      <div className="panel-heading"><div><h3>Recorded actions</h3><p>Authentication, registration, document, and review actions stored in PostgreSQL.</p></div></div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading audit records...</p> : <div className="table-wrap">
        <table><thead><tr><th>Actor</th><th>Action</th><th>Document / case</th><th>Previous → New</th><th>Timestamp</th></tr></thead>
          <tbody>{logs.map((log) => <tr key={log.id}>
            <td>{log.performed_by || 'System'}</td><td>{log.action}</td>
            <td>{log.document_id ? <Link to={`/documents/${log.document_id}`} className="view-all">Document</Link> : log.case_id ? `Case ${log.case_id.slice(0, 8)}` : '—'}</td>
            <td className="text-xs text-slate-500">{log.prev_value && log.new_value ? `${log.prev_value} → ${log.new_value}` : log.new_value || '—'}</td>
            <td className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
          </tr>)}{logs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">No audit actions have been recorded.</td></tr>}</tbody>
        </table>
      </div>}
    </section>
  </Layout>
}
