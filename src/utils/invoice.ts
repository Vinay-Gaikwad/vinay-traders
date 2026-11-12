import type { InvoiceTotals, LineItem } from '../types'
import { roundMoney } from './format'
export interface InvoiceOptions { paid?: number; previousBalance?: number; roundOff?: boolean; interstate?: boolean; gstEnabled?: boolean }
export function calculateLineTotals(item: Pick<LineItem, 'quantity' | 'rate' | 'discount' | 'gst'>) {
 const subtotal = roundMoney(item.quantity * item.rate)
 const discount = roundMoney(subtotal * item.discount / 100)
 const taxable = roundMoney(subtotal - discount)
 const gst = 0
 return { subtotal, discount, taxable, gst, total: roundMoney(taxable + gst) }
}
export function calculateInvoiceTotals(items: Pick<LineItem, 'quantity' | 'rate' | 'discount' | 'gst'>[], options: InvoiceOptions = {}): InvoiceTotals {
 const lines = items.map(item => calculateLineTotals(item))
 const sum = (key: 'subtotal' | 'discount' | 'taxable' | 'gst') => roundMoney(lines.reduce((total, line) => total + line[key], 0))
 const subtotal = sum('subtotal'), discount = sum('discount'), taxable = sum('taxable'), gst = sum('gst')
 const unrounded = roundMoney(taxable + gst)
 const grandTotal = options.roundOff ? Math.round(unrounded) : unrounded
 const paid = roundMoney(Math.min(Math.max(0, options.paid ?? 0), grandTotal))
 const previousBalance = roundMoney(options.previousBalance ?? 0)
 const due = roundMoney(grandTotal - paid)
 const cgst = 0
 return { subtotal, discount, taxable, gst: 0, cgst, sgst: 0, igst: 0, roundOff: roundMoney(grandTotal - unrounded), grandTotal, previousBalance, paid, due, change: roundMoney(Math.max(0, (options.paid ?? 0) - grandTotal)), totalDue: roundMoney(due + previousBalance) }
}
export function paymentStatus(total: number, paid: number, method?: string): 'Paid' | 'Partial' | 'Pending' | 'Credit' { return paid >= total ? 'Paid' : paid > 0 ? 'Partial' : method === 'Credit' ? 'Credit' : 'Pending' }
