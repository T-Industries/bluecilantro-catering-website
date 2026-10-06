import { useEffect, useMemo, useState } from 'react'
import {
  PRICING_TYPES,
  displayPrice,
  formatMoney,
  lineTotal,
  priceSuffix,
  qtyRules,
  quantityNoun,
  unitPrice,
  validateSelection,
} from '@shared/pricing.js'
import { Badge, CloseButton, Modal, Stepper } from './ui.jsx'

function groupHint(g) {
  const min = Number(g.min) || 0
  const max = Number(g.max) || g.choices.length
  if (min === max) return `Choose ${min}`
  if (min === 0) return max === 1 ? 'Optional' : `Optional · up to ${max}`
  return `Choose ${min}–${max}`
}

function defaultQty(item, restaurant, guestCount) {
  const { min, step } = qtyRules(item)
  let q = min
  if (item.pricingType === 'per_person' || item.pricingType === 'quote') {
    q = Math.max(min, guestCount || restaurant.minGuests || 1)
  }
  return step > 1 ? Math.ceil(q / step) * step : q
}

export default function ItemModal({ item, restaurant, guestCount, onClose, onAdd }) {
  const [variant, setVariant] = useState()
  const [options, setOptions] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    if (!item) return
    setVariant(item.variants?.length === 1 ? item.variants[0].name : undefined)
    // Pre-select single-choice required groups (e.g. "Dessert of the Day")
    const preset = {}
    for (const g of item.optionGroups || []) {
      if (g.choices.length === 1 && g.min >= 1) preset[g.name] = [g.choices[0].name]
    }
    setOptions(preset)
    setQuantity(defaultQty(item, restaurant, guestCount))
    setNotes('')
    setShowErrors(false)
  }, [item, restaurant, guestCount])

  const selection = useMemo(() => ({ quantity, variant, options }), [quantity, variant, options])
  if (!item) return null

  const errors = validateSelection(item, selection)
  const { min, step } = qtyRules(item)
  const isQuote = item.pricingType === 'quote'
  const price = displayPrice(item)
  const tags = (item.tags || '').split(',').map((t) => t.trim()).filter(Boolean)

  const toggle = (group, name) => {
    setOptions((prev) => {
      const current = prev[group.name] || []
      const max = Number(group.max) || group.choices.length
      let next
      if (current.includes(name)) next = current.filter((n) => n !== name)
      else if (max === 1) next = [name]
      else if (current.length >= max) return prev
      else next = [...current, name]
      return { ...prev, [group.name]: next }
    })
  }

  const submit = () => {
    if (errors.length) {
      setShowErrors(true)
      return
    }
    onAdd(item, selection, notes.trim())
  }

  return (
    <Modal open={Boolean(item)} onClose={onClose} labelledBy="item-title">
      <div className="relative border-b border-slate-100 px-6 pb-5 pt-6">
        <CloseButton onClick={onClose} className="absolute right-4 top-4" />
        <div className="flex flex-wrap gap-1.5 pr-10">
          {item.badge && <Badge>{item.badge}</Badge>}
          {tags.map((t) => (
            <Badge key={t} tone="slate">
              {t}
            </Badge>
          ))}
        </div>
        <h2 id="item-title" className="mt-2 pr-10 text-2xl font-bold tracking-tight">
          {item.name}
        </h2>
        <p className="mt-1 font-semibold text-brand-700">
          {isQuote ? 'Priced by quote' : price ? `${price.from ? 'From ' : ''}${formatMoney(price.amount)} ${priceSuffix(item)}` : ''}
          {item.serves && <span className="ml-2 font-normal text-slate-500">· {item.serves}</span>}
        </p>
        {item.description && <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {item.variants?.length > 0 && (
          <fieldset>
            <legend className="flex w-full items-center justify-between">
              <span className="font-semibold">Choose an option</span>
              <span className={`text-xs font-semibold ${showErrors && !variant ? 'text-red-600' : 'text-slate-500'}`}>Required</span>
            </legend>
            <div className="mt-3 space-y-2">
              {item.variants.map((v) => (
                <label
                  key={v.name}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition ${variant === v.name ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="variant" className="h-4 w-4 accent-brand-600" checked={variant === v.name} onChange={() => setVariant(v.name)} />
                    {v.name}
                  </span>
                  <span className="font-semibold">{formatMoney(v.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {(item.optionGroups || []).map((g) => {
          const picked = options[g.name] || []
          const max = Number(g.max) || g.choices.length
          const single = max === 1
          const unmet = picked.length < (Number(g.min) || 0)
          return (
            <fieldset key={g.name}>
              <legend className="flex w-full items-center justify-between gap-3">
                <span className="font-semibold">{g.name}</span>
                <span className={`shrink-0 text-xs font-semibold ${showErrors && unmet ? 'text-red-600' : 'text-slate-500'}`}>
                  {groupHint(g)}
                  {!single && ` · ${picked.length} selected`}
                </span>
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {g.choices.map((c) => {
                  const checked = picked.includes(c.name)
                  const disabled = !checked && !single && picked.length >= max
                  return (
                    <label
                      key={c.name}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <input
                        type={single ? 'radio' : 'checkbox'}
                        name={g.name}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(g, c.name)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block">{c.name}</span>
                        {c.description && <span className="mt-0.5 block text-xs text-slate-500">{c.description}</span>}
                      </span>
                      {c.price > 0 && <span className="shrink-0 text-xs font-semibold text-slate-600">+{formatMoney(c.price)}</span>}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}

        <div>
          <label className="label" htmlFor="item-notes">
            Special instructions <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="item-notes"
            rows={2}
            className="input"
            maxLength={500}
            placeholder={item.pricingType === 'per_person' ? 'e.g. 5 vegetarian, 2 gluten-free' : 'Allergies, preferences…'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-6 py-4">
        {showErrors && errors.length > 0 && <p className="mb-3 text-sm text-red-600">{errors[0]}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Stepper value={quantity} onChange={setQuantity} min={min} step={step} label={PRICING_TYPES[item.pricingType]?.qtyLabel} />
            <span className="text-sm text-slate-600">{quantityNoun(item, quantity)}</span>
          </div>
          <button onClick={submit} className="btn-green ml-auto flex-1 justify-between py-3 text-base sm:flex-none sm:gap-6">
            <span>{isQuote ? 'Add quote request' : 'Add to order'}</span>
            {!isQuote && <span>{formatMoney(lineTotal(item, selection))}</span>}
          </button>
        </div>
        {(min > 1 || step > 1) && (
          <p className="mt-2 text-xs text-slate-500">
            Minimum {min} {quantityNoun(item, min)}
            {step > 1 ? `, in multiples of ${step}` : ''}.
            {!isQuote && quantity > 0 && ` ${formatMoney(unitPrice(item, selection))} ${priceSuffix(item) || 'each'}.`}
          </p>
        )}
      </div>
    </Modal>
  )
}
