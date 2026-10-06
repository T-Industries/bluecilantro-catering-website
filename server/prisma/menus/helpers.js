// Small builders that keep the menu transcriptions readable.

export const choices = (...names) => names.map((n) => (typeof n === 'string' ? { name: n } : n))

export const group = (name, min, max, list) => ({ name, min, max, choices: choices(...list) })

export const perPerson = (name, price, extra = {}) => ({ name, pricingType: 'per_person', price, ...extra })

export const perUnit = (name, price, unitLabel, extra = {}) => ({
  name,
  pricingType: 'per_unit',
  price,
  unitLabel,
  ...extra,
})

export const perLb = (name, price, extra = {}) => ({ name, pricingType: 'per_lb', price, unitLabel: 'lb', ...extra })

export const fixed = (name, price, extra = {}) => ({ name, pricingType: 'fixed', price, unitLabel: 'order', ...extra })

export const quote = (name, extra = {}) => ({ name, pricingType: 'quote', price: null, ...extra })
