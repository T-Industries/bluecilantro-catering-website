import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import CartDrawer from './CartDrawer.jsx'

function CartButton() {
  const { itemCount, openDrawer, totals } = useCart()
  return (
    <button onClick={openDrawer} className="btn-primary relative pl-4 pr-5" aria-label={`Open cart, ${itemCount} items`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 7h12l-1.2 11.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 7z" />
        <path d="M9 7V6a3 3 0 016 0v1" />
      </svg>
      <span className="hidden sm:inline">{itemCount ? `Cart · ${itemCount}` : 'Cart'}</span>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cilantro-600 px-1 text-[11px] font-bold ring-2 ring-white sm:hidden">
          {itemCount}
        </span>
      )}
      {totals?.subtotal > 0 && <span className="sr-only">Subtotal {totals.subtotal}</span>}
    </button>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-28 sm:px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="BlueCilantro Catering home">
            <img src="/images/bluecilantro-catering-logo.png" alt="BlueCilantro Catering" className="h-16 w-auto sm:h-24" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={({ isActive }) => `btn-ghost hidden sm:inline-flex ${isActive ? 'text-brand-700' : ''}`}>
              Restaurants
            </NavLink>
            <NavLink to="/track" className={({ isActive }) => `btn-ghost px-3 ${isActive ? 'text-brand-700' : ''}`}>
              Track order
            </NavLink>
            <CartButton />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 bg-brand-900 text-brand-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div>
            <div className="inline-block rounded-2xl bg-white p-3">
              <img src="/images/bluecilantro-catering-logo.png" alt="BlueCilantro Catering" className="h-24 w-auto" />
            </div>
            <p className="mt-4 max-w-xs text-sm text-brand-200">
              Catering from the restaurants you love — for corporate lunches, celebrations and festive gatherings.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Order</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-white" to="/restaurant/baton-rouge">Bâton Rouge</Link></li>
              <li><Link className="hover:text-white" to="/restaurant/wendel-clarks">Wendel Clark's</Link></li>
              <li><Link className="hover:text-white" to="/restaurant/lions-den">The Lion's Den Pub</Link></li>
              <li><Link className="hover:text-white" to="/restaurant/festive-menu">Our Festive Menu</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Help</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-white" to="/track">Track an order</Link></li>
              <li><Link className="hover:text-white" to="/admin">Restaurant admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-brand-200">
          © {new Date().getFullYear()} BlueCilantro Catering. All rights reserved.
        </div>
      </footer>

      <CartDrawer />
    </div>
  )
}
