import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet'
import Layout from '../components/Layout'
import { gisParcels } from '../data/dummy'

const statusColor = { validated: '#16a34a', conflict: '#dc2626', pending: '#d97706' }

export default function GisMap() {
  return (
    <Layout title="GIS Map View">
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex gap-4 text-xs">
        <span><span className="inline-block w-3 h-3 rounded-full bg-green-600 mr-1"></span>Validated</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-1"></span>Conflict</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-amber-600 mr-1"></span>Pending</span>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ height: 520 }}>
        <MapContainer center={[13.045, 80.045]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {gisParcels.map((p) => (
            <Polygon key={p.id} positions={p.coords} pathOptions={{ color: statusColor[p.status], fillOpacity: 0.4 }}>
              <Popup>
                <div className="text-xs">
                  <div><b>Parcel:</b> {p.id}</div>
                  <div><b>Village:</b> {p.village}</div>
                  <div><b>Status:</b> {p.status}</div>
                </div>
              </Popup>
            </Polygon>
          ))}
        </MapContainer>
      </div>
    </Layout>
  )
}
