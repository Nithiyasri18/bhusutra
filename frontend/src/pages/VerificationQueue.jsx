import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import api from '../api'

export default function VerificationQueue() {
  const [cases, setCases] = useState([])

  useEffect(() => {
    api.get('/verification/cases').then((res) => setCases(res.data)).catch(() => {})
  }, [])

  async function assign(id) {
    await api.post(`/verification/cases/${id}/assign`)
    const res = await api.get('/verification/cases')
    setCases(res.data)
  }

  const open = cases.filter((c) => c.status === 'Open')
  const resolvedToday = cases.filter((c) => c.status !== 'Open').length

  return (
    <Layout title="Human Verification Queue">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card label="Cases in Queue" value={open.length} />
        <Card label="Resolved" value={resolvedToday} />
        <Card label="Avg Resolution Time" value="4.2 min" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Case ID</th><th>Record</th><th>Risk Score</th><th>Assigned To</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{c.id.slice(0,8)}</td>
                <td className="font-mono text-xs">{c.record_id.slice(0,8)}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${c.risk_score > 70 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {c.risk_score}
                  </span>
                </td>
                <td className="text-xs">{c.assigned_to ? c.assigned_to.slice(0,8) : <button onClick={() => assign(c.id)} className="text-govblue hover:underline">Assign to Me</button>}</td>
                <td className="text-xs">{c.status}</td>
                <td><Link to={`/verification/${c.id}`} className="text-govblue text-xs hover:underline">Open Case →</Link></td>
              </tr>
            ))}
            {cases.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-400 text-sm">No cases yet — run the seed script to generate demo cases.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
