// Pricing rules shared by the React client (live totals) and the API (authoritative totals).
//
// Menu item pricing types:
//   per_person – price × guests (e.g. "$16.95 per person")
//   per_unit   – price × quantity of a unit such as "each", "dozen", "hour" (minQty / step enforced)
//   per_lb     – price × pounds (e.g. wings "$19/lb, minimum 2 lbs")
//   fixed      – price × number of platters/trays (e.g. "Charcuterie Slab $125")
//   quote      – no online price; restaurant follows up with a quote
//
// An item may also have:
//   variants     – mutually exclusive versions that set the base price (e.g. Medium $70 / Large $130)
//   optionGroups – choices with min/max selections; each choice may add a price per unit of quantity

export const PRICING_TYPES = {
  per_person: { label: 'Per person', qtyLabel: 'Guests' },
  per_unit: { label: 'Per unit', qtyLabel: 'Quantity' },
  per_lb: { label: 'Per lb', qtyLabel: 'Pounds (lb)' },
  fixed: { label: 'Fixed price', qtyLabel: 'Quantity' },
  quote: { label: 'Request a quote', qtyLabel: 'Guests' },
}

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export const formatMoney = (n) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(n) || 0)

export function priceSuffix(item) {
  switch (item.pricingType) {
    case 'per_person':
      return '/ person'
    case 'per_unit':
      return `/ ${item.unitLabel || 'each'}`
    case 'per_lb':
      return '/ lb'
    default:
      return ''
  }
}

// Lowest price shown on menu cards ("from $x").
export function displayPrice(item) {
  if (item.pricingType === 'quote') return null
  const prices = item.variants?.length ? item.variants.map((v) => Number(v.price)) : [Number(item.price)]
  const valid = prices.filter((p) => Number.isFinite(p))
  if (!valid.length) return null
  return { amount: Math.min(...valid), from: item.variants?.length > 1 }
}

export function qtyRules(item) {
  const min = Math.max(1, Number(item.minQty) || 1)
  const step = Math.max(1, Number(item.step) || 1)
  return { min, step }
}

// Validates a selection against the item definition. Returns a list of human-readable errors.
export function validateSelection(item, selection) {
  const errors = []
  const { min, step } = qtyRules(item)
  const qty = Number(selection.quantity)

  if (!Number.isInteger(qty) || qty < min) {
    errors.push(`Minimum ${min} ${quantityNoun(item, min)} for ${item.name}`)
  } else if (step > 1 && qty % step !== 0) {
    errors.push(`${item.name} is ordered in multiples of ${step}`)
  }

  if (item.variants?.length) {
    if (!item.variants.some((v) => v.name === selection.variant)) {
      errors.push(`Please choose an option for ${item.name}`)
    }
  }

  for (const group of item.optionGroups || []) {
    const picked = selection.options?.[group.name] || []
    const unknown = picked.filter((c) => !group.choices.some((gc) => gc.name === c))
    if (unknown.length) errors.push(`Invalid choice for ${group.name}`)
    const gMin = Number(group.min) || 0
    const gMax = Number(group.max) || group.choices.length
    if (picked.length < gMin) {
      errors.push(gMin === gMax ? `Choose ${gMin} for "${group.name}"` : `Choose at least ${gMin} for "${group.name}"`)
    }
    if (picked.length > gMax) errors.push(`Choose at most ${gMax} for "${group.name}"`)
  }
  return errors
}

export function quantityNoun(item, n = 2) {
  const plural = n !== 1
  switch (item.pricingType) {
    case 'per_person':
    case 'quote':
      return plural ? 'guests' : 'guest'
    case 'per_lb':
      return 'lb'
    case 'per_unit': {
      const u = item.unitLabel || 'each'
      if (u === 'each') return plural ? 'pieces' : 'piece'
      return plural ? `${u}s` : u
    }
    default:
      return plural ? 'orders' : 'order'
  }
}

// Unit price for a selection = variant (or base) price + sum of selected choice surcharges.
export function unitPrice(item, selection) {
  if (item.pricingType === 'quote') return 0
  let base = Number(item.price) || 0
  if (item.variants?.length) {
    const v = item.variants.find((x) => x.name === selection.variant)
    base = v ? Number(v.price) || 0 : 0
  }
  let extras = 0
  for (const group of item.optionGroups || []) {
    const picked = selection.options?.[group.name] || []
    for (const name of picked) {
      const choice = group.choices.find((c) => c.name === name)
      if (choice?.price) extras += Number(choice.price)
    }
  }
  return round2(base + extras)
}

export function lineTotal(item, selection) {
  return round2(unitPrice(item, selection) * (Number(selection.quantity) || 0))
}

// Order totals. `lines` = [{ item, selection }]; restaurant carries tax/gratuity/delivery settings.
export function orderTotals(restaurant, lines, fulfillmentType = 'delivery') {
  const subtotal = round2(lines.reduce((sum, l) => sum + lineTotal(l.item, l.selection), 0))
  const deliveryFee = fulfillmentType === 'delivery' ? round2(Number(restaurant.deliveryFee) || 0) : 0
  const gratuity = round2((subtotal * (Number(restaurant.gratuityPercent) || 0)) / 100)
  const tax = round2(((subtotal + deliveryFee) * (Number(restaurant.taxPercent) || 0)) / 100)
  const total = round2(subtotal + deliveryFee + gratuity + tax)
  const hasQuoteItems = lines.some((l) => l.item.pricingType === 'quote')
  return { subtotal, deliveryFee, gratuity, tax, total, hasQuoteItems }
}

// Human-readable summary of chosen variant/options, used in cart, emails and admin.
export function describeSelection(item, selection) {
  const parts = []
  if (selection.variant) parts.push(selection.variant)
  for (const group of item.optionGroups || []) {
    const picked = selection.options?.[group.name] || []
    if (picked.length) parts.push(`${group.name}: ${picked.join(', ')}`)
  }
  return parts
}

export function formatQuantity(item, qty) {
  return `${qty} ${quantityNoun(item, qty)}`
}
