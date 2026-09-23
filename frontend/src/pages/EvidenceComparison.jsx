import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { evidenceComparison } from '../data/dummy'

export default function EvidenceComparison() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const data = evidenceComparison[recordId] || evidenceComparison['88/1']

  return (
    <Layout title={`Evidence Comparison — Survey No. ${data.surveyNo}`}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {['Doc A (1987)', 'Doc B (2004)', 'Doc C (2019 — GIS)'].map((label, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 h-40 flex items-center justify-center text-gray-400 text-xs">
            📄 {label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="text-sm font-semibold text-govnavy mb-4">Field-by-Field Comparison</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Field</th><th>Doc A</th><th>Doc B</th><th>Doc C</th><th>Match?</th>
            </tr>
          </thead>
          <tbody>
            {data.fields.map((f, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">{f.field}</td><td>{f.docA}</td><td>{f.docB}</td><td>{f.docC}</td>
                <td>
                  {f.match
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Match</span>
                    : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Mismatch</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.varianceNote && <div className="text-xs text-amber-600 mt-3">⚠ {data.varianceNote}</div>}
      </div>

      <div className="flex gap-3">
        <button className="bg-govnavy text-white px-4 py-2 rounded-md text-sm">Approve Match</button>
        <button onClick={() => navigate('/verification-queue')} className="bg-govgold text-govnavy px-4 py-2 rounded-md text-sm font-semibold">
          Send to Human Verification
        </button>
      </div>
    </Layout>
  )
}
