// Contact-detail validation shared by the React client (instant feedback) and the API (enforced).

// North American (Canada/US) phone numbers: 10 digits, optionally prefixed by 1 or +1.
// Area code and exchange can't start with 0/1 or be an N11 service code (e.g. 911, 411).
// Returns { e164: '+17805550123', display: '(780) 555-0123' } or null when invalid.
export function normalizePhone(input) {
  const raw = String(input ?? '').trim()
  if (!raw || /[^\d\s().+-]/.test(raw)) return null
  if (raw.includes('+') && !/^\+1[\s().-]*\d/.test(raw)) return null // only +1 country code
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  if (digits.length !== 10) return null
  const area = digits.slice(0, 3)
  const exchange = digits.slice(3, 6)
  const isN11 = (code) => code[1] === '1' && code[2] === '1'
  if (!/[2-9]/.test(area[0]) || !/[2-9]/.test(exchange[0]) || isN11(area) || isN11(exchange)) return null
  return { e164: `+1${digits}`, display: `(${area}) ${exchange}-${digits.slice(6)}` }
}

const LABEL = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?'
const EMAIL_RE = new RegExp(`^[A-Za-z0-9!#$%&'*+/=?^_\`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_\`{|}~-]+)*@(?:${LABEL}\\.)+[A-Za-z]{2,24}$`)

// Practical email check: name@domain.tld, no spaces or consecutive dots, sensible length.
export function isValidEmail(input) {
  const email = String(input ?? '').trim()
  if (email.length > 254) return false
  const at = email.lastIndexOf('@')
  if (at < 1 || at > 64) return false
  return EMAIL_RE.test(email)
}

export const PHONE_ERROR = 'Enter a valid 10-digit Canadian or US phone number, e.g. (780) 555-0123'
export const EMAIL_ERROR = 'Enter a valid email address, e.g. name@example.com'
