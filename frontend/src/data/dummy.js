// Seeded demo data for AI-heavy pages that are simulated for the SIH prototype.
// In production these would come from the OCR/ML and GIS pipelines.

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
    { label: 'Total records processed', value: '18,642', change: '+12.8%', note: 'vs. last month', tone: 'blue' },
    { label: 'Records verified', value: '14,908', change: '+8.4%', note: '80% completion rate', tone: 'teal' },
    { label: 'Pending verification', value: '2,486', change: '−4.2%', note: '342 due this week', tone: 'amber' },
    { label: 'High-risk conflicts', value: '126', change: '−18.6%', note: 'needs officer review', tone: 'red' },
    { label: 'District coverage', value: '18 / 24', change: '75%', note: 'districts onboarded', tone: 'violet' },
    { label: 'Average trust score', value: '92.4', change: '+2.1 pts', note: 'across verified records', tone: 'green' },
  ],
  monthlyRecords: [
    { month: 'Jan', records: 920 }, { month: 'Feb', records: 1180 }, { month: 'Mar', records: 1410 },
    { month: 'Apr', records: 1690 }, { month: 'May', records: 1830 }, { month: 'Jun', records: 2260 },
    { month: 'Jul', records: 2480 }, { month: 'Aug', records: 2710 }, { month: 'Sep', records: 3162 },
  ],
  trustDistribution: [
    { name: '90–100 Excellent', value: 64, color: '#0f8b8d' },
    { name: '75–89 Good', value: 24, color: '#2c5aa0' },
    { name: '60–74 Review', value: 9, color: '#e3a72f' },
    { name: 'Below 60 Risk', value: 3, color: '#d75959' },
  ],
  validationStatus: [
    { name: 'Verified', value: 14908, color: '#0f8b8d' },
    { name: 'In review', value: 2486, color: '#e3a72f' },
    { name: 'Conflicted', value: 126, color: '#d75959' },
    { name: 'Processing', value: 1122, color: '#8aa4c5' },
  ],
  districts: [
    { district: 'Mysuru', completed: 94, total: 100 }, { district: 'Mandya', completed: 87, total: 100 },
    { district: 'Hassan', completed: 76, total: 100 }, { district: 'Kodagu', completed: 68, total: 100 },
    { district: 'Tumakuru', completed: 59, total: 100 },
  ],
  activity: [
    { survey: '142/2A', khasra: '142-K2A', khata: '331', status: 'Verified', score: '98.2', updated: 'Today, 10:42 AM' },
    { survey: '88/1', khasra: '88-K1', khata: '214', status: 'Conflict', score: '61.8', updated: 'Today, 09:18 AM' },
    { survey: '207/3B', khasra: '207-K3B', khata: '582', status: 'Verified', score: '94.6', updated: 'Yesterday, 04:36 PM' },
    { survey: '51/4', khasra: '51-K4', khata: '109', status: 'In review', score: '79.4', updated: 'Yesterday, 02:11 PM' },
    { survey: '312/7', khasra: '312-K7', khata: '744', status: 'Verified', score: '96.1', updated: '18 Sep 2026, 11:05 AM' },
  ],
}
