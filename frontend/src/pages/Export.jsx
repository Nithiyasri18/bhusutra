import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import api from '../api'

export default function Export() {
  const [summary, setSummary] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  function load() {
    api.get('/export/summary').then((res) => setSummary(res.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  async function triggerSync() {
    setSyncing(true)
    const res = await api.post('/export/trigger-sync')
    setLastResult(res.data)
    setSyncing(false)
    load()
  }

  if (!summary) return <Layout title="API Export"><div className="text-sm text-gray-500">Loading…</div></Layout>

  return (
    <Layout title="API Export — LRMS / DILRMP Sync">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card label="Export-Ready Records" value={summary.export_ready_records} />
        <Card label="Last Sync Status" value={summary.last_sync_status} />
        <Card label="Format" value={summary.format} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-sm font-semibold text-govnavy mb-4">Batch Export History</div>
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Batch ID</th><th>Record Count</th><th>Format</th><th>Status</th><th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b"><td className="py-2 font-mono text-xs">EXP-2026-041</td><td>9,340</td><td>DILRMP v2</td><td className="text-green-700">Success</td><td className="text-xs text-gray-500">2 hrs ago</td></tr>
            <tr className="border-b"><td className="py-2 font-mono text-xs">EXP-2026-040</td><td>8,912</td><td>DILRMP v2</td><td className="text-green-700">Success</td><td className="text-xs text-gray-500">1 day ago</td></tr>
            {lastResult && (
              <tr className="border-b"><td className="py-2 font-mono text-xs">EXP-{Date.now().toString().slice(-6)}</td><td>{lastResult.records_synced}</td><td>DILRMP v2</td><td className="text-green-700">{lastResult.status}</td><td className="text-xs text-gray-500">just now</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex gap-3">
          <button onClick={triggerSync} disabled={syncing} className="bg-govnavy text-white px-4 py-2 rounded-md text-sm">
            {syncing ? 'Syncing…' : 'Trigger Sync'}
          </button>
          <button className="bg-gray-100 text-govnavy px-4 py-2 rounded-md text-sm">Export as DILRMP Schema (JSON)</button>
          <button className="bg-gray-100 text-govnavy px-4 py-2 rounded-md text-sm">Export CSV</button>
        </div>
      </div>
    </Layout>
  )
}
