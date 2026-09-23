export default function Card({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-govnavy mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}
