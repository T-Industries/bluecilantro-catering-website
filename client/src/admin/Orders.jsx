import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatMoney } from '@shared/pricing.js'
import { Badge, ErrorBox, Spinner } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { STATUS } from '../pages/OrderStatus.jsx'
import { useAdmin } from './AdminLayout.jsx'

const TABS = ['new', 'confirmed', 'completed', 'cancelled', 'all']

export const eventLabel = (o) =>
  new Date(`${o.eventDate}T${o.eventTime}`).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Orders() {
  const { user } = useAdmin()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'new'
  const restaurantId = params.get('restaurant') || ''
  const [q, setQ] = useState(params.get('q') || '')
  const [data, setData] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (user.role === 'super') api('/admin/restaurants').then(setRestaurants).catch(() => {})
  }, [user.role])

  useEffect(() => {
    setData(null)
    const qs = new URLSearchParams({ status, ...(restaurantId && { restaurantId }), ...(params.get('q') && { q: params.get('q') }) })
    api(`/admin/orders?${qs}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [status, restaurantId, params])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    setParams(next)
  }

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-slate-500">Review, confirm and track catering orders.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            update({ q: q.trim() })
          }}
        >
          <input className="input w-60" placeholder="Search order #, name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-outline">Search</button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => update({ status: t })}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${status === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
          >
            {t === 'all' ? 'All' : STATUS[t].label}
            <span className="ml-1.5 opacity-70">{data ? (t === 'all' ? total : data.counts[t] || 0) : ''}</span>
          </button>
        ))}
        {user.role === 'super' && (
          <select className="input ml-auto w-auto" value={restaurantId} onChange={(e) => update({ restaurant: e.target.value })} aria-label="Filter by restaurant">
            <option value="">All restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-6">
        <ErrorBox>{error}</ErrorBox>
        {!data && !error && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {data && !data.orders.length && <div className="card p-12 text-center text-slate-500">No orders here yet.</div>}
        {data && data.orders.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Customer</th>
                  {user.role === 'super' && <th className="px-4 py-3">Restaurant</th>}
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-bold text-brand-700 hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{eventLabel(o)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-slate-500">{o.customerPhone}</p>
                    </td>
                    {user.role === 'super' && <td className="px-4 py-3">{o.restaurant.name}</td>}
                    <td className="px-4 py-3">{o.guestCount}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatMoney(o.total)}
                      {o.hasQuoteItems && <span className="block text-xs font-normal text-amber-700">+ quote</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS[o.status]?.tone}>{STATUS[o.status]?.label || o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
