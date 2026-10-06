import { useEffect } from 'react'

export function Modal({ open, onClose, children, size = 'md', labelledBy }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift sm:rounded-3xl ${width}`}>
        {children}
      </div>
    </div>
  )
}

export function CloseButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
        <path d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 01-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z" />
      </svg>
    </button>
  )
}

export function Stepper({ value, onChange, min = 1, step = 1, max = 100000, size = 'md', label }) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  const h = size === 'sm' ? 'h-8' : 'h-11'
  const w = size === 'sm' ? 'w-8' : 'w-11'
  return (
    <div className={`inline-flex items-center rounded-full border border-slate-300 bg-white ${h}`}>
      <button type="button" onClick={dec} disabled={value <= min} aria-label={`Decrease ${label || 'quantity'}`} className={`${w} ${h} rounded-full text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30`}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label || 'Quantity'}
        className={`w-14 border-0 bg-transparent text-center font-semibold [appearance:textfield] focus:outline-none ${size === 'sm' ? 'text-sm' : ''}`}
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
        onBlur={() => {
          let v = Math.max(min, value)
          if (step > 1) v = Math.ceil(v / step) * step
          if (v !== value) onChange(v)
        }}
      />
      <button type="button" onClick={inc} aria-label={`Increase ${label || 'quantity'}`} className={`${w} ${h} rounded-full text-lg font-semibold text-slate-700 hover:bg-slate-100`}>
        +
      </button>
    </div>
  )
}

export function Spinner({ className = 'h-6 w-6' }) {
  return <div className={`animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 ${className}`} role="status" aria-label="Loading" />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function ErrorBox({ children }) {
  if (!children) return null
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>
}

export function Badge({ children, tone = 'green' }) {
  const tones = {
    green: 'bg-cilantro-50 text-cilantro-700 ring-cilantro-100',
    blue: 'bg-brand-50 text-brand-700 ring-brand-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{children}</span>
}

// Confirmation dialog (browser confirm() is avoided so it can be styled).
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'primary', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} size="sm" labelledBy="confirm-title">
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
