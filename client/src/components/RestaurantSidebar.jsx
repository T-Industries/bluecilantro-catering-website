import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { themeGradient } from '../lib/theme.js'

// The restaurant list rarely changes; fetch it once per page load and share it.
let cache = null
export function useRestaurants() {
  const [list, setList] = useState(() => (Array.isArray(cache) ? cache : null))
  useEffect(() => {
    if (Array.isArray(cache)) return
    cache ||= api('/restaurants').then((r) => (cache = r))
    Promise.resolve(cache).then(setList).catch(() => {
      cache = null
      setList([])
    })
  }, [])
  return list
}

const firstTag = (r) => (r.cuisine || '').split(',')[0]?.trim()

// Full-bleed photo card: restaurant image, dark gradient, logo chip and large white name.
function RestaurantImageCard({ r, active, compact = false }) {
  return (
    <Link
      to={`/restaurant/${r.slug}`}
      aria-current={active ? 'page' : undefined}
      className={`group relative block shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br ${themeGradient(r.slug)} transition duration-300 ${
        compact ? 'h-28 w-64' : 'h-32 w-full'
      } ${active ? 'shadow-lift ring-[3px] ring-cilantro-500 ring-offset-2 ring-offset-cream' : 'opacity-90 hover:opacity-100 hover:shadow-lift'}`}
    >
      {r.heroUrl && (
        <img
          src={r.heroUrl}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${active ? 'scale-105' : ''}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />

      <div className="absolute left-3 top-3 flex h-11 w-16 items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
        <img src={r.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
      </div>
      {active && (
        <span className="absolute right-3 top-3 rounded-full bg-cilantro-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
          Viewing
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className={`font-bold leading-tight text-white drop-shadow ${compact ? 'text-lg' : 'text-xl'}`}>{r.name}</p>
        <p className="mt-1 truncate text-sm text-white/80">
          {firstTag(r)} · Min {r.minGuests} guests · {r.leadTimeHours}h notice
        </p>
      </div>
    </Link>
  )
}

// Desktop: vertical list of image cards pinned to the left. Mobile: horizontal scroller above the menu.
export default function RestaurantSidebar({ activeSlug }) {
  const list = useRestaurants()
  const mobileRef = useRef(null)

  useEffect(() => {
    mobileRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [activeSlug, list])

  if (!list) return <aside className="hidden w-80 shrink-0 lg:block" />

  return (
    <>
      <aside className="hidden w-80 shrink-0 lg:block" aria-label="Restaurants">
        <nav className="no-scrollbar sticky top-28 max-h-[calc(100vh-7rem)] space-y-4 overflow-y-auto px-1 py-5">
          <p className="px-1 font-display text-2xl text-slate-900">Our Restaurants</p>
          {list.map((r) => (
            <RestaurantImageCard key={r.id} r={r} active={r.slug === activeSlug} />
          ))}
        </nav>
      </aside>

      <nav ref={mobileRef} className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 pt-1 lg:hidden" aria-label="Restaurants">
        {list.map((r) => (
          <RestaurantImageCard key={r.id} r={r} active={r.slug === activeSlug} compact />
        ))}
      </nav>
    </>
  )
}
