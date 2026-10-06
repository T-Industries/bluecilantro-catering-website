import { useCallback, useEffect, useState } from 'react'
import { Badge, CloseButton, ConfirmDialog, ErrorBox, Modal, PageLoader } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { useAdmin } from './AdminLayout.jsx'

const blank = { email: '', name: '', password: '', role: 'restaurant', restaurantId: '', active: true }

export default function Users() {
  const { user: me } = useAdmin()
  const [users, setUsers] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => api('/admin/users').then(setUsers).catch((e) => setError(e.message)), [])
  useEffect(() => {
    reload()
    api('/admin/restaurants').then(setRestaurants).catch(() => {})
  }, [reload])

  if (!users) return error ? <ErrorBox>{error}</ErrorBox> : <PageLoader />

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin users</h1>
          <p className="text-sm text-slate-500">Restaurant admins only see and manage their own restaurant’s orders and menu.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...blank })}>
          + Add user
        </button>
      </div>
      {error && (
        <div className="mt-4">
          <ErrorBox>{error}</ErrorBox>
        </div>
      )}
      <div className="card mt-6 divide-y divide-slate-100">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {u.name || u.email} {u.id === me.id && <span className="text-xs font-normal text-slate-500">(you)</span>}
              </p>
              <p className="text-sm text-slate-500">{u.email}</p>
            </div>
            <Badge tone={u.role === 'super' ? 'blue' : 'green'}>{u.role === 'super' ? 'BlueCilantro admin' : u.restaurant?.name || 'Restaurant admin'}</Badge>
            {!u.active && <Badge tone="slate">Inactive</Badge>}
            <button className="btn-outline px-3 py-1.5 text-sm" onClick={() => setEditing({ ...blank, ...u, password: '', restaurantId: u.restaurantId || '' })}>
              Edit
            </button>
            {u.id !== me.id && (
              <button
                className="btn-ghost px-3 py-1.5 text-sm text-red-600"
                onClick={() => setConfirm(u)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <UserModal
        state={editing}
        restaurants={restaurants}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing.id) await api(`/admin/users/${editing.id}`, { method: 'PATCH', body: data })
          else await api('/admin/users', { method: 'POST', body: data })
          setEditing(null)
          reload()
        }}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Delete ${confirm?.email}?`}
        message="They will no longer be able to sign in."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const id = confirm.id
          setConfirm(null)
          try {
            await api(`/admin/users/${id}`, { method: 'DELETE' })
            reload()
          } catch (e) {
            setError(e.message)
          }
        }}
      />
    </div>
  )
}

function UserModal({ state, restaurants, onClose, onSave }) {
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  useEffect(() => {
    if (state) {
      setForm(state)
      setError('')
    }
  }, [state])
  const isNew = !state?.id
  return (
    <Modal open={Boolean(state)} onClose={onClose} size="sm">
      <form
        className="p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await onSave({
              email: form.email,
              name: form.name || null,
              role: form.role,
              restaurantId: form.role === 'restaurant' ? form.restaurantId || null : null,
              active: form.active,
              ...(form.password ? { password: form.password } : {}),
            })
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{isNew ? 'Add admin user' : 'Edit admin user'}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <label className="label mt-4">Name</label>
        <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label className="label mt-4">Email</label>
        <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="label mt-4">{isNew ? 'Password' : 'New password (leave blank to keep)'}</label>
        <input type="password" minLength={8} required={isNew} className="input" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <label className="label mt-4">Role</label>
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="restaurant">Restaurant admin</option>
          <option value="super">BlueCilantro admin (all restaurants)</option>
        </select>
        {form.role === 'restaurant' && (
          <>
            <label className="label mt-4">Restaurant</label>
            <select required className="input" value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}>
              <option value="">Choose…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </>
        )}
        <label className="mt-4 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active
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

export function Account() {
  const { user } = useAdmin()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">My account</h1>
      <p className="text-sm text-slate-500">{user.email}</p>
      <form
        className="card mt-6 space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          setMsg('')
          if (form.newPassword !== form.confirm) return setError('New passwords do not match')
          try {
            await api('/admin/auth/password', { method: 'POST', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } })
            setForm({ currentPassword: '', newPassword: '', confirm: '' })
            setMsg('Password updated')
          } catch (err) {
            setError(err.message)
          }
        }}
      >
        <h2 className="font-bold">Change password</h2>
        <div>
          <label className="label">Current password</label>
          <input type="password" required className="input" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" required minLength={8} className="input" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input type="password" required minLength={8} className="input" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        {msg && <p className="text-sm font-medium text-cilantro-700">✓ {msg}</p>}
        <button className="btn-primary w-full">Update password</button>
      </form>
    </div>
  )
}
