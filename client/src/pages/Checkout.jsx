import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatMoney, orderTotals, validateSelection } from '@shared/pricing.js'
import { CartLine } from '../components/CartDrawer.jsx'
import { ErrorBox } from '../components/ui.jsx'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../lib/api.js'

const pad = (n) => String(n).padStart(2, '0')
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const TIMES = []
for (let h = 6; h <= 22; h++) for (const m of [0, 30]) TIMES.push(`${pad(h)}:${pad(m)}`)
const timeLabel = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

function Field({ label, id, error, children, optional }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function Checkout() {
  const cart = useCart()
  const navigate = useNavigate()
  const { restaurant, lines } = cart

  const [form, setForm] = useState(() => ({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    company: '',
    fulfillmentType: 'delivery',
    address: '',
    eventDate: '',
    eventTime: '12:00',
    guestCount: cart.guestCount || restaurant?.minGuests || 10,
    notes: '',
  }))
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const earliest = useMemo(() => new Date(Date.now() + (restaurant?.leadTimeHours || 0) * 3600 * 1000), [restaurant])
  const totals = restaurant ? orderTotals(restaurant, lines, form.fulfillmentType) : null

  if (!restaurant || !lines.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-slate-600">Add items from a restaurant menu to place a catering order.</p>
        <Link to="/" className="btn-primary mt-6">
          Browse restaurants
        </Link>
      </div>
    )
  }

  const validate = () => {
    const e = {}
    if (form.customerName.trim().length < 2) e.customerName = 'Please enter your full name'
    if (!/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) e.customerEmail = 'Please enter a valid email'
    if (form.customerPhone.replace(/\D/g, '').length < 10) e.customerPhone = 'Please enter a valid phone number'
    if (form.fulfillmentType === 'delivery' && form.address.trim().length < 5) e.address = 'Please enter the delivery address'
    if (!form.eventDate) e.eventDate = 'Choose your event date'
    else if (new Date(`${form.eventDate}T${form.eventTime}`) < earliest) {
      e.eventDate = `Please allow at least ${restaurant.leadTimeHours} hours notice`
    }
    if (!(Number(form.guestCount) >= 1)) e.guestCount = 'Enter the number of guests'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const lineErrors = lines.flatMap((l) => validateSelection(l.item, l.selection))

  const submit = async (ev) => {
    ev.preventDefault()
    setError('')
    if (!validate() || lineErrors.length) return
    setSubmitting(true)
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: {
          ...form,
          restaurantId: restaurant.id,
          guestCount: Number(form.guestCount),
          items: lines.map((l) => ({
            menuItemId: l.item.id,
            quantity: l.selection.quantity,
            variant: l.selection.variant,
            options: l.selection.options,
            notes: l.notes,
          })),
        },
      })
      cart.clear()
      navigate(`/order/${res.orderNumber}?email=${encodeURIComponent(res.email)}`, { state: { justPlaced: true } })
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
      <p className="mt-1 text-slate-600">
        Ordering from <strong>{restaurant.name}</strong>. No payment is taken now — the restaurant will confirm your order and arrange payment.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-bold">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="name" error={fieldErrors.customerName}>
                <input id="name" className="input" autoComplete="name" value={form.customerName} onChange={set('customerName')} />
              </Field>
              <Field label="Company" id="company" optional>
                <input id="company" className="input" autoComplete="organization" value={form.company} onChange={set('company')} />
              </Field>
              <Field label="Email" id="email" error={fieldErrors.customerEmail}>
                <input id="email" type="email" className="input" autoComplete="email" value={form.customerEmail} onChange={set('customerEmail')} />
              </Field>
              <Field label="Mobile phone" id="phone" error={fieldErrors.customerPhone}>
                <input id="phone" type="tel" className="input" autoComplete="tel" placeholder="(780) 555-0123" value={form.customerPhone} onChange={set('customerPhone')} />
              </Field>
            </div>
            <p className="mt-3 text-xs text-slate-500">We’ll send your order confirmation and updates by email and SMS.</p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-bold">Event details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Event date" id="date" error={fieldErrors.eventDate}>
                <input id="date" type="date" className="input" min={toDateInput(earliest)} value={form.eventDate} onChange={set('eventDate')} />
              </Field>
              <Field label={form.fulfillmentType === 'delivery' ? 'Delivery time' : 'Pickup time'} id="time">
                <select id="time" className="input" value={form.eventTime} onChange={set('eventTime')}>
                  {TIMES.map((t) => (
                    <option key={t} value={t}>
                      {timeLabel(t)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Number of guests" id="guests" error={fieldErrors.guestCount}>
                <input id="guests" type="number" min={1} className="input" value={form.guestCount} onChange={set('guestCount')} />
              </Field>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {restaurant.name} requires at least {restaurant.leadTimeHours} hours notice.
            </p>

            <div className="mt-6">
              <p className="label">Delivery or pickup</p>
              <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                {['delivery', 'pickup'].map((t) => (
                  <label
                    key={t}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${form.fulfillmentType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'} ${t === 'pickup' && !restaurant.pickupAvailable ? 'pointer-events-none opacity-40' : ''}`}
                  >
                    <input type="radio" className="sr-only" name="fulfillment" value={t} checked={form.fulfillmentType === t} onChange={set('fulfillmentType')} disabled={t === 'pickup' && !restaurant.pickupAvailable} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            {form.fulfillmentType === 'delivery' && (
              <div className="mt-4">
                <Field label="Delivery address" id="address" error={fieldErrors.address}>
                  <input id="address" className="input" autoComplete="street-address" placeholder="Street, city, postal code" value={form.address} onChange={set('address')} />
                </Field>
              </div>
            )}
            <div className="mt-4">
              <Field label="Order notes" id="notes" optional>
                <textarea id="notes" rows={3} className="input" maxLength={2000} placeholder="Dietary needs, setup instructions, staffing, on-site contact…" value={form.notes} onChange={set('notes')} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <img src={restaurant.logoUrl} alt="" className="h-10 w-16 rounded-lg bg-white object-contain p-1 ring-1 ring-slate-200" />
              <div>
                <h2 className="font-bold">{restaurant.name}</h2>
                <button type="button" onClick={cart.openDrawer} className="text-xs font-medium text-brand-600 hover:underline">
                  Edit cart
                </button>
              </div>
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              {lines.map((l) => (
                <CartLine key={l.key} line={l} compact />
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Subtotal</dt>
                <dd className="font-medium">{formatMoney(totals.subtotal)}</dd>
              </div>
              {form.fulfillmentType === 'delivery' && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Delivery</dt>
                  <dd className="font-medium">{totals.deliveryFee ? formatMoney(totals.deliveryFee) : 'Confirmed by restaurant'}</dd>
                </div>
              )}
              {totals.gratuity > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Gratuity ({restaurant.gratuityPercent}%)</dt>
                  <dd className="font-medium">{formatMoney(totals.gratuity)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">GST ({restaurant.taxPercent}%)</dt>
                <dd className="font-medium">{formatMoney(totals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-bold">Estimated total</dt>
                <dd className="font-bold">{formatMoney(totals.total)}</dd>
              </div>
            </dl>
            {totals.hasQuoteItems && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Includes quote-only items. The restaurant will confirm final pricing.</p>
            )}
            {restaurant.pricingNote && <p className="mt-3 text-xs text-slate-500">{restaurant.pricingNote}</p>}
            {lineErrors.length > 0 && <p className="mt-3 text-sm text-red-600">{lineErrors[0]}</p>}
            {error && (
              <div className="mt-4">
                <ErrorBox>{error}</ErrorBox>
              </div>
            )}
            <button type="submit" disabled={submitting || lineErrors.length > 0} className="btn-green mt-5 w-full py-3.5 text-base">
              {submitting ? 'Placing order…' : 'Place catering order'}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">You won’t be charged now.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}
