import { formatMoney } from '../../../shared/pricing.js'
import { prisma } from '../db.js'
import { sendEmail } from './email.js'
import { sendSms } from './sms.js'
import { formatEventDate } from '../time.js'

const BRAND_BLUE = '#1d4f91'
const BRAND_GREEN = '#3f8f2f'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

const qtyText = (i) => {
  switch (i.pricingType) {
    case 'per_person':
    case 'quote':
      return `${i.quantity} guests`
    case 'per_lb':
      return `${i.quantity} lb`
    case 'per_unit':
      return `${i.quantity} × ${i.unitLabel || 'each'}`
    default:
      return `× ${i.quantity}`
  }
}

const lineMoney = (i) => (i.pricingType === 'quote' ? 'Quote' : formatMoney(i.lineTotal))

function totalsRows(order) {
  const rows = [['Subtotal', formatMoney(order.subtotal)]]
  if (order.deliveryFee) rows.push(['Delivery', formatMoney(order.deliveryFee)])
  if (order.gratuity) rows.push(['Gratuity', formatMoney(order.gratuity)])
  rows.push(['Tax (GST)', formatMoney(order.tax)])
  rows.push(['Estimated Total', formatMoney(order.total)])
  return rows
}

function orderText(order, restaurant) {
  const lines = [
    `Order #${order.orderNumber} — ${restaurant.name}`,
    `Event: ${formatEventDate(order)}`,
    `Guests: ${order.guestCount}`,
    `${order.fulfillmentType === 'delivery' ? `Delivery to: ${order.address}` : 'Pickup'}`,
    '',
    `Customer: ${order.customerName}${order.company ? ` (${order.company})` : ''}`,
    `Email: ${order.customerEmail}`,
    `Phone: ${order.customerPhone}`,
    '',
    'ITEMS',
  ]
  for (const i of order.items) {
    lines.push(`- ${i.itemName} (${qtyText(i)}) ${lineMoney(i)}`)
    if (i.summary) lines.push(`    ${i.summary}`)
    if (i.notes) lines.push(`    Note: ${i.notes}`)
  }
  lines.push('')
  for (const [k, v] of totalsRows(order)) lines.push(`${k}: ${v}`)
  if (order.hasQuoteItems) lines.push('* Includes quote-only items; final pricing will be confirmed.')
  if (order.notes) lines.push('', `Notes: ${order.notes}`)
  return lines.join('\n')
}

function orderHtml(order, restaurant, { heading, intro, cta }) {
  const itemRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;vertical-align:top">
          <strong>${esc(i.itemName)}</strong> <span style="color:#666">· ${esc(qtyText(i))}</span>
          ${i.summary ? `<div style="color:#555;font-size:13px;margin-top:4px">${esc(i.summary)}</div>` : ''}
          ${i.notes ? `<div style="color:#555;font-size:13px;margin-top:4px"><em>Note: ${esc(i.notes)}</em></div>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;white-space:nowrap">${esc(lineMoney(i))}</td>
      </tr>`,
    )
    .join('')
  const totals = totalsRows(order)
    .map(
      ([k, v], idx, arr) =>
        `<tr><td style="padding:4px 0;${idx === arr.length - 1 ? 'font-weight:bold;font-size:16px' : 'color:#555'}">${esc(k)}</td><td style="padding:4px 0;text-align:right;${idx === arr.length - 1 ? 'font-weight:bold;font-size:16px' : ''}">${esc(v)}</td></tr>`,
    )
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#222">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:${BRAND_BLUE};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.85">BlueCilantro Catering</div>
      <div style="font-size:22px;font-weight:bold;margin-top:4px">${esc(heading)}</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px">
      <p style="margin-top:0">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
        <tr><td style="color:#666;padding:3px 0;width:140px">Order #</td><td><strong>${esc(order.orderNumber)}</strong></td></tr>
        <tr><td style="color:#666;padding:3px 0">Restaurant</td><td>${esc(restaurant.name)}</td></tr>
        <tr><td style="color:#666;padding:3px 0">Event</td><td>${esc(formatEventDate(order))}</td></tr>
        <tr><td style="color:#666;padding:3px 0">Guests</td><td>${esc(order.guestCount)}</td></tr>
        <tr><td style="color:#666;padding:3px 0">${order.fulfillmentType === 'delivery' ? 'Delivery to' : 'Fulfillment'}</td><td>${esc(order.fulfillmentType === 'delivery' ? order.address : 'Pickup')}</td></tr>
        <tr><td style="color:#666;padding:3px 0">Customer</td><td>${esc(order.customerName)}${order.company ? ` · ${esc(order.company)}` : ''}<br>${esc(order.customerEmail)} · ${esc(order.customerPhone)}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">${totals}</table>
      ${order.hasQuoteItems ? `<p style="font-size:13px;color:#8a5a00;background:#fff7e6;padding:10px;border-radius:8px">Includes quote-only items — final pricing will be confirmed.</p>` : ''}
      ${order.notes ? `<p style="font-size:14px"><strong>Notes:</strong> ${esc(order.notes)}</p>` : ''}
      ${cta ? `<p style="margin-top:24px"><a href="${cta.href}" style="background:${BRAND_GREEN};color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(cta.label)}</a></p>` : ''}
      ${restaurant.pricingNote ? `<p style="font-size:12px;color:#777;margin-top:24px">${esc(restaurant.pricingNote)}</p>` : ''}
    </div>
  </div></body></html>`
}

function recipients(restaurant) {
  return {
    email: restaurant.notifyEmail || process.env.OPS_NOTIFY_EMAIL || '',
    phone: restaurant.notifyPhone || process.env.OPS_NOTIFY_PHONE || '',
    opsEmail: process.env.OPS_NOTIFY_EMAIL || '',
  }
}

async function appendLog(orderId, event, results) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { notificationLog: true } })
  let log = []
  try {
    log = JSON.parse(order?.notificationLog || '[]')
  } catch {}
  log.push(...results.map((r) => ({ event, at: new Date().toISOString(), ...r })))
  await prisma.order.update({ where: { id: orderId }, data: { notificationLog: JSON.stringify(log) } })
}

// Sends admin + customer email/SMS for a new order. Never throws; results are logged on the order.
export async function notifyNewOrder(order, restaurant) {
  const to = recipients(restaurant)
  const adminLink = `${appUrl()}/admin/orders/${order.id}`
  const trackLink = `${appUrl()}/order/${order.orderNumber}`
  const text = orderText(order, restaurant)
  const adminEmails = [...new Set([to.email, to.opsEmail].filter(Boolean))]

  const jobs = [
    sendEmail({
      to: adminEmails,
      subject: `New catering order #${order.orderNumber} — ${formatEventDate(order)}`,
      text: `${text}\n\nView in admin: ${adminLink}`,
      html: orderHtml(order, restaurant, {
        heading: `New order #${order.orderNumber}`,
        intro: `A new catering order was placed for <strong>${esc(restaurant.name)}</strong>. Please review and confirm it with the customer.`,
        cta: { href: adminLink, label: 'Open in Admin' },
      }),
      replyTo: order.customerEmail,
    }),
    sendSms({
      to: to.phone,
      body: `BlueCilantro: New catering order #${order.orderNumber} for ${restaurant.name} — ${order.customerName}, ${order.guestCount} guests, ${formatEventDate(order)}. Est. ${formatMoney(order.total)}. ${adminLink}`,
    }),
    sendEmail({
      to: order.customerEmail,
      subject: `We received your catering order #${order.orderNumber}`,
      text: `Hi ${order.customerName},\n\nThank you! We've received your catering order. ${restaurant.name} will review it and contact you to confirm details and payment.\n\n${text}\n\nTrack your order: ${trackLink}`,
      html: orderHtml(order, restaurant, {
        heading: 'Thank you for your order!',
        intro: `Hi ${esc(order.customerName)}, we've received your catering order. <strong>${esc(restaurant.name)}</strong> will review it and contact you to confirm the details and payment. No payment has been taken yet.`,
        cta: { href: trackLink, label: 'View your order' },
      }),
      replyTo: restaurant.contactEmail || undefined,
    }),
    sendSms({
      to: order.customerPhone,
      body: `BlueCilantro Catering: Thanks ${order.customerName.split(' ')[0]}! Order #${order.orderNumber} with ${restaurant.name} for ${formatEventDate(order)} was received. We'll contact you to confirm. ${trackLink}`,
    }),
  ]
  const results = (await Promise.allSettled(jobs)).map((r) =>
    r.status === 'fulfilled' ? r.value : { ok: false, error: String(r.reason) },
  )
  results[0].recipient = 'restaurant'
  results[1].recipient = 'restaurant'
  results[2].recipient = 'customer'
  results[3].recipient = 'customer'
  await appendLog(order.id, 'order_placed', results).catch((e) => console.error('Failed to save notification log', e))
  return results
}

const STATUS_MESSAGES = {
  confirmed: {
    heading: 'Your order is confirmed',
    line: 'has been confirmed. We look forward to catering your event!',
  },
  completed: { heading: 'Thank you!', line: 'is complete. Thank you for choosing BlueCilantro Catering!' },
  cancelled: {
    heading: 'Your order was cancelled',
    line: 'has been cancelled. If this is unexpected, please contact us.',
  },
}

// Tells the customer when an admin confirms/cancels/completes their order.
export async function notifyStatusChange(order, restaurant) {
  const msg = STATUS_MESSAGES[order.status]
  if (!msg) return []
  const trackLink = `${appUrl()}/order/${order.orderNumber}`
  const jobs = [
    sendEmail({
      to: order.customerEmail,
      subject: `Order #${order.orderNumber}: ${msg.heading}`,
      text: `Hi ${order.customerName},\n\nYour catering order #${order.orderNumber} with ${restaurant.name} ${msg.line}\n\n${orderText(order, restaurant)}\n\n${trackLink}`,
      html: orderHtml(order, restaurant, {
        heading: msg.heading,
        intro: `Hi ${esc(order.customerName)}, your catering order with <strong>${esc(restaurant.name)}</strong> ${esc(msg.line)}`,
        cta: { href: trackLink, label: 'View your order' },
      }),
      replyTo: restaurant.contactEmail || undefined,
    }),
    sendSms({
      to: order.customerPhone,
      body: `BlueCilantro Catering: Order #${order.orderNumber} with ${restaurant.name} ${msg.line} ${trackLink}`,
    }),
  ]
  const results = (await Promise.allSettled(jobs)).map((r) =>
    r.status === 'fulfilled' ? { recipient: 'customer', ...r.value } : { recipient: 'customer', ok: false, error: String(r.reason) },
  )
  await appendLog(order.id, `status_${order.status}`, results).catch((e) => console.error('Failed to save notification log', e))
  return results
}
