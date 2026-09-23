import { landRecords } from './records'

const uploadKey = 'bhusutra_demo_upload'
const overrideKey = 'bhusutra_record_overrides'

const consistentFields = {
  owner: 'Ramesh Kumar',
  surveyNo: '142/3',
  khasraNo: '87',
  khataNo: '245',
  area: '2.5 Acres',
  location: 'Bagalur, Hosur, Krishnagiri',
}

export function createDemoUpload(fileName, scenario = 'consistent') {
  const isConflict = scenario === 'conflict'
  const upload = {
    id: 'demo-upload-142',
    fileName: fileName || (isConflict ? 'Patta_142_conflict.pdf' : 'Patta_142_3.pdf'),
    documentType: 'Patta',
    district: 'Krishnagiri',
    village: 'Bagalur',
    scenario,
    extracted: { ...consistentFields, khasraNo: isConflict ? '92' : consistentFields.khasraNo },
    evidence: { ...consistentFields },
    confidence: isConflict ? 61 : 94,
    risk: isConflict ? 'High' : 'Low',
    reason: isConflict ? 'Khasra number differs from the existing Patta and requires officer review.' : 'All extracted identifiers and ownership details match the existing evidence.',
    status: 'Pending verification',
  }
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
  const record = landRecords.find((item) => item.id === 'BHU-2026-001')
  if (!record) return
  Object.assign(record, { status, verificationStatus: status === 'Verified' ? 'Verified' : status === 'Pending verification' ? 'Pending' : 'Requires review', lastUpdated: 'Just now', ...changes })
  let overrides = {}
  try { overrides = JSON.parse(localStorage.getItem(overrideKey)) || {} } catch { overrides = {} }
  overrides[record.id] = { status: record.status, verificationStatus: record.verificationStatus, lastUpdated: record.lastUpdated, ...changes }
  localStorage.setItem(overrideKey, JSON.stringify(overrides))
}