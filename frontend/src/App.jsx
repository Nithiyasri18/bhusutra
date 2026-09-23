import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import OcrResults from './pages/OcrResults'
import Validation from './pages/Validation'
import EvidenceComparison from './pages/EvidenceComparison'
import VerificationQueue from './pages/VerificationQueue'
import VerificationCase from './pages/VerificationCase'
import GisMap from './pages/GisMap'
import AuditTrail from './pages/AuditTrail'
import Analytics from './pages/Analytics'
import Export from './pages/Export'
import AdminUsers from './pages/AdminUsers'
import Records from './pages/Records'
import VerificationResult from './pages/VerificationResult'
import RecordDetails from './pages/RecordDetails'

function RequireAuth({ children }) {
  const token = localStorage.getItem('bhusutra_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/records" element={<RequireAuth><Records /></RequireAuth>} />
      <Route path="/records/:recordId" element={<RequireAuth><RecordDetails /></RequireAuth>} />
      <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
      <Route path="/ocr-results/:docId" element={<RequireAuth><OcrResults /></RequireAuth>} />
      <Route path="/validation" element={<RequireAuth><Validation /></RequireAuth>} />
      <Route path="/verification-result/:docId" element={<RequireAuth><VerificationResult /></RequireAuth>} />
      <Route path="/evidence-comparison/:recordId" element={<RequireAuth><EvidenceComparison /></RequireAuth>} />
      <Route path="/verification-queue" element={<RequireAuth><VerificationQueue /></RequireAuth>} />
      <Route path="/verification/:caseId" element={<RequireAuth><VerificationCase /></RequireAuth>} />
      <Route path="/gis-map" element={<RequireAuth><GisMap /></RequireAuth>} />
      <Route path="/audit-trail" element={<RequireAuth><AuditTrail /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
      <Route path="/export" element={<RequireAuth><Export /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth><AdminUsers /></RequireAuth>} />
    </Routes>
  )
}
