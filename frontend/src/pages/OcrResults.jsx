import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api'

const fieldLabels = {
  survey_number: 'Survey Number',
  khata_number: 'Khata Number',
  khasra_number: 'Khasra Number',
  owner_name: 'Owner Name',
  village_name: 'Village Name',
  district: 'District',
}

export default function OcrResults() {
  const { docId } = useParams()
  const [document, setDocument] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''
    Promise.all([
      api.get(`/documents/${docId}`),
      api.get(`/documents/${docId}/file`, { responseType: 'blob' }),
    ]).then(([detail, file]) => {
      if (!active) return
      setDocument(detail.data)
      objectUrl = URL.createObjectURL(file.data)
      setPreviewUrl(objectUrl)
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.detail || 'Could not load this document.')
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [docId])

  return <Layout title="Document extraction and review">
    {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
    {!document && !error && <p className="text-sm text-slate-500" role="status">Loading document and OCR results...</p>}
    {document && <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className="panel">
        <div className="panel-heading"><div><h3>Uploaded document</h3><p>{document.filename}</p></div><span className="status-pill">{document.status}</span></div>
        {previewUrl && document.content_type.startsWith('image/')
          ? <img src={previewUrl} alt={`Uploaded ${document.filename}`} className="max-h-[600px] w-full rounded-lg border object-contain" />
          : previewUrl && <iframe title={`Preview of ${document.filename}`} src={previewUrl} className="h-[600px] w-full rounded-lg border" />}
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h3>OCR extraction</h3><p>Fields recognized in this document; review them against the original.</p></div>
          {document.ocr_confidence != null && <span className="status-pill">{document.ocr_confidence}% OCR confidence</span>}
        </div>
        {document.ocr_fields
          ? <div className="space-y-2">{Object.entries(fieldLabels).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3">
            <span className="text-xs text-slate-500">{label}</span>
            <div className="text-right"><strong className="text-sm text-[#183755]">{document.ocr_fields[key] || 'Not detected'}</strong>
              {document.field_confidence?.[key] != null && <span className="ml-2 text-xs text-slate-400">{document.field_confidence[key]}%</span>}</div>
          </div>)}</div>
          : <p className="text-sm text-slate-500">No extraction result is available for this document.</p>}
        {document.score != null && <div className="mt-6 rounded-lg bg-[#f5f8fa] p-4">
          <div className="flex items-center justify-between"><h4 className="font-semibold text-[#183755]">Review readiness score</h4><strong className="text-lg text-[#183755]">{document.score}/100</strong></div>
          <div className="mt-3 space-y-2 text-xs text-slate-600">{Object.entries(document.score_components || {}).map(([key, value]) => <div key={key} className="flex justify-between gap-4"><span>{key.replaceAll('_', ' ')}</span><span>{value.status || `${value.points} points`}</span></div>)}</div>
          {document.reasons?.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-800">{document.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
          <p className="mt-4 text-xs font-semibold text-amber-800">{document.official_status}</p>
        </div>}
        <p className="mt-4 text-xs text-slate-400">This score is not a legal determination or official land-record verification. Only an authorized officer can review a case; the Copilot cannot approve documents.</p>
      </section>
    </div>}
    <Link to="/records" className="view-all mt-5 inline-block">Back to documents -&gt;</Link>
  </Layout>
}
