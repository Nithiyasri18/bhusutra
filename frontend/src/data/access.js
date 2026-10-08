export const ROLE = {
  CITIZEN: 'Citizen',
  OFFICER: 'Officer',
  ADMIN: 'Admin',
  AUDITOR: 'Auditor',
}

const roleAliases = {
  Citizen: ROLE.CITIZEN,
  'Common Man': ROLE.CITIZEN,
  Officer: ROLE.OFFICER,
  Verifier: ROLE.OFFICER,
  'Verification Officer': ROLE.OFFICER,
  'District Officer': ROLE.OFFICER,
  Admin: ROLE.ADMIN,
  Administrator: ROLE.ADMIN,
  Auditor: ROLE.AUDITOR,
}

function normalizeRole(role) {
  return roleAliases[role] || null
}

export function getCurrentUser() {
  const id = localStorage.getItem('bhusutra_user_id')
  const role = normalizeRole(localStorage.getItem('bhusutra_role'))
  if (!id || !role) return null
  return {
    id,
    role,
    name: localStorage.getItem('bhusutra_name') || '',
    email: localStorage.getItem('bhusutra_email') || '',
    mobileNumber: localStorage.getItem('bhusutra_mobile') || '',
  }
}

export function canAccess(role, allowedRoles) {
  return allowedRoles.includes(role)
}
