import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { ErrorBox, Spinner } from '../components/ui.jsx'

export function RestaurantCard({ restaurant: r }) {
  const tags = (r.cuisine || '').split(',').map((t) => t.trim()).filter(Boolean)
  return (
    <Link
      to={`/restaurant/${r.slug}`}
      className="group block rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
      aria-label={`${r.name} — view catering menu`}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-slate-200">
        {r.heroUrl ? (
          <img
            src={r.heroUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-600 to-cilantro-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
        <div className="absolute bottom-4 left-4 flex h-16 w-28 items-center justify-center rounded-2xl bg-white p-2 shadow-lift ring-1 ring-black/5 sm:h-20 sm:w-32">
          <img src={r.logoUrl} alt={`${r.name} logo`} className="max-h-full max-w-full object-contain" />
        </div>
        <span className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
          Min {r.minGuests} guests
        </span>
      </div>
      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700">{r.name}</h3>
          <span className="mt-1 hidden shrink-0 text-sm font-semibold text-brand-600 transition group-hover:translate-x-0.5 sm:inline">
            View menu →
          </span>
        </div>
        {r.tagline && <p className="mt-0.5 text-sm text-slate-600">{r.tagline}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          <span className="chip bg-cilantro-50 text-cilantro-700">{r.leadTimeHours}h notice</span>
        </div>
      </div>
    </Link>
  )
}

const STEPS = [
  {
    title: 'Pick a restaurant',
    text: 'Browse full catering menus from local favourites.',
    icon: 'M3 10.5L12 4l9 6.5M5 9.5V20h14V9.5M9 20v-6h6v6',
  },
  {
    title: 'Build your order',
    text: 'Packages, platters and drinks sized for your guest count.',
    icon: 'M4 6h16M4 12h16M4 18h10',
  },
  {
    title: 'Get confirmed',
    text: 'Instant email & SMS confirmation. No payment taken online.',
    icon: 'M5 13l4 4L19 7',
  },
]

const OCCASIONS = [
  { title: 'Corporate lunches', text: 'Sandwiches, wraps & hot lunches', img: '/images/menu/photos/banner-finger-sandwiches.jpg', to: '/restaurant/wendel-clarks' },
  { title: 'Group dinners', text: '2, 3 & 4 course group menus', img: '/images/menu/baton-ribs.jpg', to: '/restaurant/baton-rouge' },
  { title: 'Breakfast meetings', text: 'Hot buffets & healthy starts', img: '/images/menu/photos/banner-breakfast-buffet.jpg', to: '/restaurant/wendel-clarks' },
  { title: 'Holiday parties', text: 'Roast dinners, canapés & bar', img: '/images/festive-hero.jpg', to: '/restaurant/festive-menu' },
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

export default function Home() {
  const [restaurants, setRestaurants] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/restaurants').then(setRestaurants).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-900">
        {/* Banquet photo, slightly blurred (scaled up so blurred edges stay off-screen) */}
        <img src="/images/home-background.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full scale-105 object-cover blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/90 via-brand-900/70 to-brand-900/35" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-cilantro-100 ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-cilantro-500" /> Catering for offices, parties & holidays
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] text-white sm:text-6xl xl:text-7xl">
              Catering your guests will <span className="italic text-cilantro-500">remember.</span>
            </h1>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#restaurants" className="btn-green px-7 py-3.5 text-base shadow-lg shadow-cilantro-900/30">
                Browse restaurants
              </a>
              <Link to="/track" className="btn border border-white/30 px-7 py-3.5 text-base text-white hover:bg-white/10">
                Track an order
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-8">
              {[
                ['4', 'Restaurants'],
                ['100+', 'Menu items'],
                ['24/7', 'Online ordering'],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-3xl text-white sm:text-4xl">{n}</dd>
                  <dd className="mt-1 text-sm text-brand-200">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 rounded-3xl bg-white p-4 shadow-lift ring-1 ring-slate-200 sm:grid-cols-3 sm:p-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-4 rounded-2xl p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cilantro-50 text-cilantro-700">
                <Icon d={s.icon} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Step {i + 1}</p>
                <p className="text-lg font-bold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section id="restaurants" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cilantro-600">Our partners</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Choose a restaurant</h2>
          </div>
          <p className="max-w-md text-slate-600">Each restaurant has its own full catering menu. Pick one to explore dishes, packages and pricing.</p>
        </div>
        <ErrorBox>{error}</ErrorBox>
        {!restaurants && !error && (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        )}
        {restaurants && (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </section>

      {/* Occasions */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cilantro-600">For every occasion</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Catering made for your event</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {OCCASIONS.map((o) => (
              <Link key={o.title} to={o.to} className="group relative h-56 overflow-hidden rounded-3xl bg-slate-800 shadow-card sm:h-60">
                <img src={o.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/0" />
                <div className="absolute inset-y-0 left-0 flex max-w-sm flex-col justify-end p-7">
                  <p className="text-3xl font-bold text-white">{o.title}</p>
                  <p className="mt-1 text-base text-white/85">{o.text}</p>
                  <p className="mt-3 text-sm font-semibold text-cilantro-100 transition group-hover:translate-x-1">Explore menu →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cilantro-700 via-cilantro-600 to-brand-700 px-8 py-12 sm:px-14 sm:py-16">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl text-white sm:text-4xl">Planning an event for 20 or more?</h2>
              <p className="mt-2 max-w-xl text-lg text-white/85">Build your order online in minutes — the restaurant confirms the details and payment with you directly.</p>
            </div>
            <a href="#restaurants" className="btn shrink-0 bg-white px-7 py-3.5 text-base text-cilantro-700 shadow-lg hover:bg-cilantro-50">
              Start your order
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
