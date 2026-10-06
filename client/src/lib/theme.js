// Per-restaurant accent gradients, used for section banners that have no photo.
const THEMES = {
  'baton-rouge': 'from-[#3b0d0c] via-[#5c1512] to-[#1c1917]',
  'wendel-clarks': 'from-[#4a0e0e] via-[#7f1d1d] to-[#1f2937]',
  'lions-den': 'from-[#1c1917] via-[#3f2d14] to-[#6b4f1d]',
  'festive-menu': 'from-[#0f3d2e] via-[#14532d] to-[#7f1d1d]',
}
const DEFAULT = 'from-brand-900 via-brand-800 to-brand-700'

export const themeGradient = (slug) => THEMES[slug] || DEFAULT

// Subtle dotted texture layered over gradients.
export const dotPattern = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
}
