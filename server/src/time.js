// Event dates/times are entered as local wall-clock time where the restaurants are
// (Alberta). Servers — Vercel in particular — run in UTC, so convert explicitly.
export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'America/Edmonton'

// Offset (ms) of `timeZone` from UTC at the given instant.
function zoneOffset(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  )
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - instant.getTime()
}

// "2026-10-15" + "12:00" in the business timezone → the real instant (Date).
export function eventInstant(date, time, timeZone = BUSINESS_TIMEZONE) {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = (time || '00:00').split(':').map(Number)
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm)
  if (Number.isNaN(wallAsUtc)) return new Date(NaN)
  // Two passes handle the hour around daylight-saving changes.
  let instant = new Date(wallAsUtc - zoneOffset(new Date(wallAsUtc), timeZone))
  instant = new Date(wallAsUtc - zoneOffset(instant, timeZone))
  return instant
}

// Human-readable event date/time, always shown in the business timezone.
export function formatEventDate({ eventDate, eventTime }) {
  const instant = eventInstant(eventDate, eventTime)
  if (Number.isNaN(instant.getTime())) return `${eventDate} ${eventTime}`
  return instant.toLocaleString('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
