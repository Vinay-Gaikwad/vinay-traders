export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100
export const formatCurrency = (value: number, decimals = 2): string => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
export const formatNumber = (value: number): string => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
export const today = (): string => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export const appLocale = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const key = import.meta.env.VITE_CLIENT_RELEASE === 'true' ? 'vinay-traders-client-data-v2' : 'vinay-traders-data-v1'
      const stored = JSON.parse(window.localStorage.getItem(key) ?? 'null') as { settings?: { language?: string } } | null
      if (stored?.settings?.language) return stored.settings.language === 'mr' ? 'mr-IN' : 'en-IN'
    } catch { /* use the document language fallback */ }
  }
  return typeof document !== 'undefined' && document.documentElement.lang === 'mr' ? 'mr-IN' : 'en-IN'
}
export const formatDate = (value: string, options?: Intl.DateTimeFormatOptions): string => { const date = new Date(value.length === 10 ? `${value}T12:00:00` : value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(appLocale(), options ?? { day: '2-digit', month: 'short', year: 'numeric' }) }
export const uid = (prefix = 'id'): string => `${prefix}-${crypto.randomUUID()}`
export const initials = (name: string): string => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
export const currency = formatCurrency
