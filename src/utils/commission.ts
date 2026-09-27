import type { InvoiceTotals, LineItem, Product, Settings } from '../types'
import { roundMoney } from './format'
import { calculateLineTotals } from './invoice'
export function calculatePlumberCommission(totals: Pick<InvoiceTotals, 'taxable' | 'grandTotal'>, rate: number, basis: Settings['commissionBasis'] = 'before-gst'): number { return roundMoney((basis === 'before-gst' ? totals.taxable : totals.grandTotal) * rate / 100) }
export function commissionForItems(items: LineItem[], totals: InvoiceTotals, rate: number, settings: Settings, products: Product[]): number {
 const excluded = items.filter(item => settings.excludedProductIds.includes(item.productId) || settings.excludedCategories.includes(products.find(product => product.id === item.productId)?.category ?? ''))
 const excludedValue = excluded.reduce((sum, item) => { const line = calculateLineTotals(item, settings.gstEnabled); return sum + (settings.commissionBasis === 'before-gst' ? line.taxable : line.total) }, 0)
 const basis = settings.commissionBasis === 'before-gst' ? totals.taxable : totals.grandTotal
 return roundMoney(Math.max(0, basis - excludedValue) * rate / 100)
}
