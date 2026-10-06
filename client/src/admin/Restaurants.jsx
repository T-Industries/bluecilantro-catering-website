import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { displayPrice, formatMoney, priceSuffix } from '@shared/pricing.js'
import { Badge, ConfirmDialog, ErrorBox, Modal, PageLoader, CloseButton } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { useAdmin } from './AdminLayout.jsx'
import ItemEditor from './ItemEditor.jsx'

export function RestaurantList() {
  const { user } = useAdmin()
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api('/admin/restaurants').then(setList).catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!list) return <PageLoader />
  if (user.role !== 'super' && list.length === 1) return <Navigate to={`/admin/restaurants/${list[0].id}`} replace />

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurants & Menus</h1>
          <p className="text-sm text-slate-500">Edit menus, prices, notification contacts and catering rules.</p>
        </div>
        {user.role === 'super' && (
          <button className="btn-primary" onClick={() => setCreating(true)}>
            + New restaurant
          </button>
        )}
      </div>
      {!list.length && <div className="card mt-6 p-10 text-center text-slate-500">No restaurant is linked to your account.</div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.map((r) => (
          <Link key={r.id} to={`/admin/restaurants/${r.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-white p-2 ring-1 ring-slate-200">
              {r.logoUrl && <img src={r.logoUrl} alt="" className="max-h-full max-w-full object-contain" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{r.name}</p>
              <p className="truncate text-sm text-slate-500">/{r.slug}</p>
              <div className="mt-1 flex gap-2">
                {!r.active && <Badge tone="slate">Hidden</Badge>}
                {r._count.orders > 0 && <Badge tone="blue">{r._count.orders} new orders</Badge>}
                {!r.notifyEmail && !r.notifyPhone && <Badge tone="amber">No notification contact</Badge>}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <NewRestaurantModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function NewRestaurantModal({ open, onClose }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  if (created) return <Navigate to={`/admin/restaurants/${created}?tab=settings`} />
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <form
        className="p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            const r = await api('/admin/restaurants', { method: 'POST', body: { name, slug, active: false } })
            setCreated(r.id)
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <h2 className="text-lg font-bold">New restaurant</h2>
        <p className="mt-1 text-sm text-slate-500">It stays hidden until you make it visible in settings.</p>
        <label className="label mt-4">Name</label>
        <input
          required
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSlug(e.target.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
          }}
        />
        <label className="label mt-4">URL slug</label>
        <input required className="input" value={slug} onChange={(e) => setSlug(e.target.value)} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">Create</button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------------

export function RestaurantEditor() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'menu'
  const [restaurant, setRestaurant] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => api(`/admin/restaurants/${id}`).then(setRestaurant).catch((e) => setError(e.message)), [id])
  useEffect(() => {
    reload()
  }, [reload])

  if (error && !restaurant) return <ErrorBox>{error}</ErrorBox>
  if (!restaurant) return <PageLoader />

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/restaurants" className="text-sm font-medium text-brand-600 hover:underline">
        ← Restaurants
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {restaurant.logoUrl && <img src={restaurant.logoUrl} alt="" className="h-12 w-20 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200" />}
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          {!restaurant.active && <Badge tone="slate">Hidden</Badge>}
        </div>
        <a href={`/restaurant/${restaurant.slug}`} target="_blank" rel="noreferrer" className="btn-outline">
          View live menu ↗
        </a>
      </div>
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {['menu', 'settings'].map((t) => (
          <button
            key={t}
            onClick={() => setParams({ tab: t })}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold capitalize ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'menu' ? <MenuEditor restaurant={restaurant} reload={reload} /> : <RestaurantSettings restaurant={restaurant} onSaved={setRestaurant} />}
      </div>
    </div>
  )
}

function MenuEditor({ restaurant, reload }) {
  const [editing, setEditing] = useState(null) // { item?, categoryId }
  const [catModal, setCatModal] = useState(null) // { category? }
  const [confirm, setConfirm] = useState(null)
  const [error, setError] = useState('')
  const cats = restaurant.categories

  const run = async (fn) => {
    setError('')
    try {
      await fn()
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  // Move a category/item one place and renumber the list so display orders stay contiguous.
  const move = (list, index, dir, path) =>
    run(async () => {
      if (!list[index + dir]) return
      const next = [...list]
      ;[next[index], next[index + dir]] = [next[index + dir], next[index]]
      await Promise.all(
        next.map((x, i) => (x.displayOrder === i ? null : api(`${path}/${x.id}`, { method: 'PATCH', body: { displayOrder: i } }))),
      )
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {cats.length} categories · {cats.reduce((n, c) => n + c.items.length, 0)} items
        </p>
        <button className="btn-primary" onClick={() => setCatModal({})}>
          + Add category
        </button>
      </div>
      <ErrorBox>{error}</ErrorBox>

      {cats.map((c, ci) => (
        <section key={c.id} className={`card overflow-hidden ${c.active ? '' : 'opacity-60'}`}>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">
                {c.name} {!c.active && <Badge tone="slate">Hidden</Badge>}
              </h2>
              {c.description && <p className="truncate text-xs text-slate-500">{c.description}</p>}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <button className="btn-ghost px-2 py-1" disabled={ci === 0} onClick={() => move(cats, ci, -1, '/admin/categories')} aria-label="Move category up">
                ↑
              </button>
              <button className="btn-ghost px-2 py-1" disabled={ci === cats.length - 1} onClick={() => move(cats, ci, 1, '/admin/categories')} aria-label="Move category down">
                ↓
              </button>
              <button className="btn-ghost px-3 py-1" onClick={() => setCatModal({ category: c })}>
                Edit
              </button>
              <button
                className="btn-ghost px-3 py-1 text-red-600"
                onClick={() =>
                  setConfirm({
                    title: `Delete “${c.name}”?`,
                    message: `This deletes the category and its ${c.items.length} items. Past orders are not affected.`,
                    action: () => api(`/admin/categories/${c.id}`, { method: 'DELETE' }),
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {c.items.map((item, ii) => {
              const p = displayPrice(item)
              return (
                <li key={item.id} className={`flex items-center gap-3 px-4 py-3 ${item.active ? '' : 'bg-slate-50 text-slate-400'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {item.name} {!item.active && <span className="text-xs">(hidden)</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.pricingType === 'quote' ? 'Quote' : p ? `${p.from ? 'from ' : ''}${formatMoney(p.amount)} ${priceSuffix(item)}` : '—'}
                      {item.optionGroups.length > 0 && ` · ${item.optionGroups.length} choice group${item.optionGroups.length > 1 ? 's' : ''}`}
                      {item.minQty > 1 && ` · min ${item.minQty}`}
                    </p>
                  </div>
                  <button className="btn-ghost px-2 py-1" disabled={ii === 0} onClick={() => move(c.items, ii, -1, '/admin/items')} aria-label="Move item up">
                    ↑
                  </button>
                  <button className="btn-ghost px-2 py-1" disabled={ii === c.items.length - 1} onClick={() => move(c.items, ii, 1, '/admin/items')} aria-label="Move item down">
                    ↓
                  </button>
                  <button
                    className="btn-ghost px-3 py-1 text-sm"
                    onClick={() => run(() => api(`/admin/items/${item.id}`, { method: 'PATCH', body: { active: !item.active } }))}
                  >
                    {item.active ? 'Hide' : 'Show'}
                  </button>
                  <button className="btn-outline px-3 py-1 text-sm" onClick={() => setEditing({ item, categoryId: c.id })}>
                    Edit
                  </button>
                  <button
                    className="btn-ghost px-2 py-1 text-red-600"
                    aria-label={`Delete ${item.name}`}
                    onClick={() =>
                      setConfirm({
                        title: `Delete “${item.name}”?`,
                        message: 'Past orders keep their copy of this item.',
                        action: () => api(`/admin/items/${item.id}`, { method: 'DELETE' }),
                      })
                    }
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="px-4 py-3">
            <button className="text-sm font-semibold text-brand-600 hover:underline" onClick={() => setEditing({ categoryId: c.id })}>
              + Add item to {c.name}
            </button>
          </div>
        </section>
      ))}

      <ItemEditor
        open={Boolean(editing)}
        item={editing?.item}
        categoryId={editing?.categoryId}
        categories={cats}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing.item) await api(`/admin/items/${editing.item.id}`, { method: 'PATCH', body: data })
          else await api(`/admin/categories/${data.categoryId}/items`, { method: 'POST', body: data })
          setEditing(null)
          await reload()
        }}
      />

      <CategoryModal
        state={catModal}
        onClose={() => setCatModal(null)}
        onSave={async (data) => {
          if (catModal.category) await api(`/admin/categories/${catModal.category.id}`, { method: 'PATCH', body: data })
          else await api(`/admin/restaurants/${restaurant.id}/categories`, { method: 'POST', body: data })
          setCatModal(null)
          await reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm.action
          setConfirm(null)
          run(action)
        }}
      />
    </div>
  )
}

function CategoryModal({ state, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', active: true })
  const [error, setError] = useState('')
  useEffect(() => {
    if (state) {
      const c = state.category
      setForm({ name: c?.name || '', description: c?.description || '', imageUrl: c?.imageUrl || '', active: c?.active ?? true })
      setError('')
    }
  }, [state])
  return (
    <Modal open={Boolean(state)} onClose={onClose} size="sm">
      <form
        className="p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await onSave({ ...form, description: form.description || null, imageUrl: form.imageUrl || null })
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{state?.category ? 'Edit category' : 'New category'}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <label className="label mt-4">Name</label>
        <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label className="label mt-4">Description</label>
        <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="label mt-4">Banner image URL</label>
        <input className="input" placeholder="/images/menu/…jpg" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <label className="mt-4 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Visible on menu
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------------

const SETTINGS_FIELDS = [
  { section: 'Listing' },
  { k: 'name', label: 'Name', required: true },
  { k: 'slug', label: 'URL slug', superOnly: true },
  { k: 'tagline', label: 'Tagline' },
  { k: 'cuisine', label: 'Cuisine tags (comma separated)' },
  { k: 'description', label: 'Description', textarea: true, wide: true },
  { k: 'logoUrl', label: 'Logo URL' },
  { k: 'heroUrl', label: 'Card / banner image URL' },
  { section: 'Order notifications', help: 'Who receives an email and SMS for every new order. Separate several emails with commas.' },
  { k: 'notifyEmail', label: 'Notification email(s)' },
  { k: 'notifyPhone', label: 'Notification mobile (SMS)' },
  { section: 'Public contact' },
  { k: 'contactName', label: 'Contact name' },
  { k: 'contactPhone', label: 'Contact phone' },
  { k: 'contactEmail', label: 'Contact email' },
  { k: 'address', label: 'Address / service area' },
  { section: 'Ordering rules' },
  { k: 'minGuests', label: 'Minimum guests', type: 'number' },
  { k: 'leadTimeHours', label: 'Notice required (hours)', type: 'number' },
  { k: 'taxPercent', label: 'Tax %', type: 'number', step: '0.01' },
  { k: 'gratuityPercent', label: 'Automatic gratuity %', type: 'number', step: '0.01' },
  { k: 'deliveryFee', label: 'Delivery fee ($, 0 = confirmed later)', type: 'number', step: '0.01' },
  { k: 'pickupAvailable', label: 'Pickup available', type: 'checkbox' },
  { k: 'pricingNote', label: 'Pricing note (shown at checkout)', textarea: true, wide: true },
  { k: 'terms', label: 'Conditions of catering (one per line)', textarea: true, wide: true, rows: 6 },
  { section: 'Visibility', superOnly: true },
  { k: 'active', label: 'Visible on website', type: 'checkbox', superOnly: true },
  { k: 'displayOrder', label: 'Display order', type: 'number', superOnly: true },
]

function RestaurantSettings({ restaurant, onSaved }) {
  const { user } = useAdmin()
  const [form, setForm] = useState(restaurant)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fields = SETTINGS_FIELDS.filter((f) => !f.superOnly || user.role === 'super')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const body = {}
    for (const f of fields) {
      if (!f.k) continue
      const v = form[f.k]
      body[f.k] = f.type === 'number' ? Number(v) || 0 : f.type === 'checkbox' ? Boolean(v) : v === '' ? null : v
    }
    try {
      const saved = await api(`/admin/restaurants/${restaurant.id}`, { method: 'PATCH', body })
      onSaved({ ...restaurant, ...saved })
      setMsg('Settings saved')
      setTimeout(() => setMsg(''), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f, i) =>
          f.section ? (
            <div key={i} className={`sm:col-span-2 ${i ? 'mt-4 border-t border-slate-100 pt-5' : ''}`}>
              <h2 className="font-bold">{f.section}</h2>
              {f.help && <p className="text-sm text-slate-500">{f.help}</p>}
            </div>
          ) : f.type === 'checkbox' ? (
            <label key={f.k} className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={Boolean(form[f.k])} onChange={(e) => setForm({ ...form, [f.k]: e.target.checked })} />
              {f.label}
            </label>
          ) : (
            <div key={f.k} className={f.wide ? 'sm:col-span-2' : ''}>
              <label className="label" htmlFor={`rs-${f.k}`}>
                {f.label}
              </label>
              {f.textarea ? (
                <textarea id={`rs-${f.k}`} rows={f.rows || 3} className="input" value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
              ) : (
                <input
                  id={`rs-${f.k}`}
                  type={f.type || 'text'}
                  step={f.step}
                  required={f.required}
                  className="input"
                  value={form[f.k] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                />
              )}
            </div>
          ),
        )}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
        {msg && <span className="text-sm font-medium text-cilantro-700">✓ {msg}</span>}
      </div>
      {error && (
        <div className="mt-4">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
    </form>
  )
}
