// Email via SMTP2Go HTTP API. Without an API key, messages are printed to the console (local dev).
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const { SMTP2GO_API_KEY, SMTP2GO_SENDER_EMAIL, SMTP2GO_SENDER_NAME } = process.env
  const recipients = [to].flat().filter(Boolean)
  if (!recipients.length) return { channel: 'email', to: '', ok: false, error: 'No recipient' }

  if (!SMTP2GO_API_KEY) {
    console.log(`\n${'='.repeat(70)}\nEMAIL (SMTP2Go not configured)\nTo: ${recipients.join(', ')}\nSubject: ${subject}\n${'-'.repeat(70)}\n${text}\n${'='.repeat(70)}\n`)
    return { channel: 'email', to: recipients.join(', '), ok: true, simulated: true }
  }

  const sender = SMTP2GO_SENDER_NAME
    ? `${SMTP2GO_SENDER_NAME} <${SMTP2GO_SENDER_EMAIL}>`
    : SMTP2GO_SENDER_EMAIL || 'orders@bluecilantro.ca'

  try {
    const res = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      signal: AbortSignal.timeout(8000), // don't hold up checkout if the provider is slow
      headers: { 'Content-Type': 'application/json', 'X-Smtp2go-Api-Key': SMTP2GO_API_KEY },
      body: JSON.stringify({
        sender,
        to: recipients,
        subject,
        text_body: text,
        html_body: html,
        ...(replyTo ? { custom_headers: [{ header: 'Reply-To', value: replyTo }] } : {}),
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body.data?.error || body.data?.failed > 0) {
      const error = body.data?.error || body.data?.failures?.join(', ') || `HTTP ${res.status}`
      console.error('SMTP2Go error:', error)
      return { channel: 'email', to: recipients.join(', '), ok: false, error }
    }
    return { channel: 'email', to: recipients.join(', '), ok: true }
  } catch (err) {
    console.error('SMTP2Go request failed:', err)
    return { channel: 'email', to: recipients.join(', '), ok: false, error: err.message }
  }
}
