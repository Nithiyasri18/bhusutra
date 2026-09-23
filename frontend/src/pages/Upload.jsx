import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Upload() {
  const [docs, setDocs] = useState([])
  const [file, setFile] = useState(null)
  const [batchName, setBatchName] = useState('Krishnagiri_Taluk_Batch_07')
  const [uploading, setUploading] = useState(false)

  function loadDocs() {
    api.get('/documents').then((res) => setDocs(res.data)).catch(() => {})
  }

  useEffect(() => { loadDocs() }, [])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('batch_name', batchName)
    try {
      await api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFile(null)
      loadDocs()
    } catch (err) {
      alert('Upload failed — check backend is running')
    }
    setUploading(false)
  }

  const statusColor = { Extracted: 'text-green-700 bg-green-50', 'OCR Running': 'text-amber-700 bg-amber-50', Failed: 'text-red-700 bg-red-50', Queued: 'text-gray-600 bg-gray-100' }

  return (
    <Layout title="Upload Documents">
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <form onSubmit={handleUpload} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Batch Name</label>
            <input value={batchName} onChange={(e) => setBatchName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm mt-1" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">Document (PDF / TIFF / JPG)</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm mt-1" />
          </div>
          <button disabled={uploading} className="bg-govnavy text-white px-5 py-2 rounded-md text-sm">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-sm font-semibold text-govnavy mb-3">Processing Queue</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Filename</th><th>Batch</th><th>Status</th><th>Uploaded At</th><th></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-2">{d.filename}</td>
                <td className="text-xs text-gray-500">{d.batch_name}</td>
                <td><span className={`text-xs px-2 py-1 rounded-full ${statusColor[d.status] || ''}`}>{d.status}</span></td>
                <td className="text-xs text-gray-500">{new Date(d.uploaded_at).toLocaleString()}</td>
                <td><a href="/ocr-results/doc-142" className="text-govblue text-xs hover:underline">View Extracted Fields</a></td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-sm">No documents yet — upload one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
