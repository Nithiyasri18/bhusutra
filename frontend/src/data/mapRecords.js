import { landRecords } from './records'

const mapCoordinates = {
  'BHU-2026-013': [13.0827, 80.2707],
  'BHU-2026-005': [11.0168, 76.9558],
  'BHU-2026-003': [9.9252, 78.1198],
  'BHU-2026-004': [11.6643, 78.1460],
  'BHU-2026-014': [10.7905, 78.7047],
  'BHU-2026-007': [10.7870, 79.1378],
  'BHU-2026-008': [8.7139, 77.7567],
}

export const tamilNaduMapRecords = Object.entries(mapCoordinates).map(([recordId, coordinates]) => ({
  ...landRecords.find((record) => record.id === recordId),
  coordinates,
}))