import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { describeSelection, formatMoney, lineTotal, qtyRules, quantityNoun, validateSelection } from '@shared/pricing.js'
import { useCart } from '../context/CartContext.jsx'
import { CloseButton, Stepper } from './ui.jsx'

export function CartLine({ line, compact = false }) {
  const { updateLine, removeLine } = useCart()
  const { item, selection } = line
  const { min, step } = qtyRules(item)
  const details = describeSelection(item, selection)
  const errors = validateSelection(item, selection)

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{item.name}</p>
          {details.map((d) => (
            <p key={d} className="mt-0.5 text-xs text-slate-500">
              {d}
            </p>
          ))}
          {line.notes && <p className="mt-1 text-xs italic text-slate-500">“{line.notes}”</p>}
        </div>
        <p className="shrink-0 font-semibold">
          {item.pricingType === 'quote' ? <span className="text-sm text-amber-700">Quote</span> : formatMoney(lineTotal(item, selection))}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {compact ? (
            <span className="text-sm text-slate-600">
              {selection.quantity} {quantityNoun(item, selection.quantity)}
            </span>
          ) : (
            <>
              <Stepper
                size="sm"
                value={selection.quantity}
                min={min}
                step={step}
                label={`${item.name} quantity`}
                onChange={(quantity) => updateLine(line.key, { selection: { quantity } })}
              />
              <span className="text-xs text-slate-500">{quantityNoun(item, selection.quantity)}</span>
            </>
          )}
        </div>
        {!compact && (
          <button onClick={() => removeLine(line.key)} className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-red-600 hover:underline">
            Remove
          </button>
        )}
      </div>
      {errors.length > 0 && <p className="mt-2 text-xs text-red-600">{errors[0]}</p>}
    </li>
  )
}

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, restaurant, lines, totals } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => e.key === 'Escape' && closeDrawer()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  const hasErrors = lines.some((l) => validateSelection(l.item, l.selection).length)

  return (
    <div className={`fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
      <div className={`absolute inset-0 bg-slate-900/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeDrawer} />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-lift transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Your cart"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">Your catering order</h2>
          <CloseButton onClick={closeDrawer} />
        </div>

        {!lines.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">🍽️</div>
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-sm text-slate-500">Browse a restaurant menu and add items for your event.</p>
            <Link to="/" onClick={closeDrawer} className="btn-primary mt-2">
              Browse restaurants
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <img src={restaurant.logoUrl} alt="" className="h-9 w-14 rounded-lg bg-white object-contain p-1 ring-1 ring-slate-200" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{restaurant.name}</p>
                <Link to={`/restaurant/${restaurant.slug}`} onClick={closeDrawer} className="text-xs font-medium text-brand-600 hover:underline">
                  Add more items
                </Link>
              </div>
            </div>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
              {lines.map((line) => (
                <CartLine key={line.key} line={line} />
              ))}
            </ul>
            <div className="border-t border-slate-200 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold">{formatMoney(totals.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Tax{restaurant.gratuityPercent ? ', gratuity' : ''} and delivery calculated at checkout.</p>
              {totals.hasQuoteItems && <p className="mt-2 text-xs text-amber-700">Some items are priced by quote — the restaurant will confirm final pricing.</p>}
              <button
                className="btn-green mt-4 w-full py-3 text-base"
                disabled={hasErrors}
                onClick={() => {
                  closeDrawer()
                  navigate('/checkout')
                }}
              >
                Continue to checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
