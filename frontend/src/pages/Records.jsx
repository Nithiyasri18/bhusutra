import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'
import { getCurrentUser, ROLE } from '../data/access'

export default function Records() {
  const user = getCurrentUser()
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get('/documents')
      .then((response) => { if (active) setDocuments(response.data) })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.detail || 'Could not load document history.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <Layout title={user?.role === ROLE.CITIZEN ? 'My documents' : 'Documents'}>
    <section className="panel">
      <div className="panel-heading"><div><h3>Upload history</h3><p>Documents and current review status from the service database.</p></div>
        {user?.role === ROLE.CITIZEN && <Link to="/upload" className="primary-button compact">Upload document</Link>}
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading documents...</p> : (
        <div className="table-wrap"><table><thead><tr><th>Document</th><th>Uploaded</th><th>Status</th><th>Size</th><th></th></tr></thead>
          <tbody>{documents.map((document) => <tr key={document.id}>
            <td><strong className="text-[#183755]">{document.filename}</strong><span className="block text-[10px] text-slate-400 mt-1">{document.content_type}</span></td>
            <td>{new Date(document.uploaded_at).toLocaleString()}</td>
            <td><span className="status-pill">{document.status}</span></td>
            <td>{(document.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
            <td><Link to={`/documents/${document.id}`} className="view-all">Details -&gt;</Link></td>
          </tr>)}
          {documents.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">No documents have been uploaded.</td></tr>}</tbody>
        </table></div>
      )}
    </section>
  </Layout>
}
