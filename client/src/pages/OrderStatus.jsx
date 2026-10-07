import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatMoney } from '@shared/pricing.js'
import { Badge, ErrorBox, PageLoader } from '../components/ui.jsx'
import { api } from '../lib/api.js'

export const STATUS = {
  new: { label: 'Received', tone: 'blue', text: 'Your order has been received and is awaiting confirmation from the restaurant.' },
  confirmed: { label: 'Confirmed', tone: 'green', text: 'Your order is confirmed. We look forward to catering your event!' },
  completed: { label: 'Completed', tone: 'slate', text: 'This order is complete. Thank you for choosing BlueCilantro Catering!' },
  cancelled: { label: 'Cancelled', tone: 'red', text: 'This order was cancelled. Please contact the restaurant with any questions.' },
}

const qtyText = (i) =>
  ({ per_person: `${i.quantity} guests`, quote: `${i.quantity} guests`, per_lb: `${i.quantity} lb`, per_unit: `${i.quantity} × ${i.unitLabel || 'each'}` })[i.pricingType] ||
  `× ${i.quantity}`

export function formatEvent(order) {
  const d = new Date(`${order.eventDate}T${order.eventTime}`)
  return d.toLocaleString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function TrackForm({ initialNumber = '', error }) {
  const [number, setNumber] = useState(initialNumber)
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl">Track your order</h1>
      <p className="mt-2 text-slate-600">Enter the order number from your confirmation email or SMS.</p>
      <form
        className="card mt-6 space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(`/order/${encodeURIComponent(number.trim().toUpperCase())}`)
        }}
      >
        {error && <ErrorBox>{error}</ErrorBox>}
        <div>
          <label className="label" htmlFor="num">
            Order number
          </label>
          <input id="num" required className="input uppercase" placeholder="BC-XXXXXX" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <button className="btn-primary w-full py-3">Find my order</button>
      </form>
    </div>
  )
}

export default function OrderStatus() {
  const { orderNumber } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const email = params.get('email') || ''
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setOrder(null)
    setError('')
    // The email (added automatically after checkout) unlocks the customer's full details.
    const query = email ? `?email=${encodeURIComponent(email)}` : ''
    api(`/orders/${encodeURIComponent(orderNumber)}${query}`)
      .then(setOrder)
      .catch((e) => setError(e.status === 404 ? 'We couldn’t find an order with that number. Please check it and try again.' : e.message))
  }, [orderNumber, email])

  if (error) return <TrackForm initialNumber={orderNumber} error={error} />
  if (!order) return <PageLoader />

  const status = STATUS[order.status] || STATUS.new
  const justPlaced = location.state?.justPlaced

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {justPlaced && (
        <div className="mb-8 rounded-3xl bg-cilantro-600 p-6 text-white sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">✓</div>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">Thank you, {order.customerName.split(' ')[0]}!</h1>
          <p className="mt-2 text-cilantro-50">
            Your catering order has been sent to {order.restaurant.name}. A confirmation has been sent to <strong>{order.customerEmail}</strong> and by SMS to{' '}
            <strong>{order.customerPhone}</strong>.
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <img src={order.restaurant.logoUrl} alt="" className="h-12 w-20 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200" />
            <div>
              <p className="text-sm text-slate-500">Order</p>
              <p className="text-xl font-bold tracking-wide">{order.orderNumber}</p>
            </div>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="p-6">
          <p className="text-slate-700">{status.text}</p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Restaurant</dt>
              <dd className="font-semibold">{order.restaurant.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Event</dt>
              <dd className="font-semibold">{formatEvent(order)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Guests</dt>
              <dd className="font-semibold">{order.guestCount}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{order.fulfillmentType === 'delivery' ? 'Delivery to' : 'Fulfillment'}</dt>
              <dd className="font-semibold">
                {order.fulfillmentType === 'delivery' ? order.address || <span className="font-normal text-slate-500">Hidden for privacy</span> : 'Pickup'}
              </dd>
            </div>
          </dl>

          <h2 className="mt-8 font-bold">Items</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">
                    {i.itemName} <span className="font-normal text-slate-500">· {qtyText(i)}</span>
                  </p>
                  {i.summary && <p className="mt-0.5 text-xs text-slate-500">{i.summary}</p>}
                  {i.notes && <p className="mt-0.5 text-xs italic text-slate-500">“{i.notes}”</p>}
                </div>
                <p className="shrink-0 font-semibold">{i.pricingType === 'quote' ? 'Quote' : formatMoney(i.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Subtotal</dt>
              <dd>{formatMoney(order.subtotal)}</dd>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Delivery</dt>
                <dd>{formatMoney(order.deliveryFee)}</dd>
              </div>
            )}
            {order.gratuity > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Gratuity</dt>
                <dd>{formatMoney(order.gratuity)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-600">GST</dt>
              <dd>{formatMoney(order.tax)}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold">
              <dt>Estimated total</dt>
              <dd>{formatMoney(order.total)}</dd>
            </div>
          </dl>
          {order.hasQuoteItems && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Includes quote-only items — final pricing will be confirmed.</p>}
          {order.notes && (
            <p className="mt-4 text-sm">
              <span className="font-semibold">Notes:</span> {order.notes}
            </p>
          )}
          {order.restaurant.contactPhone && (
            <p className="mt-6 text-sm text-slate-600">
              Questions? Contact {order.restaurant.name} at <strong>{order.restaurant.contactPhone}</strong>
              {order.restaurant.contactEmail && <> or {order.restaurant.contactEmail}</>}.
            </p>
          )}
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link to="/" className="btn-outline">
          Back to restaurants
        </Link>
      </div>
    </div>
  )
}
