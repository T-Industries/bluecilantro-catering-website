import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Menu items store variants/option groups as JSON strings; expose them as arrays.
export function serializeItem(item) {
  return {
    ...item,
    variants: parseJson(item.variants, []),
    optionGroups: parseJson(item.optionGroups, []),
  }
}

export function serializeOrder(order) {
  return {
    ...order,
    notificationLog: parseJson(order.notificationLog, []),
    items: order.items?.map((i) => ({ ...i, options: parseJson(i.options, {}) })),
  }
}

// Fields safe to show publicly (hides notification recipients).
export function publicRestaurant(r) {
  const { notifyEmail, notifyPhone, ...rest } = r
  return rest
}
