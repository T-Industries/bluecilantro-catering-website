import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { orderTotals } from '@shared/pricing.js'

const STORAGE_KEY = 'bluecilantro_cart_v1'
const CartContext = createContext(null)

// Restaurant fields the cart needs for totals and checkout rules.
const pickRestaurant = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  logoUrl: r.logoUrl,
  minGuests: r.minGuests,
  leadTimeHours: r.leadTimeHours,
  taxPercent: r.taxPercent,
  gratuityPercent: r.gratuityPercent,
  deliveryFee: r.deliveryFee,
  pickupAvailable: r.pickupAvailable,
  pricingNote: r.pricingNote,
})

const empty = { restaurant: null, lines: [], guestCount: null }

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return parsed?.lines ? { ...empty, ...parsed } : empty
  } catch {
    return empty
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(load)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {}
  }, [cart])

  // One restaurant per order: callers must check `conflictsWith` before adding.
  const addLine = useCallback((restaurant, item, selection, notes) => {
    setCart((prev) => {
      const sameRestaurant = prev.restaurant?.id === restaurant.id
      const base = sameRestaurant ? prev : { ...empty, restaurant: pickRestaurant(restaurant) }
      const line = { key: crypto.randomUUID(), item, selection, notes: notes || '' }
      const guestCount =
        base.guestCount ?? (item.pricingType === 'per_person' || item.pricingType === 'quote' ? selection.quantity : null)
      return { ...base, restaurant: pickRestaurant(restaurant), lines: [...base.lines, line], guestCount }
    })
  }, [])

  const updateLine = useCallback((key, patch) => {
    setCart((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.key === key ? { ...l, ...patch, selection: { ...l.selection, ...patch.selection } } : l)),
    }))
  }, [])

  const removeLine = useCallback((key) => {
    setCart((prev) => {
      const lines = prev.lines.filter((l) => l.key !== key)
      return lines.length ? { ...prev, lines } : empty
    })
  }, [])

  const clear = useCallback(() => setCart(empty), [])
  const setGuestCount = useCallback((n) => setCart((prev) => ({ ...prev, guestCount: n })), [])

  const value = useMemo(() => {
    const itemCount = cart.lines.length
    const totals = cart.restaurant ? orderTotals(cart.restaurant, cart.lines, 'delivery') : null
    return {
      ...cart,
      itemCount,
      totals,
      addLine,
      updateLine,
      removeLine,
      clear,
      setGuestCount,
      conflictsWith: (restaurantId) => Boolean(cart.restaurant && cart.restaurant.id !== restaurantId && cart.lines.length),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }
  }, [cart, drawerOpen, addLine, updateLine, removeLine, clear, setGuestCount])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
