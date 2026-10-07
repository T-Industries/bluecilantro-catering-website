import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { describeSelection, lineTotal, orderTotals, unitPrice, validateSelection } from '../../../shared/pricing.js'
import { prisma, publicRestaurant, serializeItem, serializeOrder } from '../db.js'
import { notifyNewOrder } from '../notify/index.js'
import { eventInstant } from '../time.js'

export const publicRouter = Router()

publicRouter.get('/restaurants', async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { categories: { where: { active: true } } } } },
  })
  res.json(restaurants.map(publicRestaurant))
})

publicRouter.get('/restaurants/:slug', async (req, res) => {
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug: req.params.slug, active: true },
    include: {
      categories: {
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
        include: { items: { where: { active: true }, orderBy: { displayOrder: 'asc' } } },
      },
    },
  })
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })
  res.json({
    ...publicRestaurant(restaurant),
    categories: restaurant.categories
      .filter((c) => c.items.length)
      .map((c) => ({ ...c, items: c.items.map(serializeItem) })),
  })
})

// --- Orders -----------------------------------------------------------------

const orderSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(200),
  customerPhone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Enter a valid phone number'),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  fulfillmentType: z.enum(['delivery', 'pickup']),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  eventTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  guestCount: z.coerce.number().int().min(1).max(5000),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(100000),
        variant: z.string().max(200).optional().nullable(),
        options: z.record(z.array(z.string().max(200)).max(50)).optional().default({}),
        notes: z.string().trim().max(500).optional().or(z.literal('')),
      }),
    )
    .min(1, 'Your cart is empty')
    .max(100),
})

// Unambiguous characters (no 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newOrderNumber() {
  const bytes = crypto.randomBytes(6)
  return 'BC-' + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

// Minimal in-memory rate limit for order submissions (per IP).
const recent = new Map()
function rateLimited(ip, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter((t) => now - t < windowMs)
  hits.push(now)
  recent.set(ip, hits)
  return hits.length > limit
}

publicRouter.post('/orders', async (req, res) => {
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many orders submitted. Please try again later.' })

  const parsed = orderSchema.safeParse(req.body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return res.status(400).json({ error: `${first.path.join('.') || 'Order'}: ${first.message}`, issues: parsed.error.issues })
  }
  const data = parsed.data

  const restaurant = await prisma.restaurant.findFirst({ where: { id: data.restaurantId, active: true } })
  if (!restaurant) return res.status(400).json({ error: 'This restaurant is not accepting orders' })

  if (data.fulfillmentType === 'delivery' && !data.address) {
    return res.status(400).json({ error: 'Delivery address is required' })
  }
  if (data.fulfillmentType === 'pickup' && !restaurant.pickupAvailable) {
    return res.status(400).json({ error: 'Pickup is not available for this restaurant' })
  }

  const eventAt = eventInstant(data.eventDate, data.eventTime)
  const earliest = Date.now() + restaurant.leadTimeHours * 3600 * 1000 - 5 * 60 * 1000
  if (Number.isNaN(eventAt.getTime()) || eventAt.getTime() < earliest) {
    return res
      .status(400)
      .json({ error: `${restaurant.name} needs at least ${restaurant.leadTimeHours} hours notice for catering orders` })
  }

  // Load menu items and make sure they belong to this restaurant and are orderable.
  const ids = [...new Set(data.items.map((i) => i.menuItemId))]
  const dbItems = await prisma.menuItem.findMany({
    where: { id: { in: ids }, active: true, category: { active: true, restaurantId: restaurant.id } },
  })
  const byId = new Map(dbItems.map((i) => [i.id, serializeItem(i)]))

  const lines = []
  const errors = []
  for (const line of data.items) {
    const item = byId.get(line.menuItemId)
    if (!item) {
      errors.push('An item in your cart is no longer available. Please remove it and try again.')
      continue
    }
    const selection = { quantity: line.quantity, variant: line.variant || undefined, options: line.options || {} }
    errors.push(...validateSelection(item, selection))
    lines.push({ item, selection, notes: line.notes || null })
  }
  if (errors.length) return res.status(400).json({ error: errors[0], errors })

  const totals = orderTotals(restaurant, lines, data.fulfillmentType)

  let order
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await prisma.order.create({
        data: {
          orderNumber: newOrderNumber(),
          restaurantId: restaurant.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail.toLowerCase(),
          customerPhone: data.customerPhone,
          company: data.company || null,
          fulfillmentType: data.fulfillmentType,
          address: data.fulfillmentType === 'delivery' ? data.address : null,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          guestCount: data.guestCount,
          notes: data.notes || null,
          ...totals,
          items: {
            create: lines.map(({ item, selection, notes }) => ({
              menuItemId: item.id,
              itemName: item.name,
              pricingType: item.pricingType,
              unitLabel: item.unitLabel,
              variant: selection.variant || null,
              options: JSON.stringify(selection.options),
              summary: describeSelection(item, selection).join(' · ') || null,
              quantity: selection.quantity,
              unitPrice: unitPrice(item, selection),
              lineTotal: lineTotal(item, selection),
              notes,
            })),
          },
        },
        include: { items: true },
      })
    } catch (err) {
      if (err.code !== 'P2002') throw err // retry only on order-number collision
    }
  }

  // Send notifications before responding: serverless hosts (Vercel) stop the function
  // once the response is sent. Failures are logged on the order and never block it.
  await notifyNewOrder(order, restaurant).catch((e) => console.error('Notification failure', e))
  res.status(201).json({ orderNumber: order.orderNumber, email: order.customerEmail })
})

const maskEmail = (email) => {
  const [user, domain] = email.split('@')
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(2, user.length - 1))}@${domain}`
}
const maskPhone = (phone) => `•••-•••-${phone.replace(/\D/g, '').slice(-4)}`

// Order lookup for the confirmation/tracking page.
// Order number alone shows status, items and totals; the customer's personal details
// (surname, email, phone, address, notes) are only included when the matching email is
// also given — which the checkout confirmation page does automatically.
publicRouter.get('/orders/:orderNumber', async (req, res) => {
  if (rateLimited(`lookup:${req.ip}`, 30)) return res.status(429).json({ error: 'Too many lookups. Please try again later.' })
  const email = String(req.query.email || '').trim().toLowerCase()
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber.trim().toUpperCase() },
    include: { items: true, restaurant: true },
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  const { notificationLog, adminNotes, restaurant, ...rest } = serializeOrder(order)
  const verified = Boolean(email) && order.customerEmail === email
  const personal = verified
    ? {}
    : {
        customerName: order.customerName.split(' ')[0],
        customerEmail: maskEmail(order.customerEmail),
        customerPhone: maskPhone(order.customerPhone),
        company: null,
        address: null,
        notes: null,
      }
  res.json({
    ...rest,
    ...personal,
    detailsHidden: !verified,
    restaurant: { name: restaurant.name, slug: restaurant.slug, logoUrl: restaurant.logoUrl, contactPhone: restaurant.contactPhone, contactEmail: restaurant.contactEmail, pricingNote: restaurant.pricingNote },
  })
})
