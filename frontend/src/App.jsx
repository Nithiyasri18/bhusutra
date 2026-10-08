import { Navigate, Route, Routes } from 'react-router-dom'
import { canAccess, getCurrentUser, ROLE } from './data/access'
import AdminUsers from './pages/AdminUsers'
import AuditTrail from './pages/AuditTrail'
import Copilot from './pages/Copilot'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import OcrResults from './pages/OcrResults'
import Records from './pages/Records'
import Unauthorized from './pages/Unauthorized'
import Upload from './pages/Upload'
import VerificationQueue from './pages/VerificationQueue'

function RequireAuth({ children }) {
  const token = localStorage.getItem('bhusutra_token')
  const user = getCurrentUser()
  if (!token || token.split('.').length !== 3 || !user) {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }
  return children
}

function RequireRole({ children, roles }) {
  const user = getCurrentUser()
  return canAccess(user?.role, roles) ? children : <Navigate to="/unauthorized" replace />
}

const staffRoles = [ROLE.OFFICER, ROLE.ADMIN, ROLE.AUDITOR]
const documentRoles = [ROLE.CITIZEN, ...staffRoles]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<RequireAuth><Unauthorized /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/records" element={<RequireAuth><RequireRole roles={documentRoles}><Records /></RequireRole></RequireAuth>} />
      <Route path="/documents/:docId" element={<RequireAuth><RequireRole roles={documentRoles}><OcrResults /></RequireRole></RequireAuth>} />
      <Route path="/upload" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN]}><Upload /></RequireRole></RequireAuth>} />
      <Route path="/verification-queue" element={<RequireAuth><RequireRole roles={staffRoles}><VerificationQueue /></RequireRole></RequireAuth>} />
      <Route path="/audit-trail" element={<RequireAuth><RequireRole roles={staffRoles}><AuditTrail /></RequireRole></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth><RequireRole roles={[ROLE.ADMIN]}><AdminUsers /></RequireRole></RequireAuth>} />
      <Route path="/copilot" element={<RequireAuth><RequireRole roles={[ROLE.CITIZEN]}><Copilot /></RequireRole></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
