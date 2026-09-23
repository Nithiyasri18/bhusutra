import { landRecords } from './records'

const mapCoordinates = {
  'BHU-2026-001': [12.7409, 77.8253],
  'BHU-2026-002': [13.1067, 80.1050],
  'BHU-2026-013': [13.0827, 80.2707],
  'BHU-2026-005': [11.0168, 76.9558],
  'BHU-2026-003': [9.9252, 78.1198],
  'BHU-2026-004': [11.6643, 78.1460],
  'BHU-2026-014': [10.7905, 78.7047],
  'BHU-2026-007': [10.7870, 79.1378],
  'BHU-2026-008': [8.7139, 77.7567],
  'BHU-2026-006': [12.9699, 79.1455],
  'BHU-2026-009': [12.8342, 79.7036],
  'BHU-2026-010': [10.4893, 77.7587],
  'BHU-2026-011': [11.4583, 77.4420],
  'BHU-2026-012': [11.3990, 79.6910],
}

export const tamilNaduMapRecords = Object.entries(mapCoordinates).map(([recordId, coordinates]) => ({
  ...landRecords.find((record) => record.id === recordId),
  coordinates,
}))