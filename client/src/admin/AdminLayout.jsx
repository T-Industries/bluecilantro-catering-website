import { createContext, useContext, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PageLoader } from '../components/ui.jsx'
import { api } from '../lib/api.js'

const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

export function AdminProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out
  useEffect(() => {
    api('/admin/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
  }, [])
  const logout = async () => {
    await api('/admin/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }
  return <AdminContext.Provider value={{ user, setUser, logout }}>{children}</AdminContext.Provider>
}

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'}`

export default function AdminLayout() {
  const { user, logout } = useAdmin()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  if (user === undefined) return <PageLoader />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  const nav = (
    <nav className="flex flex-col gap-1">
      <NavLink to="/admin/orders" className={navClass}>
        Orders
      </NavLink>
      <NavLink to="/admin/restaurants" className={navClass}>
        {user.role === 'super' ? 'Restaurants & Menus' : 'Menu & Settings'}
      </NavLink>
      {user.role === 'super' && (
        <NavLink to="/admin/users" className={navClass}>
          Admin Users
        </NavLink>
      )}
      <NavLink to="/admin/account" className={navClass}>
        My Account
      </NavLink>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-900 p-5 lg:flex">
        <Link to="/" className="rounded-2xl bg-white p-3">
          <img src="/images/bluecilantro-catering-logo.png" alt="BlueCilantro Catering" className="mx-auto h-20 w-auto" />
        </Link>
        <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-brand-200">Admin</p>
        {nav}
        <div className="mt-auto border-t border-white/10 pt-4 text-sm text-brand-100">
          <p className="truncate font-semibold text-white">{user.name || user.email}</p>
          <p className="truncate text-xs">{user.role === 'super' ? 'BlueCilantro admin' : 'Restaurant admin'}</p>
          <button
            className="mt-3 text-xs font-semibold text-brand-100 underline-offset-2 hover:text-white hover:underline"
            onClick={async () => {
              await logout()
              navigate('/admin/login')
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex items-center justify-between bg-brand-900 px-4 py-3 lg:hidden">
        <Link to="/admin/orders" className="rounded-xl bg-white px-2 py-1">
          <img src="/images/bluecilantro-catering-logo.png" alt="BlueCilantro Catering" className="h-10 w-auto" />
        </Link>
        <button className="btn-ghost text-white hover:bg-white/10" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
          Menu
        </button>
      </div>
      {menuOpen && (
        <div className="bg-brand-900 px-4 pb-4 lg:hidden">
          {nav}
          <button className="mt-2 px-3 text-sm font-semibold text-brand-100" onClick={async () => { await logout(); navigate('/admin/login') }}>
            Sign out
          </button>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminLogin() {
  const { user, setUser } = useAdmin()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={location.state?.from || '/admin/orders'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      setUser(await api('/admin/auth/login', { method: 'POST', body: { email, password } }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-900 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lift">
        <img src="/images/bluecilantro-catering-logo.png" alt="BlueCilantro Catering" className="mx-auto h-28 w-auto" />
        <h1 className="mt-4 text-center text-xl font-bold">Admin sign in</h1>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="label mt-6" htmlFor="ae">
          Email
        </label>
        <input id="ae" type="email" autoComplete="username" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label mt-4" htmlFor="ap">
          Password
        </label>
        <input id="ap" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary mt-6 w-full py-3" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="mt-4 block text-center text-sm text-slate-500 hover:underline">
          ← Back to site
        </Link>
      </form>
    </div>
  )
}
