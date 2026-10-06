import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatMoney } from '@shared/pricing.js'
import { Badge, ConfirmDialog, ErrorBox, PageLoader } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { STATUS, formatEvent } from '../pages/OrderStatus.jsx'

const ACTIONS = {
  new: [
    { to: 'confirmed', label: 'Confirm order', cls: 'btn-green' },
    { to: 'cancelled', label: 'Cancel order', cls: 'btn-outline text-red-600' },
  ],
  confirmed: [
    { to: 'completed', label: 'Mark completed', cls: 'btn-primary' },
    { to: 'cancelled', label: 'Cancel order', cls: 'btn-outline text-red-600' },
  ],
  completed: [{ to: 'confirmed', label: 'Reopen', cls: 'btn-outline' }],
  cancelled: [{ to: 'new', label: 'Reopen', cls: 'btn-outline' }],
}

const qtyText = (i) =>
  ({ per_person: `${i.quantity} guests`, quote: `${i.quantity} guests`, per_lb: `${i.quantity} lb`, per_unit: `${i.quantity} × ${i.unitLabel || 'each'}` })[i.pricingType] ||
  `× ${i.quantity}`

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null)
  const [notify, setNotify] = useState(true)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/admin/orders/${id}`)
      .then((o) => {
        setOrder(o)
        setNotes(o.adminNotes || '')
      })
      .catch((e) => setError(e.message))
  }, [id])

  const patch = async (body, msg) => {
    setBusy(true)
    setError('')
    try {
      const o = await api(`/admin/orders/${id}`, { method: 'PATCH', body })
      setOrder(o)
      setSaved(msg)
      setTimeout(() => setSaved(''), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setBusy(true)
    try {
      await api(`/admin/orders/${id}/resend`, { method: 'POST' })
      setOrder(await api(`/admin/orders/${id}`))
      setSaved('Notifications re-sent')
      setTimeout(() => setSaved(''), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (error && !order) return <ErrorBox>{error}</ErrorBox>
  if (!order) return <PageLoader />
  const status = STATUS[order.status]

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:underline">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIONS[order.status].map((a) => (
            <button key={a.to} className={a.cls} disabled={busy} onClick={() => setPending(a)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {saved && <p className="mt-3 text-sm font-medium text-cilantro-700">✓ {saved}</p>}
      {error && (
        <div className="mt-3">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-bold">Event</h2>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Date & time</dt>
                <dd className="font-semibold">{formatEvent(order)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Guests</dt>
                <dd className="font-semibold">{order.guestCount}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Restaurant</dt>
                <dd className="font-semibold">{order.restaurant.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{order.fulfillmentType === 'delivery' ? 'Delivery address' : 'Fulfillment'}</dt>
                <dd className="font-semibold">{order.fulfillmentType === 'delivery' ? order.address : 'Pickup'}</dd>
              </div>
            </dl>
            {order.notes && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm">
                <p className="font-semibold text-amber-900">Customer notes</p>
                <p className="mt-1 whitespace-pre-line text-amber-900">{order.notes}</p>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="font-bold">Items</h2>
            <ul className="mt-2 divide-y divide-slate-100">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      {i.itemName} <span className="font-normal text-slate-500">· {qtyText(i)}</span>
                    </p>
                    {i.summary && <p className="mt-0.5 text-slate-600">{i.summary}</p>}
                    {i.notes && <p className="mt-0.5 italic text-slate-500">Note: {i.notes}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{i.pricingType === 'quote' ? 'Quote' : formatMoney(i.lineTotal)}</p>
                    {i.pricingType !== 'quote' && <p className="text-xs text-slate-500">{formatMoney(i.unitPrice)} ea.</p>}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              {[
                ['Subtotal', order.subtotal],
                ['Delivery', order.deliveryFee],
                ['Gratuity', order.gratuity],
                ['GST', order.tax],
              ]
                .filter(([k, v]) => v > 0 || k === 'Subtotal' || k === 'GST')
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-slate-600">{k}</dt>
                    <dd>{formatMoney(v)}</dd>
                  </div>
                ))}
              <div className="flex justify-between pt-2 text-base font-bold">
                <dt>Estimated total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
            {order.hasQuoteItems && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Contains quote-only items — send the customer a final quote.</p>}
          </section>

          <section className="card p-6">
            <h2 className="font-bold">Internal notes</h2>
            <textarea rows={4} className="input mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visible to admins only" />
            <button className="btn-outline mt-3" disabled={busy || notes === (order.adminNotes || '')} onClick={() => patch({ adminNotes: notes }, 'Notes saved')}>
              Save notes
            </button>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6 text-sm">
            <h2 className="font-bold">Customer</h2>
            <p className="mt-3 font-semibold">{order.customerName}</p>
            {order.company && <p className="text-slate-600">{order.company}</p>}
            <p className="mt-2">
              <a className="text-brand-700 hover:underline" href={`mailto:${order.customerEmail}`}>
                {order.customerEmail}
              </a>
            </p>
            <p>
              <a className="text-brand-700 hover:underline" href={`tel:${order.customerPhone}`}>
                {order.customerPhone}
              </a>
            </p>
            <p className="mt-3 text-xs text-slate-500">Placed {new Date(order.createdAt).toLocaleString('en-CA')}</p>
          </section>

          <section className="card p-6 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Notifications</h2>
              <button className="text-xs font-semibold text-brand-600 hover:underline" disabled={busy} onClick={resend}>
                Re-send
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {order.notificationLog.length === 0 && <li className="text-slate-500">Sending…</li>}
              {order.notificationLog.map((n, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={n.ok ? 'text-cilantro-600' : 'text-red-600'}>{n.ok ? '✓' : '✕'}</span>
                  <span className="min-w-0">
                    <span className="font-medium uppercase">{n.channel}</span> → {n.recipient}
                    <span className="block truncate text-xs text-slate-500">
                      {n.to || '—'} · {n.event.replace('_', ' ')}
                      {n.simulated && ' · logged (not configured)'}
                    </span>
                    {n.error && <span className="block text-xs text-red-600">{n.error}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {order.notificationLog.some((n) => !n.ok && n.recipient === 'restaurant') && (
              <p className="mt-3 text-xs text-slate-500">
                Set the restaurant’s notification email and phone in{' '}
                <Link className="text-brand-600 hover:underline" to={`/admin/restaurants/${order.restaurantId}?tab=settings`}>
                  restaurant settings
                </Link>
                .
              </p>
            )}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.label}
        message={
          <>
            Change order {order.orderNumber} to <strong>{STATUS[pending?.to]?.label}</strong>?
            {['confirmed', 'completed', 'cancelled'].includes(pending?.to) && (
              <label className="mt-4 flex items-center gap-2 text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                Email & SMS the customer
              </label>
            )}
          </>
        }
        confirmLabel={pending?.label}
        tone={pending?.to === 'cancelled' ? 'danger' : 'primary'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const to = pending.to
          setPending(null)
          patch({ status: to, notifyCustomer: notify }, `Order ${STATUS[to].label.toLowerCase()}`)
        }}
      />
    </div>
  )
}
