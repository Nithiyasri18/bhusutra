import { landRecords } from './records'

const uploadedRecordsKey = 'bhusutra_uploaded_records'
const overrideKey = 'bhusutra_record_overrides'

export const ROLE = {
  CITIZEN: 'Common Man',
  VERIFIER: 'Verification Officer',
  DISTRICT: 'District Officer',
  ADMIN: 'Administrator',
}

export const demoUsers = [
  { id: 'citizen-1', email: 'commonman1@bhusutra.demo', password: 'BhuSutra@123', name: 'Karthik Raman', role: ROLE.CITIZEN, district: 'Krishnagiri' },
  { id: 'citizen-2', email: 'commonman2@bhusutra.demo', password: 'BhuSutra@123', name: 'Nandhini Suresh', role: ROLE.CITIZEN, district: 'Tiruvallur' },
  { id: 'verifier-1', email: 'verification@bhusutra.demo', password: 'BhuSutra@123', name: 'Aditi Rao', role: ROLE.VERIFIER, district: null },
  { id: 'district-1', email: 'district@bhusutra.demo', password: 'BhuSutra@123', name: 'Meera Krishnan', role: ROLE.DISTRICT, district: 'Krishnagiri' },
  { id: 'admin-1', email: 'admin@bhusutra.demo', password: 'BhuSutra@123', name: 'Arun Prakash', role: ROLE.ADMIN, district: null },
]

const roleAliases = {
  Admin: ROLE.ADMIN,
  Administrator: ROLE.ADMIN,
  Verifier: ROLE.VERIFIER,
  'Verification Officer': ROLE.VERIFIER,
  'District Officer': ROLE.DISTRICT,
  Citizen: ROLE.CITIZEN,
  'Common Man': ROLE.CITIZEN,
}

export function normalizeRole(role) {
  return roleAliases[role] || ROLE.ADMIN
}

export function getCurrentUser() {
  const userId = localStorage.getItem('bhusutra_user_id')
  const email = localStorage.getItem('bhusutra_email')
  const knownUser = demoUsers.find((user) => user.id === userId || user.email === email)
  if (knownUser) return knownUser
  return { id: userId || 'admin-1', name: localStorage.getItem('bhusutra_name') || 'Administrator', role: normalizeRole(localStorage.getItem('bhusutra_role')), district: localStorage.getItem('bhusutra_district') || null }
}

export function getScopedRecords(user = getCurrentUser()) {
  const records = getAllRecords()
  if (user.role === ROLE.CITIZEN) return records.filter((record) => record.ownerUserId === user.id)
  if (user.role === ROLE.DISTRICT) return records.filter((record) => !user.district || record.district === user.district)
  return records
}

export function getAllRecords() {
  let uploaded = []
  let overrides = {}
  try { uploaded = JSON.parse(localStorage.getItem(uploadedRecordsKey)) || [] } catch { uploaded = [] }
  try { overrides = JSON.parse(localStorage.getItem(overrideKey)) || {} } catch { overrides = {} }
  const baseIds = new Set(landRecords.map((record) => record.id))
  const combined = [...landRecords, ...uploaded.filter((record) => !baseIds.has(record.id))]
  return combined.map((record) => ({ ...record, ...(overrides[record.id] || {}) }))
}

export function upsertRecord(record) {
  let uploaded = []
  try { uploaded = JSON.parse(localStorage.getItem(uploadedRecordsKey)) || [] } catch { uploaded = [] }
  const index = uploaded.findIndex((item) => item.id === record.id)
  if (index >= 0) uploaded[index] = { ...uploaded[index], ...record }
  else uploaded.push(record)
  localStorage.setItem(uploadedRecordsKey, JSON.stringify(uploaded))
}

export function getRecordStats(records = getAllRecords()) {
  const verified = records.filter((record) => record.status === 'Verified')
  const pending = records.filter((record) => record.status === 'Pending verification' || record.status === 'Processing')
  const conflicts = records.filter((record) => record.status === 'Conflict' || record.riskLevel === 'High')
  return {
    totalRecords: records.length,
    verifiedRecords: verified.length,
    pendingRecords: pending.length,
    conflictRecords: conflicts.length,
    reviewRecords: records.filter((record) => record.verificationStatus === 'Requires review').length,
    averageTrustScore: records.length ? (records.reduce((sum, record) => sum + record.trustScore, 0) / records.length).toFixed(1) : '0.0',
    districtCoverage: new Set(records.map((record) => record.district)).size,
  }
}

export function canAccess(role, allowedRoles) {
  return allowedRoles.includes(normalizeRole(role))
}
