// SMS via Twilio REST API. Without credentials, messages are printed to the console (local dev).

// Normalizes "(780) 512-1180" → "+17805121180". Returns null when it can't be a valid number.
export function toE164(phone) {
  if (!phone) return null
  const trimmed = String(phone).trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  const cc = (process.env.DEFAULT_COUNTRY_CODE || '+1').replace(/\D/g, '')
  if (digits.length === 10) return `+${cc}${digits}`
  if (digits.length === 11 && digits.startsWith(cc)) return `+${digits}`
  return null
}

export async function sendSms({ to, body }) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_MESSAGING_SERVICE_SID } = process.env
  const number = toE164(to)
  if (!number) return { channel: 'sms', to: to || '', ok: false, error: 'Invalid or missing phone number' }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !(TWILIO_FROM_NUMBER || TWILIO_MESSAGING_SERVICE_SID)) {
    console.log(`\n${'='.repeat(70)}\nSMS (Twilio not configured)\nTo: ${number}\n${'-'.repeat(70)}\n${body}\n${'='.repeat(70)}\n`)
    return { channel: 'sms', to: number, ok: true, simulated: true }
  }

  const params = new URLSearchParams({ To: number, Body: body })
  if (TWILIO_MESSAGING_SERVICE_SID) params.set('MessagingServiceSid', TWILIO_MESSAGING_SERVICE_SID)
  else params.set('From', TWILIO_FROM_NUMBER)

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000), // don't hold up checkout if the provider is slow
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('Twilio error:', data)
      return { channel: 'sms', to: number, ok: false, error: data.message || `HTTP ${res.status}` }
    }
    return { channel: 'sms', to: number, ok: true }
  } catch (err) {
    console.error('Twilio request failed:', err)
    return { channel: 'sms', to: number, ok: false, error: err.message }
  }
}
