import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { canAccessRestaurant, clearSession, publicUser, requireAdmin, requireSuper, setSession } from '../auth.js'
import { prisma, serializeItem, serializeOrder } from '../db.js'
import { notifyNewOrder, notifyStatusChange } from '../notify/index.js'

export const adminRouter = Router()

// Wraps async handlers so thrown errors reach the error middleware.
const h = (fn) => (req, res, next) => fn(req, res, next).catch(next)

function parse(schema, body, res) {
  const r = schema.safeParse(body)
  if (!r.success) {
    const i = r.error.issues[0]
    res.status(400).json({ error: `${i.path.join('.') || 'Request'}: ${i.message}` })
    return null
  }
  return r.data
}

// --- Auth --------------------------------------------------------------------

const loginAttempts = new Map()

adminRouter.post(
  '/auth/login',
  h(async (req, res) => {
    const key = req.ip
    const now = Date.now()
    const attempts = (loginAttempts.get(key) || []).filter((t) => now - t < 15 * 60 * 1000)
    if (attempts.length >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })

    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const user = await prisma.adminUser.findUnique({ where: { email } })
    const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash))
    if (!ok) {
      loginAttempts.set(key, [...attempts, now])
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    loginAttempts.delete(key)
    await setSession(res, user)
    res.json(publicUser(user))
  }),
)

adminRouter.post('/auth/logout', (_req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

adminRouter.use(requireAdmin)

adminRouter.get('/auth/me', (req, res) => res.json(publicUser(req.admin)))

adminRouter.post(
  '/auth/password',
  h(async (req, res) => {
    const data = parse(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }), req.body, res)
    if (!data) return
    if (!(await bcrypt.compare(data.currentPassword, req.admin.passwordHash))) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    await prisma.adminUser.update({
      where: { id: req.admin.id },
      data: { passwordHash: await bcrypt.hash(data.newPassword, 10) },
    })
    res.json({ ok: true })
  }),
)

// Restaurants the current admin may manage.
const scope = (admin) => (admin.role === 'super' ? {} : { id: admin.restaurantId ?? '__none__' })

// --- Orders ------------------------------------------------------------------

adminRouter.get(
  '/orders',
  h(async (req, res) => {
    const { status, restaurantId, q } = req.query
    const where = { restaurant: scope(req.admin) }
    if (status && status !== 'all') where.status = String(status)
    if (restaurantId) where.restaurantId = String(restaurantId)
    if (q) {
      const term = String(q).trim()
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { customerEmail: { contains: term, mode: 'insensitive' } },
        { customerPhone: { contains: term } },
      ]
    }
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { restaurant: { select: { name: true, slug: true } }, _count: { select: { items: true } } },
    })
    const counts = await prisma.order.groupBy({
      by: ['status'],
      where: { restaurant: scope(req.admin), ...(restaurantId ? { restaurantId: String(restaurantId) } : {}) },
      _count: true,
    })
    res.json({
      orders: orders.map(({ notificationLog, ...o }) => o),
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    })
  }),
)

async function loadOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, restaurant: true },
  })
  if (!order || !canAccessRestaurant(req.admin, order.restaurantId)) {
    res.status(404).json({ error: 'Order not found' })
    return null
  }
  return order
}

adminRouter.get(
  '/orders/:id',
  h(async (req, res) => {
    const order = await loadOrder(req, res)
    if (order) res.json(serializeOrder(order))
  }),
)

adminRouter.patch(
  '/orders/:id',
  h(async (req, res) => {
    const data = parse(
      z.object({
        status: z.enum(['new', 'confirmed', 'completed', 'cancelled']).optional(),
        adminNotes: z.string().max(5000).optional(),
        notifyCustomer: z.boolean().optional(),
      }),
      req.body,
      res,
    )
    if (!data) return
    const existing = await loadOrder(req, res)
    if (!existing) return
    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: { status: data.status, adminNotes: data.adminNotes },
      include: { items: true, restaurant: true },
    })
    if (data.status && data.status !== existing.status && data.notifyCustomer !== false) {
      await notifyStatusChange(updated, updated.restaurant)
    }
    const fresh = await prisma.order.findUnique({ where: { id: existing.id }, include: { items: true, restaurant: true } })
    res.json(serializeOrder(fresh))
  }),
)

adminRouter.post(
  '/orders/:id/resend',
  h(async (req, res) => {
    const order = await loadOrder(req, res)
    if (!order) return
    const results = await notifyNewOrder(order, order.restaurant)
    res.json({ results })
  }),
)

// --- Restaurants --------------------------------------------------------------

const restaurantSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes')
    .optional(),
  name: z.string().trim().min(1).max(120).optional(),
  tagline: z.string().max(200).nullable().optional(),
  cuisine: z.string().max(200).nullable().optional(),
  description: z.string().max(3000).nullable().optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  heroUrl: z.string().max(500).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  contactName: z.string().max(120).nullable().optional(),
  contactPhone: z.string().max(40).nullable().optional(),
  contactEmail: z.string().max(200).nullable().optional(),
  notifyEmail: z.string().max(500).nullable().optional(),
  notifyPhone: z.string().max(40).nullable().optional(),
  minGuests: z.coerce.number().int().min(1).max(10000).optional(),
  leadTimeHours: z.coerce.number().int().min(0).max(24 * 60).optional(),
  taxPercent: z.coerce.number().min(0).max(100).optional(),
  gratuityPercent: z.coerce.number().min(0).max(100).optional(),
  deliveryFee: z.coerce.number().min(0).max(100000).optional(),
  pickupAvailable: z.boolean().optional(),
  pricingNote: z.string().max(2000).nullable().optional(),
  terms: z.string().max(10000).nullable().optional(),
  active: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
})

adminRouter.get(
  '/restaurants',
  h(async (req, res) => {
    const restaurants = await prisma.restaurant.findMany({
      where: scope(req.admin),
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { orders: { where: { status: 'new' } } } } },
    })
    res.json(restaurants)
  }),
)

adminRouter.post(
  '/restaurants',
  requireSuper,
  h(async (req, res) => {
    const data = parse(restaurantSchema.required({ slug: true, name: true }), req.body, res)
    if (!data) return
    const r = await prisma.restaurant.create({ data })
    res.status(201).json(r)
  }),
)

adminRouter.get(
  '/restaurants/:id',
  h(async (req, res) => {
    if (!canAccessRestaurant(req.admin, req.params.id)) return res.status(404).json({ error: 'Not found' })
    const r = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: {
        categories: { orderBy: { displayOrder: 'asc' }, include: { items: { orderBy: { displayOrder: 'asc' } } } },
      },
    })
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ...r, categories: r.categories.map((c) => ({ ...c, items: c.items.map(serializeItem) })) })
  }),
)

adminRouter.patch(
  '/restaurants/:id',
  h(async (req, res) => {
    if (!canAccessRestaurant(req.admin, req.params.id)) return res.status(404).json({ error: 'Not found' })
    const data = parse(restaurantSchema, req.body, res)
    if (!data) return
    // Only BlueCilantro admins may change the URL, visibility, or ordering of restaurants.
    if (req.admin.role !== 'super') {
      delete data.slug
      delete data.active
      delete data.displayOrder
    }
    const r = await prisma.restaurant.update({ where: { id: req.params.id }, data })
    res.json(r)
  }),
)

// --- Menu categories -------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  displayOrder: z.coerce.number().int().optional(),
  active: z.boolean().optional(),
})

async function categoryFor(req, res, id) {
  const cat = await prisma.menuCategory.findUnique({ where: { id } })
  if (!cat || !canAccessRestaurant(req.admin, cat.restaurantId)) {
    res.status(404).json({ error: 'Category not found' })
    return null
  }
  return cat
}

adminRouter.post(
  '/restaurants/:id/categories',
  h(async (req, res) => {
    if (!canAccessRestaurant(req.admin, req.params.id)) return res.status(404).json({ error: 'Not found' })
    const data = parse(categorySchema.required({ name: true }), req.body, res)
    if (!data) return
    const last = await prisma.menuCategory.aggregate({ where: { restaurantId: req.params.id }, _max: { displayOrder: true } })
    const cat = await prisma.menuCategory.create({
      data: { displayOrder: (last._max.displayOrder ?? -1) + 1, ...data, restaurantId: req.params.id },
    })
    res.status(201).json({ ...cat, items: [] })
  }),
)

adminRouter.patch(
  '/categories/:id',
  h(async (req, res) => {
    if (!(await categoryFor(req, res, req.params.id))) return
    const data = parse(categorySchema, req.body, res)
    if (!data) return
    res.json(await prisma.menuCategory.update({ where: { id: req.params.id }, data }))
  }),
)

adminRouter.delete(
  '/categories/:id',
  h(async (req, res) => {
    if (!(await categoryFor(req, res, req.params.id))) return
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  }),
)

// --- Menu items ---------------------------------------------------------------------

const choiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  price: z.coerce.number().min(0).max(100000).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
})
const itemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(3000).nullable().optional(),
  pricingType: z.enum(['per_person', 'per_unit', 'per_lb', 'fixed', 'quote']).optional(),
  price: z.coerce.number().min(0).max(100000).nullable().optional(),
  unitLabel: z.string().max(40).nullable().optional(),
  minQty: z.coerce.number().int().min(1).max(100000).optional(),
  step: z.coerce.number().int().min(1).max(1000).optional(),
  serves: z.string().max(120).nullable().optional(),
  variants: z
    .array(z.object({ name: z.string().trim().min(1).max(200), price: z.coerce.number().min(0).max(100000) }))
    .max(30)
    .optional(),
  optionGroups: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        min: z.coerce.number().int().min(0).max(100),
        max: z.coerce.number().int().min(1).max(100),
        choices: z.array(choiceSchema).min(1).max(100),
      }),
    )
    .max(20)
    .optional(),
  tags: z.string().max(200).nullable().optional(),
  badge: z.string().max(40).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
})

function toItemData(data) {
  const out = { ...data }
  if (data.variants) out.variants = JSON.stringify(data.variants)
  if (data.optionGroups) {
    for (const g of data.optionGroups) {
      if (g.min > g.max) throw Object.assign(new Error(`"${g.name}": minimum can't exceed maximum`), { status: 400 })
    }
    out.optionGroups = JSON.stringify(data.optionGroups)
  }
  return out
}

adminRouter.post(
  '/categories/:id/items',
  h(async (req, res) => {
    const cat = await categoryFor(req, res, req.params.id)
    if (!cat) return
    const data = parse(itemSchema.required({ name: true, pricingType: true }), req.body, res)
    if (!data) return
    const last = await prisma.menuItem.aggregate({ where: { categoryId: cat.id }, _max: { displayOrder: true } })
    const item = await prisma.menuItem.create({
      data: { displayOrder: (last._max.displayOrder ?? -1) + 1, ...toItemData(data), categoryId: cat.id },
    })
    res.status(201).json(serializeItem(item))
  }),
)

async function itemFor(req, res) {
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id }, include: { category: true } })
  if (!item || !canAccessRestaurant(req.admin, item.category.restaurantId)) {
    res.status(404).json({ error: 'Item not found' })
    return null
  }
  return item
}

adminRouter.patch(
  '/items/:id',
  h(async (req, res) => {
    const item = await itemFor(req, res)
    if (!item) return
    const data = parse(itemSchema, req.body, res)
    if (!data) return
    if (data.categoryId && data.categoryId !== item.categoryId) {
      const target = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } })
      if (!target || target.restaurantId !== item.category.restaurantId) {
        return res.status(400).json({ error: 'Items can only move to a category in the same restaurant' })
      }
    }
    const updated = await prisma.menuItem.update({ where: { id: item.id }, data: toItemData(data) })
    res.json(serializeItem(updated))
  }),
)

adminRouter.delete(
  '/items/:id',
  h(async (req, res) => {
    const item = await itemFor(req, res)
    if (!item) return
    await prisma.menuItem.delete({ where: { id: item.id } })
    res.json({ ok: true })
  }),
)

// --- Admin users (BlueCilantro admins only) ----------------------------------------

const userSchema = z.object({
  email: z.string().trim().email().optional(),
  name: z.string().max(120).nullable().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['super', 'restaurant']).optional(),
  restaurantId: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

adminRouter.get(
  '/users',
  requireSuper,
  h(async (_req, res) => {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      include: { restaurant: { select: { name: true } } },
    })
    res.json(users.map(publicUser))
  }),
)

adminRouter.post(
  '/users',
  requireSuper,
  h(async (req, res) => {
    const data = parse(userSchema.required({ email: true, password: true, role: true }), req.body, res)
    if (!data) return
    if (data.role === 'restaurant' && !data.restaurantId) return res.status(400).json({ error: 'Choose a restaurant' })
    const { password, ...rest } = data
    const user = await prisma.adminUser.create({
      data: {
        ...rest,
        email: rest.email.toLowerCase(),
        restaurantId: rest.role === 'super' ? null : rest.restaurantId,
        passwordHash: await bcrypt.hash(password, 10),
      },
    })
    res.status(201).json(publicUser(user))
  }),
)

adminRouter.patch(
  '/users/:id',
  requireSuper,
  h(async (req, res) => {
    const data = parse(userSchema, req.body, res)
    if (!data) return
    if (req.params.id === req.admin.id && (data.active === false || data.role === 'restaurant')) {
      return res.status(400).json({ error: "You can't deactivate or demote yourself" })
    }
    const { password, ...rest } = data
    if (rest.email) rest.email = rest.email.toLowerCase()
    if (rest.role === 'super') rest.restaurantId = null
    const user = await prisma.adminUser.update({
      where: { id: req.params.id },
      data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
    })
    res.json(publicUser(user))
  }),
)

adminRouter.delete(
  '/users/:id',
  requireSuper,
  h(async (req, res) => {
    if (req.params.id === req.admin.id) return res.status(400).json({ error: "You can't delete yourself" })
    await prisma.adminUser.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  }),
)
