import { landRecords } from './records'
import { getAllRecords, getCurrentUser, ROLE, upsertRecord } from './access'

const uploadKey = 'bhusutra_demo_upload'
const overrideKey = 'bhusutra_record_overrides'

const commonManOneFields = {
  owner: 'Ramesh Kumar',
  surveyNo: '142/3',
  khasraNo: '87',
  khataNo: '245',
  area: '2.5 Acres',
  location: 'Bagalur, Hosur, Krishnagiri',
}

const commonManTwoFields = {
  owner: 'Govindaraj',
  surveyNo: '88/1',
  khasraNo: '88-K1',
  khataNo: '214',
  area: '2.4 Acres',
  location: 'Thirumazhisai, Poonamallee, Tiruvallur',
}

export function createDemoUpload(fileName, scenario = 'consistent') {
  const user = getCurrentUser()
  const isSecondCitizen = user.id === 'citizen-2'
  const evidence = isSecondCitizen ? commonManTwoFields : commonManOneFields
  const isConflict = scenario === 'conflict'
  const recordId = `BHU-UPLOAD-${Date.now()}`
  const upload = {
    id: 'demo-upload-142',
    recordId,
    ownerUserId: user.role === ROLE.CITIZEN ? user.id : 'citizen-1',
    fileName: fileName || (isConflict ? 'Patta_conflict.pdf' : 'Patta_land_record.pdf'),
    documentType: 'Patta',
    district: isSecondCitizen ? 'Tiruvallur' : 'Krishnagiri',
    village: isSecondCitizen ? 'Thirumazhisai' : 'Bagalur',
    scenario,
    extracted: { ...evidence, khasraNo: isConflict ? '92' : evidence.khasraNo },
    evidence: { ...evidence },
    confidence: isConflict ? 61 : 94,
    risk: isConflict ? 'High' : 'Low',
    reason: isConflict ? 'Khasra number differs from the existing land evidence and requires officer review.' : 'All extracted identifiers and ownership details match the existing evidence.',
    status: 'Pending verification',
  }
  upsertRecord({ id: recordId, ownerUserId: upload.ownerUserId, district: upload.district, taluk: isSecondCitizen ? 'Poonamallee' : 'Hosur', village: upload.village, surveyNo: upload.extracted.surveyNo, khasraNo: upload.extracted.khasraNo, khataNo: upload.extracted.khataNo, owner: upload.extracted.owner, area: upload.extracted.area, documentType: upload.documentType, status: upload.status, verificationStatus: 'Pending', trustScore: upload.confidence, riskLevel: upload.risk, conflictType: isConflict ? 'Khasra mismatch' : 'None', lastUpdated: 'Just now' })
  sessionStorage.setItem(uploadKey, JSON.stringify(upload))
  return upload
}

export function getDemoUpload() {
  try {
    return JSON.parse(sessionStorage.getItem(uploadKey)) || createDemoUpload()
  } catch {
    return createDemoUpload()
  }
}

export function saveDemoUpload(upload) {
  sessionStorage.setItem(uploadKey, JSON.stringify(upload))
}

export function updateDemoRecord(status, changes = {}) {
  const user = getCurrentUser()
  let upload = null
  try { upload = JSON.parse(sessionStorage.getItem(uploadKey)) } catch { upload = null }
  const record = getAllRecords().find((item) => item.id === upload?.recordId) || getAllRecords().find((item) => item.ownerUserId === user.id) || landRecords.find((item) => item.id === 'BHU-2026-001')
  if (!record) return
  const nextValues = { status, verificationStatus: status === 'Verified' ? 'Verified' : status === 'Pending verification' ? 'Pending' : 'Requires review', lastUpdated: 'Just now', ...changes }
  Object.assign(record, nextValues)
  upsertRecord({ id: record.id, ...nextValues })
  let overrides = {}
  try { overrides = JSON.parse(localStorage.getItem(overrideKey)) || {} } catch { overrides = {} }
  overrides[record.id] = { status: record.status, verificationStatus: record.verificationStatus, lastUpdated: record.lastUpdated, ...changes }
  localStorage.setItem(overrideKey, JSON.stringify(overrides))
}
