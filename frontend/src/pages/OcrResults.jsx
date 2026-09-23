import { useState } from 'react'
import Layout from '../components/Layout'
import { ocrResults } from '../data/dummy'

function confColor(c) {
  if (c >= 90) return 'bg-green-100 text-green-800'
  if (c >= 75) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

export default function OcrResults() {
  const doc = ocrResults['doc-142']
  const [fields, setFields] = useState(doc.fields)

  function acceptAll() {
    setFields(fields.map((f) => ({ ...f, confidence: 99 })))
  }

  return (
    <Layout title={`OCR Results — ${doc.filename}`}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-center min-h-[420px]">
          <div className="text-gray-400 text-sm text-center">
            📄 Scanned document preview<br />
            <span className="text-xs">(plug in actual scanned image at ocrResults[docId].imageUrl)</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-sm font-semibold text-govnavy mb-4">Extracted Fields</div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="text-xs text-gray-500">{f.label}</div>
                  <div className="text-sm font-medium">{f.value}</div>
                  {f.altSuggestion && <div className="text-xs text-amber-600">Alt: {f.altSuggestion}?</div>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${confColor(f.confidence)}`}>
                  {f.confidence}%
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={acceptAll} className="bg-govnavy text-white px-4 py-2 rounded-md text-sm">Accept All</button>
            <a href="/validation" className="bg-govgold text-govnavy px-4 py-2 rounded-md text-sm font-semibold">Send to Validation</a>
          </div>
        </div>
      </div>
    </Layout>
  )
}
