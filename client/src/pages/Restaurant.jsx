import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { displayPrice, formatMoney, priceSuffix } from '@shared/pricing.js'
import ItemModal from '../components/ItemModal.jsx'
import RestaurantSidebar from '../components/RestaurantSidebar.jsx'
import { Badge, ConfirmDialog, ErrorBox, Spinner } from '../components/ui.jsx'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../lib/api.js'
import { dotPattern, themeGradient } from '../lib/theme.js'

function MenuItemCard({ item, onSelect }) {
  const price = displayPrice(item)
  const tags = (item.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
  const meta = [
    item.serves,
    item.minQty > 1 && !item.serves && `Min ${item.minQty}${item.pricingType === 'per_lb' ? ' lb' : item.pricingType === 'per_person' ? ' guests' : ''}`,
    item.optionGroups.length > 0 && 'Customizable',
  ].filter(Boolean)

  const addButton = (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-light text-white shadow-md ring-4 ring-white transition group-hover:scale-110 group-hover:bg-cilantro-600"
      aria-hidden
    >
      +
    </span>
  )

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex h-full gap-4 rounded-3xl bg-white p-5 text-left shadow-card ring-1 ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:p-6"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {(item.badge || tags.length > 0) && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {item.badge && <Badge>{item.badge}</Badge>}
            {tags.map((t) => (
              <Badge key={t} tone="slate">
                {t}
              </Badge>
            ))}
          </div>
        )}
        <h3 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-700">{item.name}</h3>
        {item.description && <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-slate-600">{item.description}</p>}
        {meta.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {meta.map((m) => (
              <span key={m} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {m}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {item.pricingType === 'quote' ? (
            <span className="text-base font-bold text-amber-700">Request a quote</span>
          ) : price ? (
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              {price.from && <span className="mr-1 text-sm font-medium text-slate-500">From</span>}
              {formatMoney(price.amount)}
              <span className="ml-1 text-sm font-medium text-slate-500">{priceSuffix(item)}</span>
            </span>
          ) : (
            <span />
          )}
          {!item.imageUrl && addButton}
        </div>
      </div>

      {item.imageUrl && (
        <div className="relative h-32 w-32 shrink-0 self-start sm:h-40 sm:w-40">
          <div className="h-full w-full overflow-hidden rounded-2xl bg-slate-100">
            <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
          </div>
          <div className="absolute -bottom-2 -right-2">{addButton}</div>
        </div>
      )}
    </button>
  )
}

// Section header: photo banner when the category has an image, otherwise a themed gradient.
function SectionHeader({ section, slug }) {
  if (section.highlight) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-lg text-white shadow">★</span>
        <div>
          <h2 className="font-display text-3xl text-slate-900">{section.name}</h2>
          <p className="text-sm text-slate-600">Our most-ordered catering favourites</p>
        </div>
      </div>
    )
  }
  return (
    <div className={`relative flex min-h-[9rem] items-end overflow-hidden rounded-3xl bg-gradient-to-br ${themeGradient(slug)} sm:min-h-[10.5rem]`}>
      {section.imageUrl ? (
        <img src={section.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={dotPattern} />
      )}
      <div className={`absolute inset-0 ${section.imageUrl ? 'bg-gradient-to-r from-black/85 via-black/55 to-black/10' : 'bg-gradient-to-r from-black/30 to-transparent'}`} />
      <div className="relative w-full p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl">{section.name}</h2>
            {section.description && <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{section.description}</p>}
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur">
            {section.items.length} item{section.items.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  )
}

function Banner({ restaurant: r }) {
  return (
    <div className="relative overflow-hidden rounded-t-3xl bg-slate-800">
      {r.heroUrl && <img src={r.heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />
      <div className="relative flex flex-col gap-6 px-5 py-10 sm:px-10 sm:py-14 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white p-2.5 shadow-lift sm:h-32 sm:w-32">
            <img src={r.logoUrl} alt={`${r.name} logo`} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cilantro-100">BlueCilantro Catering</p>
            <h1 className="mt-1.5 font-display text-4xl leading-none text-white sm:text-5xl xl:text-6xl">{r.name}</h1>
            {r.tagline && <p className="mt-2 text-base text-white/85 sm:text-lg">{r.tagline}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

const matches = (item, q) =>
  !q ||
  item.name.toLowerCase().includes(q) ||
  (item.description || '').toLowerCase().includes(q) ||
  item.optionGroups.some((g) => g.choices.some((c) => c.name.toLowerCase().includes(q)))

export default function Restaurant() {
  const { slug } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [pendingAdd, setPendingAdd] = useState(null)
  const [activeCat, setActiveCat] = useState(null)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const cart = useCart()
  const tabsRef = useRef(null)
  const clickedTabRef = useRef(null)
  const stickyBarRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setRestaurant(null)
    setError('')
    setQuery('')
    setActiveCat(null)
    api(`/restaurants/${slug}`)
      .then((r) => {
        if (cancelled) return
        setRestaurant(r)
        document.title = `${r.name} Catering | BlueCilantro Catering`
      })
      .catch((e) => !cancelled && setError(e.status === 404 ? 'We couldn’t find that restaurant.' : e.message))
    return () => {
      cancelled = true
      document.title = 'BlueCilantro Catering'
    }
  }, [slug])

  // Sections to show: "Popular" (badged items) first, then categories — filtered by the menu search.
  const sections = useMemo(() => {
    if (!restaurant) return []
    const q = query.trim().toLowerCase()
    const cats = restaurant.categories.map((c) => ({ ...c, items: c.items.filter((i) => matches(i, q)) }))
    const popular = restaurant.categories.flatMap((c) => c.items).filter((i) => i.badge && matches(i, q))
    const list = popular.length && !q ? [{ id: 'popular', name: `Popular at ${restaurant.name}`, tab: 'Popular', items: popular, highlight: true }] : []
    return [...list, ...cats.filter((c) => c.items.length)]
  }, [restaurant, query])

  // Where a section's top should sit when it is "current": just below the sticky tab bar.
  // Uses the bar's *stuck* position (its CSS top + height), which is correct even before
  // the page has scrolled far enough for the bar to stick.
  const sectionAnchor = () => {
    const bar = stickyBarRef.current
    if (!bar) return 160
    return (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight + 16
  }

  // Highlight the tab of the last section whose top has scrolled past the sticky tab bar.
  // After a tab click the clicked tab stays selected until the user scrolls themselves
  // (the last sections of a short menu can't always reach the top of the screen).
  useEffect(() => {
    if (!sections.length) return
    const update = () => {
      if (clickedTabRef.current) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      const els = [...document.querySelectorAll('[data-cat]')]
      let current = sections[0].id
      if (atBottom && els.length) current = els[els.length - 1].dataset.cat
      else {
        const offset = sectionAnchor() + 24 // small tolerance for rounding
        for (const el of els) if (el.getBoundingClientRect().top <= offset) current = el.dataset.cat
      }
      setActiveCat(current)
    }
    const releaseClick = () => {
      clickedTabRef.current = null
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    const userInputs = ['wheel', 'touchstart', 'keydown', 'mousedown']
    userInputs.forEach((e) => window.addEventListener(e, releaseClick, { passive: true }))
    return () => {
      window.removeEventListener('scroll', update)
      userInputs.forEach((e) => window.removeEventListener(e, releaseClick))
    }
  }, [sections])

  const goToSection = (e, id) => {
    e.preventDefault()
    const el = document.getElementById(`cat-${id}`)
    if (!el) return
    setActiveCat(id)
    clickedTabRef.current = id
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - sectionAnchor(), behavior: 'smooth' })
  }

  useEffect(() => {
    if (!activeCat || !tabsRef.current) return
    const tab = tabsRef.current.querySelector(`[data-tab="${activeCat}"]`)
    if (tab) tabsRef.current.scrollTo({ left: tab.offsetLeft - tabsRef.current.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' })
  }, [activeCat])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const terms = useMemo(() => (restaurant?.terms || '').split('\n').filter(Boolean), [restaurant])

  const doAdd = ({ item, selection, notes }) => {
    cart.addLine(restaurant, item, selection, notes)
    setSelected(null)
    setPendingAdd(null)
    setToast(`${item.name} added to your order`)
  }

  const handleAdd = (item, selection, notes) => {
    if (cart.conflictsWith(restaurant.id)) setPendingAdd({ item, selection, notes })
    else doAdd({ item, selection, notes })
  }

  const cartHere = restaurant && cart.restaurant?.id === restaurant.id && cart.itemCount > 0

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:flex lg:gap-6 lg:pt-0">
      <RestaurantSidebar activeSlug={slug} />

      <div className="min-w-0 flex-1 lg:py-4">
        {error && (
          <div className="py-16 text-center">
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
        {!restaurant && !error && (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl bg-white ring-1 ring-slate-200">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {restaurant && (
          <div className="rounded-3xl bg-white shadow-card ring-1 ring-slate-200">
            <Banner restaurant={restaurant} />

            {(restaurant.description || restaurant.contactPhone) && (
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 text-sm sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:gap-10">
                <p className="max-w-3xl text-slate-600">{restaurant.description}</p>
                {restaurant.contactPhone && (
                  <p className="shrink-0 text-slate-500">
                    Questions? {restaurant.contactName && `${restaurant.contactName} · `}
                    <span className="font-semibold text-slate-800">{restaurant.contactPhone}</span>
                  </p>
                )}
              </div>
            )}

            <div ref={stickyBarRef} className="sticky top-20 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:top-28 sm:px-6">
              <nav ref={tabsRef} className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Menu categories">
                {sections.map((c) => (
                  <a
                    key={c.id}
                    href={`#cat-${c.id}`}
                    data-tab={c.id}
                    onClick={(e) => goToSection(e, c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCat === c.id ? 'border border-slate-800 text-slate-900' : 'border border-transparent text-slate-600 hover:text-slate-900'}`}
                  >
                    {c.tab || c.name}
                  </a>
                ))}
              </nav>
              <label className="relative hidden shrink-0 sm:block">
                <span className="sr-only">Search menu</span>
                <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 104.38 8.83l3.4 3.4a.75.75 0 101.06-1.06l-3.4-3.4A5.5 5.5 0 009 3.5zM5 9a4 4 0 118 0 4 4 0 01-8 0z" />
                </svg>
                <input type="search" className="input w-52 rounded-full py-2 pl-9 xl:w-64" placeholder="Search menu" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
            <div className="px-3 pt-3 sm:hidden">
              <input type="search" className="input rounded-full" placeholder="Search menu" aria-label="Search menu" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <div className="pb-8">
              {sections.length === 0 && <p className="px-8 py-16 text-center text-slate-500">No menu items match “{query}”.</p>}
              {sections.map((c) => (
                <section
                  key={c.id}
                  id={`cat-${c.id}`}
                  data-cat={c.id}
                  className={`scroll-mt-40 px-4 sm:scroll-mt-52 sm:px-6 ${c.highlight ? 'bg-gradient-to-b from-amber-50 to-white pb-10 pt-8' : 'pt-10'}`}
                >
                  <SectionHeader section={c} slug={restaurant.slug} />
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                    {c.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} onSelect={setSelected} />
                    ))}
                  </div>
                </section>
              ))}

              {(restaurant.pricingNote || terms.length > 0) && !query && (
                <section className="mx-4 mt-12 rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:mx-6">
                  <h2 className="text-lg font-bold">Catering information</h2>
                  {restaurant.pricingNote && <p className="mt-2 text-sm text-slate-700">{restaurant.pricingNote}</p>}
                  {terms.length > 0 && (
                    <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {terms.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </div>

      {cartHere && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:hidden">
          <button onClick={cart.openDrawer} className="btn-green w-full max-w-md justify-between py-3.5 text-base shadow-lift">
            <span>View order · {cart.itemCount}</span>
            <span>{formatMoney(cart.totals.subtotal)}</span>
          </button>
        </div>
      )}

      {restaurant && (
        <ItemModal
          item={selected}
          restaurant={restaurant}
          guestCount={cart.restaurant?.id === restaurant.id ? cart.guestCount : null}
          onClose={() => setSelected(null)}
          onAdd={handleAdd}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingAdd)}
        title="Start a new order?"
        message={`Your cart has items from ${cart.restaurant?.name}. Each catering order is placed with one restaurant — starting a new order will clear your current cart.`}
        confirmLabel="Start new order"
        onCancel={() => setPendingAdd(null)}
        onConfirm={() => {
          cart.clear()
          doAdd(pendingAdd)
        }}
      />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-32 z-50 flex justify-center px-4">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lift">
            <span className="text-cilantro-100">✓</span> {toast}
            <button onClick={cart.openDrawer} className="font-semibold text-cilantro-100 underline-offset-2 hover:underline">
              View
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
