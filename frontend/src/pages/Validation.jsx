import Layout from '../components/Layout'
import { identifierChains } from '../data/dummy'

export default function Validation() {
  return (
    <Layout title="Survey / Khasra / Khata Validation">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-xs uppercase text-gray-500">Identifiers Resolved Today</div>
          <div className="text-2xl font-bold text-govnavy mt-1">340</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-xs uppercase text-gray-500">Conflicts Detected</div>
          <div className="text-2xl font-bold text-red-600 mt-1">12</div>
        </div>
      </div>

      <div className="space-y-6">
        {identifierChains.map((chain, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-6 text-sm">
                <div><span className="text-gray-500">Survey No.</span> <span className="font-semibold">{chain.surveyNo}</span></div>
                <div><span className="text-gray-500">Khasra No.</span> <span className="font-semibold">{chain.khasraNo}</span></div>
                <div><span className="text-gray-500">Khata No.</span> <span className="font-semibold">{chain.khataNo}</span></div>
              </div>
              {chain.conflict
                ? <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Conflict Detected</span>
                : <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Consistent</span>}
            </div>

            {chain.conflict && <div className="text-xs text-red-600 mb-3">⚠ {chain.conflictNote}</div>}

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Document Date</th><th>Source</th><th>Owner Name</th><th>Area (acres)</th>
                </tr>
              </thead>
              <tbody>
                {chain.linkedDocuments.map((d, j) => (
                  <tr key={j} className="border-b last:border-0">
                    <td className="py-2">{d.year}</td><td>{d.source}</td><td>{d.owner}</td><td>{d.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex gap-3">
              <a href={`/evidence-comparison/${chain.surveyNo}`} className="text-govblue text-sm hover:underline">View Evidence Comparison →</a>
              {chain.conflict && <button className="text-red-600 text-sm hover:underline ml-auto">Flag Conflict</button>}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
