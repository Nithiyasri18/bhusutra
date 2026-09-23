// Seeded demo data for AI-heavy pages that are simulated for the SIH prototype.
// In production these would come from the OCR/ML and GIS pipelines.
import { landRecords } from './records'

export const ocrResults = {
  "doc-142": {
    docId: "doc-142",
    filename: "Patta_142_2A_1987.pdf",
    imageUrl: null, // placeholder — plug in actual scanned image URL
    fields: [
      { label: "Survey Number", value: "142/2A", confidence: 97 },
      { label: "Khasra Number", value: "142-K2A", confidence: 95 },
      { label: "Khata Number", value: "331", confidence: 93 },
      { label: "Owner Name", value: "Ramasamy", confidence: 68, altSuggestion: "Ramaswamy" },
      { label: "Village", value: "Thirumazhisai", confidence: 91 },
      { label: "Tehsil", value: "Poonamallee", confidence: 89 },
      { label: "Area (acres)", value: "2.40", confidence: 96 },
    ],
  },
}

export const identifierChains = [
  {
    surveyNo: "88/1",
    khasraNo: "88-K1",
    khataNo: "214",
    conflict: true,
    conflictNote: "Khata 214 linked to two different Survey Numbers — possible fragmentation error",
    linkedDocuments: [
      { year: 1987, source: "Patta Register", owner: "Govindaraj", area: 2.4 },
      { year: 2004, source: "Mutation Register", owner: "Govindaraj", area: 2.4 },
      { year: 2019, source: "FMB Sketch (GIS)", owner: "Govindaraj S/o Muthu", area: 2.75 },
    ],
  },
  {
    surveyNo: "142/2A",
    khasraNo: "142-K2A",
    khataNo: "331",
    conflict: false,
    linkedDocuments: [
      { year: 1987, source: "Patta Register", owner: "Ramasamy", area: 2.40 },
      { year: 2004, source: "Encumbrance Certificate", owner: "Ramasamy", area: 2.40 },
      { year: 2020, source: "Adangal Extract", owner: "Ramasamy", area: 2.40 },
    ],
  },
]

export const evidenceComparison = {
  "88/1": {
    surveyNo: "88/1",
    fields: [
      { field: "Owner Name", docA: "Govindaraj", docB: "Govindaraj", docC: "Govindaraj S/o Muthu", match: false },
      { field: "Area (acres)", docA: "2.40", docB: "2.40", docC: "2.75", match: false },
      { field: "Village", docA: "Thirumazhisai", docB: "Thirumazhisai", docC: "Thirumazhisai", match: true },
      { field: "Khata No.", docA: "214", docB: "214", docC: "214", match: true },
    ],
    varianceNote: "Area variance of 14% detected between Mutation Register (2004) and GIS Sketch (2019)",
  },
}

export const gisParcels = [
  { id: "P-001", village: "Thirumazhisai", status: "validated", coords: [[13.045,80.045],[13.047,80.045],[13.047,80.048],[13.045,80.048]] },
  { id: "P-002", village: "Thirumazhisai", status: "conflict", coords: [[13.048,80.049],[13.050,80.049],[13.050,80.052],[13.048,80.052]] },
  { id: "P-003", village: "Poonamallee", status: "pending", coords: [[13.041,80.041],[13.043,80.041],[13.043,80.044],[13.041,80.044]] },
]

export const analyticsData = {
  districtMismatchRate: [
    { district: "Tiruvallur", rate: 22 },
    { district: "Chennai", rate: 9 },
    { district: "Kanchipuram", rate: 14 },
    { district: "Vellore", rate: 11 },
    { district: "Krishnagiri", rate: 18 },
    { district: "Salem", rate: 7 },
  ],
  errorTypes: [
    { type: "Name Mismatch", count: 84 },
    { type: "Area Mismatch", count: 61 },
    { type: "Duplicate Khata", count: 22 },
    { type: "Boundary Overlap", count: 15 },
  ],
  velocityTrend: Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    records: Math.floor(600 + Math.random() * 400),
  })),
}

export const dashboardData = {
  kpis: [
    { label: 'Total records processed', value: landRecords.length, change: '12 seeded', note: 'open all records', tone: 'blue', view: 'all' },
    { label: 'Records verified', value: landRecords.filter((record) => record.verificationStatus === 'Verified').length, change: 'verified', note: 'open verified records', tone: 'teal', view: 'verified' },
    { label: 'Pending verification', value: landRecords.filter((record) => record.verificationStatus === 'Pending').length, change: 'officer queue', note: 'requires verification', tone: 'amber', view: 'pending' },
    { label: 'High-risk conflicts', value: landRecords.filter((record) => record.riskLevel === 'High').length, change: 'needs review', note: 'identifier or field mismatch', tone: 'red', view: 'conflicts' },
    { label: 'District coverage', value: `${new Set(landRecords.map((record) => record.district)).size} districts`, change: 'seeded scope', note: 'Tamil Nadu records', tone: 'violet' },
    { label: 'Average trust score', value: (landRecords.reduce((total, record) => total + record.trustScore, 0) / landRecords.length).toFixed(1), change: 'mock average', note: 'across all records', tone: 'green' },
  ],
  monthlyRecords: [
    { month: 'Jan', records: 2 }, { month: 'Feb', records: 3 }, { month: 'Mar', records: 4 },
    { month: 'Apr', records: 5 }, { month: 'May', records: 6 }, { month: 'Jun', records: 7 },
    { month: 'Jul', records: 8 }, { month: 'Aug', records: 10 }, { month: 'Sep', records: 12 },
  ],
  trustDistribution: [
    { name: '90–100 Excellent', value: Math.round(landRecords.filter((record) => record.trustScore >= 90).length / landRecords.length * 100), color: '#0f8b8d' },
    { name: '75–89 Good', value: Math.round(landRecords.filter((record) => record.trustScore >= 75 && record.trustScore < 90).length / landRecords.length * 100), color: '#2c5aa0' },
    { name: '60–74 Review', value: Math.round(landRecords.filter((record) => record.trustScore >= 60 && record.trustScore < 75).length / landRecords.length * 100), color: '#e3a72f' },
    { name: 'Below 60 Risk', value: Math.round(landRecords.filter((record) => record.trustScore < 60).length / landRecords.length * 100), color: '#d75959' },
  ],
  averageTrustScore: (landRecords.reduce((total, record) => total + record.trustScore, 0) / landRecords.length).toFixed(1),
  validationStatus: [
    { name: 'Verified', value: landRecords.filter((record) => record.status === 'Verified').length, color: '#0f8b8d' },
    { name: 'In review', value: landRecords.filter((record) => record.status === 'Pending verification').length, color: '#e3a72f' },
    { name: 'Conflicted', value: landRecords.filter((record) => record.status === 'Conflict').length, color: '#d75959' },
    { name: 'Processing', value: landRecords.filter((record) => record.status === 'Processing').length, color: '#8aa4c5' },
  ],
  districts: [
    { district: 'Krishnagiri', completed: 100, total: 1 }, { district: 'Tiruvallur', completed: 50, total: 2 },
    { district: 'Madurai', completed: 100, total: 1 }, { district: 'Salem', completed: 0, total: 1 },
    { district: 'Coimbatore', completed: 100, total: 1 },
  ],
  activity: [
    ...landRecords.slice(0, 5).map((record) => ({ survey: record.surveyNo, khasra: record.khasraNo, khata: record.khataNo, status: record.status === 'Pending verification' ? 'In review' : record.status, score: record.trustScore.toFixed(1), updated: record.lastUpdated })),
  ],
}
