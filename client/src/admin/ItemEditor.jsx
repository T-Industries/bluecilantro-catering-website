import { useEffect, useState } from 'react'
import { PRICING_TYPES } from '@shared/pricing.js'
import { CloseButton, ErrorBox, Modal } from '../components/ui.jsx'

const blankItem = {
  name: '',
  description: '',
  pricingType: 'per_person',
  price: '',
  unitLabel: '',
  minQty: 1,
  step: 1,
  serves: '',
  tags: '',
  badge: '',
  imageUrl: '',
  active: true,
  variants: [],
  optionGroups: [],
}

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export default function ItemEditor({ open, item, categories, categoryId, onClose, onSave }) {
  const [form, setForm] = useState(blankItem)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(
      item
        ? {
            ...blankItem,
            ...item,
            price: item.price ?? '',
            description: item.description ?? '',
            unitLabel: item.unitLabel ?? '',
            serves: item.serves ?? '',
            tags: item.tags ?? '',
            badge: item.badge ?? '',
            imageUrl: item.imageUrl ?? '',
            variants: item.variants.map((v) => ({ ...v })),
            optionGroups: item.optionGroups.map((g) => ({ ...g, choices: g.choices.map((c) => ({ ...c, price: c.price ?? '' })) })),
          }
        : { ...blankItem, categoryId },
    )
  }, [open, item, categoryId])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setVariant = (i, k, v) => set('variants', form.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const setGroup = (i, k, v) => set('optionGroups', form.optionGroups.map((g, j) => (j === i ? { ...g, [k]: v } : g)))
  const setChoice = (gi, ci, k, v) =>
    setGroup(
      gi,
      'choices',
      form.optionGroups[gi].choices.map((c, j) => (j === ci ? { ...c, [k]: v } : c)),
    )

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave({
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || null,
        pricingType: form.pricingType,
        price: form.pricingType === 'quote' || form.variants.length ? numOrNull(form.price) : Number(form.price || 0),
        unitLabel: form.unitLabel || null,
        minQty: Number(form.minQty) || 1,
        step: Number(form.step) || 1,
        serves: form.serves || null,
        tags: form.tags || null,
        badge: form.badge || null,
        imageUrl: form.imageUrl || null,
        active: form.active,
        variants: form.variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), price: Number(v.price) || 0 })),
        optionGroups: form.optionGroups
          .filter((g) => g.name.trim())
          .map((g) => ({
            name: g.name.trim(),
            min: Number(g.min) || 0,
            max: Math.max(1, Number(g.max) || 1),
            choices: g.choices
              .filter((c) => c.name.trim())
              .map((c) => ({
                name: c.name.trim(),
                ...(numOrNull(c.price) ? { price: Number(c.price) } : {}),
                ...(c.description ? { description: c.description } : {}),
              })),
          })),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const needsUnit = form.pricingType === 'per_unit' || form.pricingType === 'fixed'

  return (
    <Modal open={open} onClose={onClose} size="lg" labelledBy="item-editor-title">
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="item-editor-title" className="text-lg font-bold">
            {item ? 'Edit menu item' : 'New menu item'}
          </h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Name</label>
              <input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea rows={3} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pricing type</label>
              <select className="input" value={form.pricingType} onChange={(e) => set('pricingType', e.target.value)}>
                {Object.entries(PRICING_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            {form.pricingType !== 'quote' && (
              <div>
                <label className="label">Price ($){form.variants.length > 0 && <span className="font-normal text-slate-400"> — set by options below</span>}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  disabled={form.variants.length > 0}
                  required={!form.variants.length}
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>
            )}
            {needsUnit && (
              <div>
                <label className="label">Unit label</label>
                <input className="input" placeholder="each, dozen, hour, platter…" value={form.unitLabel} onChange={(e) => set('unitLabel', e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Minimum quantity</label>
              <input type="number" min="1" className="input" value={form.minQty} onChange={(e) => set('minQty', e.target.value)} />
            </div>
            <div>
              <label className="label">Order in multiples of</label>
              <input type="number" min="1" className="input" value={form.step} onChange={(e) => set('step', e.target.value)} />
            </div>
            <div>
              <label className="label">Serves</label>
              <input className="input" placeholder="e.g. Serves 10-12" value={form.serves} onChange={(e) => set('serves', e.target.value)} />
            </div>
            <div>
              <label className="label">Badge</label>
              <input className="input" placeholder="Popular, Seasonal…" value={form.badge} onChange={(e) => set('badge', e.target.value)} />
            </div>
            <div>
              <label className="label">Tags</label>
              <input className="input" placeholder="V, GF" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
            </div>
            <div>
              <label className="label">Photo URL</label>
              <input className="input" placeholder="/images/menu/…jpg" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
              Visible on menu
            </label>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Price options</h3>
                <p className="text-xs text-slate-500">Mutually exclusive versions with their own price (e.g. Medium / Large, or entrée choices).</p>
              </div>
              <button type="button" className="btn-outline px-3 py-1.5" onClick={() => set('variants', [...form.variants, { name: '', price: '' }])}>
                + Add
              </button>
            </div>
            {form.variants.map((v, i) => (
              <div key={i} className="mt-3 flex gap-2">
                <input className="input" placeholder="Option name" value={v.name} onChange={(e) => setVariant(i, 'name', e.target.value)} />
                <input type="number" step="0.01" min="0" className="input w-32" placeholder="Price" value={v.price} onChange={(e) => setVariant(i, 'price', e.target.value)} />
                <button type="button" className="btn-ghost px-3 text-red-600" aria-label="Remove option" onClick={() => set('variants', form.variants.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Choice groups</h3>
                <p className="text-xs text-slate-500">e.g. “Choose 3 Appetizers” (min 3, max 3). Extra price is added per unit of quantity.</p>
              </div>
              <button
                type="button"
                className="btn-outline px-3 py-1.5"
                onClick={() => set('optionGroups', [...form.optionGroups, { name: '', min: 1, max: 1, choices: [{ name: '', price: '' }] }])}
              >
                + Add group
              </button>
            </div>
            {form.optionGroups.map((g, gi) => (
              <div key={gi} className="mt-4 rounded-xl bg-slate-50 p-3">
                <div className="flex flex-wrap gap-2">
                  <input className="input min-w-[12rem] flex-1" placeholder="Group name" value={g.name} onChange={(e) => setGroup(gi, 'name', e.target.value)} />
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    Min
                    <input type="number" min="0" className="input w-20" value={g.min} onChange={(e) => setGroup(gi, 'min', e.target.value)} />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    Max
                    <input type="number" min="1" className="input w-20" value={g.max} onChange={(e) => setGroup(gi, 'max', e.target.value)} />
                  </label>
                  <button type="button" className="btn-ghost px-3 text-red-600" onClick={() => set('optionGroups', form.optionGroups.filter((_, j) => j !== gi))}>
                    Remove group
                  </button>
                </div>
                <div className="mt-2 space-y-2 pl-2">
                  {g.choices.map((c, ci) => (
                    <div key={ci} className="flex gap-2">
                      <input className="input" placeholder="Choice" value={c.name} onChange={(e) => setChoice(gi, ci, 'name', e.target.value)} />
                      <input type="number" step="0.01" min="0" className="input w-28" placeholder="+ $" value={c.price} onChange={(e) => setChoice(gi, ci, 'price', e.target.value)} />
                      <button type="button" className="btn-ghost px-3 text-red-600" aria-label="Remove choice" onClick={() => setGroup(gi, 'choices', g.choices.filter((_, j) => j !== ci))}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" className="text-sm font-semibold text-brand-600 hover:underline" onClick={() => setGroup(gi, 'choices', [...g.choices, { name: '', price: '' }])}>
                    + Add choice
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <ErrorBox>{error}</ErrorBox>
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save item'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
