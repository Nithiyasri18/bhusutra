import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { analyticsData } from '../data/dummy'

export default function Analytics() {
  const highestRisk = [...analyticsData.districtMismatchRate].sort((a, b) => b.rate - a.rate)[0]

  return (
    <Layout title="Analytics & Insights">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card label="Highest-Risk District" value={highestRisk.district} sub={`${highestRisk.rate}% mismatch rate`} />
        <Card label="Total Errors Flagged" value={analyticsData.errorTypes.reduce((s, e) => s + e.count, 0)} />
        <Card label="Records / Day (avg)" value="~780" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm font-semibold text-govnavy mb-3">Mismatch Rate by District</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analyticsData.districtMismatchRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Bar dataKey="rate" fill="#C9A227" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="text-sm font-semibold text-govnavy mb-3">Most Common Error Types</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analyticsData.errorTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="type" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#14396D" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="text-sm font-semibold text-govnavy mb-3">Digitization Velocity (last 14 days)</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={analyticsData.velocityTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="records" stroke="#14396D" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  )
}
