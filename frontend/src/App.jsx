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
import Unauthorized from './pages/Unauthorized'
import Profile from './pages/Profile'
import { canAccess, getCurrentUser, ROLE } from './data/access'

function RequireAuth({ children }) {
  const token = localStorage.getItem('bhusutra_token')
  return token ? children : <Navigate to="/login" replace />
}

function RequireRole({ children, roles }) {
  const user = getCurrentUser()
  return canAccess(user.role, roles) ? children : <Navigate to="/unauthorized" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<RequireAuth><Unauthorized /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/records" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN, ROLE.VERIFIER, ROLE.DISTRICT, ROLE.ADMIN]}><Records /></RequireRole></RequireAuth>} />
      <Route path="/records/:recordId" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN, ROLE.VERIFIER, ROLE.DISTRICT, ROLE.ADMIN]}><RecordDetails /></RequireRole></RequireAuth>} />
      <Route path="/upload" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN]}><Upload /></RequireRole></RequireAuth>} />
      <Route path="/ocr-results/:docId" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN, ROLE.VERIFIER]}><OcrResults /></RequireRole></RequireAuth>} />
      <Route path="/validation" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN, ROLE.VERIFIER]}><Validation /></RequireRole></RequireAuth>} />
      <Route path="/verification-result/:docId" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN, ROLE.VERIFIER]}><VerificationResult /></RequireRole></RequireAuth>} />
      <Route path="/evidence-comparison/:recordId" element={<RequireAuth><RequireRole roles={[ROLE.VERIFIER, ROLE.DISTRICT, ROLE.ADMIN]}><EvidenceComparison /></RequireRole></RequireAuth>} />
      <Route path="/verification-queue" element={<RequireAuth><RequireRole roles={[ROLE.VERIFIER, ROLE.ADMIN]}><VerificationQueue /></RequireRole></RequireAuth>} />
      <Route path="/verification/:caseId" element={<RequireAuth><RequireRole roles={[ROLE.VERIFIER, ROLE.ADMIN]}><VerificationCase /></RequireRole></RequireAuth>} />
      <Route path="/gis-map" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN, ROLE.VERIFIER, ROLE.DISTRICT, ROLE.ADMIN]}><GisMap /></RequireRole></RequireAuth>} />
      <Route path="/audit-trail" element={<RequireAuth><RequireRole roles={[ROLE.VERIFIER, ROLE.DISTRICT, ROLE.ADMIN]}><AuditTrail /></RequireRole></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><RequireRole roles={[ROLE.VERIFIER, ROLE.DISTRICT, ROLE.ADMIN]}><Analytics /></RequireRole></RequireAuth>} />
      <Route path="/export" element={<RequireAuth><RequireRole roles={[ROLE.DISTRICT, ROLE.ADMIN]}><Export /></RequireRole></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth><RequireRole roles={[ROLE.ADMIN]}><AdminUsers /></RequireRole></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
    </Routes>
  )
}
