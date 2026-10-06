import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './db.js'

const COOKIE = 'bc_admin'
const MAX_AGE_SECONDS = 60 * 60 * 12

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be set (32+ characters)')
  return new TextEncoder().encode(secret)
}

export async function setSession(res, user) {
  const token = await new SignJWT({ sub: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS * 1000,
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE)
}

export function publicUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

// Loads the admin from the session cookie; 401 when missing/invalid/inactive.
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE]
    if (!token) return res.status(401).json({ error: 'Not signed in' })
    const { payload } = await jwtVerify(token, secretKey())
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } })
    if (!user || !user.active) return res.status(401).json({ error: 'Not signed in' })
    req.admin = user
    next()
  } catch {
    res.status(401).json({ error: 'Session expired' })
  }
}

export function requireSuper(req, res, next) {
  if (req.admin?.role !== 'super') return res.status(403).json({ error: 'Only BlueCilantro admins can do this' })
  next()
}

// Restaurant admins may only touch their own restaurant.
export function canAccessRestaurant(admin, restaurantId) {
  return admin.role === 'super' || admin.restaurantId === restaurantId
}
