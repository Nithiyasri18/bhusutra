import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function AuditTrail() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api.get('/audit').then((res) => setLogs(res.data)).catch(() => {})
  }, [])

  return (
    <Layout title="Audit & Provenance Trail">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold text-govnavy">Full Action Log (most recent first)</div>
          <button className="text-xs text-govblue hover:underline">Export Audit Log (CSV)</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Record ID</th><th>Action</th><th>Performed By</th><th>Prev → New</th><th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{l.record_id ? l.record_id.slice(0,8) : '—'}</td>
                <td>{l.action}</td>
                <td>{l.performed_by}</td>
                <td className="text-xs text-gray-500">{l.prev_value && l.new_value ? `${l.prev_value} → ${l.new_value}` : '—'}</td>
                <td className="text-xs text-gray-500">{new Date(l.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-sm">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
