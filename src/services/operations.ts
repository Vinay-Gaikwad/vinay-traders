import type { AppData, Attendance, Deposit, InvoiceInput, LineItem, Payment, PaymentMethod, PaymentSplit, Product, PurchaseInput } from '../types'
import { commissionForItems } from '../utils/commission'
import { roundMoney, today, uid } from '../utils/format'
import { calculateInvoiceTotals, paymentStatus } from '../utils/invoice'
import { calculatePayroll } from '../utils/payroll'
import { convertUnits } from '../utils/units'

const finite = (value: number, name: string, minimum = 0) => { if (!Number.isFinite(value) || value < minimum) throw new Error(`${name} must be ${minimum > 0 ? 'greater than zero' : 'zero or greater'}.`) }
function validateItems(data: AppData, items: LineItem[], sale: boolean) {
 if (!items.length) throw new Error('Add at least one product.')
 for (const item of items) {
  const product = data.products.find(entry => entry.id === item.productId)
  if (!product) throw new Error(`${item.name || 'Product'} is no longer available.`)
  if (product.status !== 'Active') throw new Error(`${product.name} is inactive.`)
  finite(item.quantity, 'Quantity', .0001); finite(item.rate, 'Rate'); finite(item.discount, 'Discount'); finite(item.gst, 'GST')
  if (item.discount > 100 || item.gst > 100) throw new Error('Discount and GST must be between 0 and 100%.')
  if (sale && item.unit !== product.salesUnit) throw new Error(`Sell ${product.name} in ${product.salesUnit}.`)
  if (!sale && item.unit !== product.purchaseUnit && item.unit !== product.salesUnit) throw new Error(`Select ${product.purchaseUnit} or ${product.salesUnit} for ${product.name}.`)
  if (item.conversionFactor !== undefined) finite(item.conversionFactor, 'Conversion factor', .0001)
  if (sale && item.rate * (1 - item.discount / 100) < product.minimumSellingPrice) throw new Error(`${product.name} cannot sell below its minimum rate of ₹${product.minimumSellingPrice}.`)
 }
}
function validatePayment(total: number, paid: number, method: PaymentMethod, splits?: PaymentSplit[]) {
 finite(paid, 'Paid amount')
 if (method === 'Credit' && paid !== 0) throw new Error('A credit bill must have zero paid amount. Choose another method for a part payment.')
 if (method !== 'Cash' && method !== 'Mixed' && paid > total) throw new Error('Payment exceeds the invoice total. Only cash supports change.')
 if (method === 'Mixed') {
  if (!splits || splits.length < 2) throw new Error('Enter at least two payment methods for mixed payment.')
  if (new Set(splits.map(split => split.method)).size !== splits.length) throw new Error('Each payment method may only appear once.')
  splits.forEach(split => finite(split.amount, 'Payment split', .01))
  if (Math.abs(roundMoney(splits.reduce((sum, split) => sum + split.amount, 0)) - paid) > .001) throw new Error('Payment splits must equal the paid amount.')
  if (paid > total && (splits.find(split => split.method === 'Cash')?.amount ?? 0) < paid - total) throw new Error('Change cannot exceed the cash received.')
 }
}
function consumeStock(product: Product, quantity: number, allowNegative: boolean, batchId?: string): Product {
 if (!allowNegative && quantity > product.stock - product.reserved + .00001) throw new Error(`Insufficient stock for ${product.name} ${product.size}. Available: ${product.stock - product.reserved} ${product.salesUnit}.`)
 let remainder = quantity
 if (batchId && !product.batches.some(batch => batch.id === batchId)) throw new Error('Selected batch is no longer available.')
 const batches = product.batches.map(batch => {
  if (batchId && batch.id !== batchId) return batch
  const used = Math.min(Math.max(0, batch.remainingQty), remainder)
  remainder = Math.round((remainder - used) * 10000) / 10000
  return { ...batch, soldQty: batch.soldQty + used, remainingQty: Math.round((batch.remainingQty - used) * 10000) / 10000 }
 })
 if (batchId && remainder > .00001) throw new Error('Selected batch does not have enough stock.')
 return { ...product, stock: Math.round((product.stock - quantity) * 10000) / 10000, batches }
}
export function createInvoice(data: AppData, input: InvoiceInput): AppData {
 validateItems(data, input.items, true)
 const existing = input.id ? data.invoices.find(invoice => invoice.id === input.id) : undefined
 if (existing?.status === 'Completed') throw new Error('This invoice has already been posted. Create a new bill instead.')
 const customer = input.customerId ? data.customers.find(entry => entry.id === input.customerId) : undefined
 if (input.customerId && !customer) throw new Error('Select a valid customer.')
 const plumber = input.plumberId ? data.plumbers.find(entry => entry.id === input.plumberId) : undefined
 if (input.plumberId && (!plumber || plumber.status !== 'Active')) throw new Error('Select an active plumber.')
 const status = input.status ?? 'Completed'
 const totals = calculateInvoiceTotals(input.items, { paid: input.paid, previousBalance: customer?.balance ?? 0, roundOff: data.settings.roundOff, interstate: input.interstate, gstEnabled: data.settings.gstEnabled })
 if (status === 'Completed') {
  validatePayment(totals.grandTotal, input.paid, input.paymentMethod, input.payments)
  if (totals.due > 0 && !customer) throw new Error('Select or add a customer to record an outstanding balance.')
  if (customer && totals.due > 0 && customer.balance + totals.due > customer.creditLimit) throw new Error(`Credit limit exceeded for ${customer.name}. Available credit: ₹${Math.max(0, customer.creditLimit - customer.balance)}.`)
 }
 const next = structuredClone(data)
 const id = input.id ?? uid('invoice'), date = input.date ?? new Date().toISOString()
 const number = existing?.number ?? `${data.settings.invoicePrefix}-${data.settings.nextInvoiceNumber}`
 const commissionRate = plumber?.commissionRate ?? 0
 const commission = status === 'Completed' ? commissionForItems(input.items, totals, commissionRate, data.settings, data.products) : 0
 const invoice = { id, number, date, customerId: customer?.id, customerName: customer?.name ?? (input.customerName?.trim() || 'Walk-in customer'), customerMobile: customer?.mobile ?? input.customerMobile, customerAddress: customer?.address ?? input.customerAddress, plumberId: plumber?.id, items: structuredClone(input.items), totals, initialPaid: totals.paid, paymentMethod: input.paymentMethod, payments: input.payments, paymentStatus: paymentStatus(totals.grandTotal, totals.paid, input.paymentMethod), status, commission, commissionRate, commissionBasis: data.settings.commissionBasis, notes: input.notes ?? '', createdBy: 'Vinay Gaikwad' }
 next.invoices = [invoice, ...next.invoices.filter(entry => entry.id !== id)]
 if (!existing) next.settings.nextInvoiceNumber += 1
 if (status !== 'Completed') return next
 for (const item of input.items) {
  const index = next.products.findIndex(product => product.id === item.productId)
  const product = consumeStock(next.products[index], item.quantity, data.settings.allowNegativeStock, item.batchId)
  next.products[index] = product
  next.stockTransactions.unshift({ id: uid('stock'), productId: product.id, date, type: 'Sale', reference: number, in: 0, out: item.quantity, balance: product.stock, unit: product.salesUnit, location: product.warehouse, user: 'Vinay Gaikwad' })
 }
 if (customer) next.customers = next.customers.map(entry => entry.id === customer.id ? { ...entry, balance: roundMoney(entry.balance + totals.due), totalPurchase: roundMoney(entry.totalPurchase + totals.grandTotal), bills: entry.bills + 1, lastPurchase: date } : entry)
 if (plumber) next.plumbers = next.plumbers.map(entry => entry.id === plumber.id ? { ...entry, referralSales: roundMoney(entry.referralSales + totals.grandTotal), commissionEarned: roundMoney(entry.commissionEarned + commission), bills: entry.bills + 1 } : entry)
 return next
}
export function createPurchase(data: AppData, input: PurchaseInput): AppData {
 validateItems(data, input.items, false)
 const supplier = data.suppliers.find(entry => entry.id === input.supplierId)
 if (!supplier) throw new Error('Select a valid supplier.')
 if (!input.supplierInvoice.trim()) throw new Error('Enter the supplier invoice number.')
 const existing = input.id ? data.purchases.find(purchase => purchase.id === input.id) : undefined
 if (existing?.status === 'Completed') throw new Error('This purchase is already posted. Duplicate it to create a new purchase.')
 const status = input.status ?? 'Completed'
 if (status === 'Completed' && data.purchases.some(entry => entry.id !== input.id && entry.status === 'Completed' && entry.supplierId === input.supplierId && entry.supplierInvoice.toLowerCase() === input.supplierInvoice.trim().toLowerCase())) throw new Error('This supplier invoice has already been recorded.')
 const totals = calculateInvoiceTotals(input.items, { paid: input.paid, previousBalance: supplier.balance, roundOff: data.settings.roundOff, interstate: input.interstate, gstEnabled: data.settings.gstEnabled })
 if (status === 'Completed') validatePayment(totals.grandTotal, input.paid, input.paymentMethod, input.payments)
 const next = structuredClone(data), date = input.date ?? new Date().toISOString(), id = input.id ?? uid('purchase')
 const number = existing?.number ?? `PUR-${String(data.purchases.length + 101).padStart(4, '0')}`
 next.purchases = [{ id, number, date, supplierId: supplier.id, supplierInvoice: input.supplierInvoice.trim(), invoiceDate: input.invoiceDate ?? date.slice(0, 10), dueDate: input.dueDate ?? date.slice(0, 10), items: structuredClone(input.items), totals, initialPaid: totals.paid, paymentMethod: input.paymentMethod, paymentStatus: paymentStatus(totals.grandTotal, totals.paid, input.paymentMethod), payments: input.payments, status, notes: input.notes ?? '', createdBy: 'Vinay Gaikwad', attachmentName: input.attachmentName }, ...next.purchases.filter(entry => entry.id !== id)]
 if (status !== 'Completed') return next
 for (const item of input.items) {
  const product = next.products.find(entry => entry.id === item.productId)!
  const factor = item.unit === product.salesUnit ? 1 : item.conversionFactor ?? product.conversionFactor
  const added = convertUnits(item.quantity, factor), stock = Math.round((product.stock + added) * 10000) / 10000
  const batch = { id: uid('batch'), batchNumber: `${number}-${item.id}`, productId: product.id, date, originalPurchaseQty: item.quantity, purchaseUnit: item.unit, conversionFactor: factor, convertedQty: added, salesUnit: product.salesUnit, soldQty: 0, remainingQty: added, purchaseRate: item.rate }
  const purchaseRate = roundMoney(item.rate * (1 - item.discount / 100) / factor * product.conversionFactor)
  next.products = next.products.map(entry => entry.id === product.id ? { ...entry, stock, purchaseRate, batches: [...entry.batches, batch], supplierId: supplier.id } : entry)
  next.stockTransactions.unshift({ id: uid('stock'), productId: product.id, date, type: 'Purchase', reference: number, in: added, out: 0, balance: stock, unit: product.salesUnit, location: product.warehouse, user: 'Vinay Gaikwad' })
  if (purchaseRate !== product.purchaseRate) next.priceHistory.unshift({ id: uid('price'), productId: product.id, supplierId: supplier.id, date, previousPurchaseRate: product.purchaseRate, purchaseRate, previousSellingRate: product.sellingRate, sellingRate: product.sellingRate, reason: number })
 }
 next.suppliers = next.suppliers.map(entry => entry.id === supplier.id ? { ...entry, balance: roundMoney(entry.balance + totals.due) } : entry)
 return next
}
export function adjustStock(data: AppData, productId: string, delta: number, notes: string): AppData {
 if (!Number.isFinite(delta) || delta === 0) throw new Error('Enter a non-zero stock adjustment.')
 if (!notes.trim()) throw new Error('Enter a reason for this adjustment.')
 const product = data.products.find(entry => entry.id === productId)
 if (!product) throw new Error('Product not found.')
 const next = structuredClone(data), date = new Date().toISOString()
 let updated = delta < 0 ? consumeStock(product, -delta, data.settings.allowNegativeStock) : { ...product, stock: Math.round((product.stock + delta) * 10000) / 10000 }
 if (delta > 0) updated = { ...updated, batches: [...product.batches, { id: uid('batch'), batchNumber: 'ADJUSTMENT', productId, date, originalPurchaseQty: delta, purchaseUnit: product.salesUnit, conversionFactor: 1, convertedQty: delta, salesUnit: product.salesUnit, soldQty: 0, remainingQty: delta, purchaseRate: product.purchaseRate / product.conversionFactor }] }
 next.products = next.products.map(entry => entry.id === productId ? updated : entry)
 next.stockTransactions.unshift({ id: uid('stock'), productId, date, type: 'Adjustment', reference: 'Manual adjustment', in: Math.max(0, delta), out: Math.max(0, -delta), balance: updated.stock, unit: product.salesUnit, location: product.warehouse, user: 'Vinay Gaikwad', notes })
 return next
}
export function updateProductPrices(data: AppData, changes: { id: string; purchaseRate?: number; sellingRate?: number }[]): AppData {
 const next = structuredClone(data)
 for (const change of changes) {
  const product = next.products.find(entry => entry.id === change.id)
  if (!product) throw new Error('Product not found.')
  const purchaseRate = change.purchaseRate ?? product.purchaseRate, sellingRate = change.sellingRate ?? product.sellingRate
  finite(purchaseRate, 'Purchase rate'); finite(sellingRate, 'Selling rate')
  if (sellingRate < product.minimumSellingPrice) throw new Error(`Selling rate for ${product.name} is below its minimum price.`)
  if (purchaseRate === product.purchaseRate && sellingRate === product.sellingRate) continue
  next.priceHistory.unshift({ id: uid('price'), productId: product.id, supplierId: product.supplierId, date: new Date().toISOString(), previousPurchaseRate: product.purchaseRate, purchaseRate, previousSellingRate: product.sellingRate, sellingRate, reason: 'Price matrix update' })
  next.products = next.products.map(entry => entry.id === product.id ? { ...entry, purchaseRate, sellingRate } : entry)
 }
 return next
}
export function recordPayment(data: AppData, input: Omit<Payment, 'id' | 'date'> & { date?: string }): AppData {
 finite(input.amount, 'Amount', .01)
 if (input.method === 'Credit' || input.method === 'Mixed') throw new Error('Choose Cash, UPI, Card or Bank for an account payment.')
 const next = structuredClone(data), date = input.date ?? today(), kind = input.kind ?? 'Payment'
 if (input.entityType !== 'worker' && kind !== 'Payment') throw new Error('Adjustments apply only to worker accounts.')
 let available = 0
 if (input.entityType === 'customer') available = next.customers.find(entry => entry.id === input.entityId)?.balance ?? -1
 if (input.entityType === 'supplier') available = next.suppliers.find(entry => entry.id === input.entityId)?.balance ?? -1
 if (input.entityType === 'plumber') { const plumber = next.plumbers.find(entry => entry.id === input.entityId); available = plumber ? roundMoney(plumber.commissionEarned - plumber.commissionPaid) : -1 }
 if (input.entityType === 'worker') {
  const worker = next.workers.find(entry => entry.id === input.entityId)
  if (!worker) throw new Error('Worker not found.')
  const period = input.period ?? date.slice(0, 7)
  const paid = next.payments.filter(entry => entry.entityType === 'worker' && entry.entityId === worker.id && (entry.kind ?? 'Payment') === 'Payment' && entry.period === period).reduce((sum, entry) => sum + entry.amount, 0)
  available = kind === 'Payment' ? calculatePayroll(worker, next.attendance, { workingDays: next.settings.workingDays, period, paid, payments: next.payments }).balance : Infinity
 }
 if (available < 0) throw new Error('Account not found.')
 if (input.amount > available + .001) throw new Error(`Amount exceeds the pending balance of ₹${roundMoney(available)}.`)
 const payment: Payment = { ...input, id: uid('payment'), date, kind, period: input.entityType === 'worker' ? input.period ?? date.slice(0, 7) : input.period }
 next.payments.unshift(payment)
 if (input.entityType === 'customer') {
  next.customers = next.customers.map(entry => entry.id === input.entityId ? { ...entry, balance: roundMoney(entry.balance - input.amount) } : entry)
  let remaining = input.amount
  const invoices = [...next.invoices].filter(entry => entry.customerId === input.entityId && entry.status === 'Completed' && entry.totals.due > 0).sort((a, b) => a.date.localeCompare(b.date))
  for (const invoice of invoices) {
   const allocated = Math.min(remaining, invoice.totals.due); remaining = roundMoney(remaining - allocated)
   next.invoices = next.invoices.map(entry => entry.id === invoice.id ? { ...entry, initialPaid: entry.initialPaid ?? entry.totals.paid, totals: { ...entry.totals, paid: roundMoney(entry.totals.paid + allocated), due: roundMoney(entry.totals.due - allocated), totalDue: roundMoney(entry.totals.totalDue - allocated) }, paymentStatus: paymentStatus(entry.totals.grandTotal, entry.totals.paid + allocated) } : entry)
  }
 }
 if (input.entityType === 'supplier') {
  next.suppliers = next.suppliers.map(entry => entry.id === input.entityId ? { ...entry, balance: roundMoney(entry.balance - input.amount) } : entry)
  let remaining = input.amount
  const purchases = [...next.purchases].filter(entry => entry.supplierId === input.entityId && entry.status === 'Completed' && entry.totals.due > 0).sort((a, b) => a.date.localeCompare(b.date))
  for (const purchase of purchases) { const allocated = Math.min(remaining, purchase.totals.due); remaining = roundMoney(remaining - allocated); next.purchases = next.purchases.map(entry => entry.id === purchase.id ? { ...entry, initialPaid: entry.initialPaid ?? entry.totals.paid, totals: { ...entry.totals, paid: roundMoney(entry.totals.paid + allocated), due: roundMoney(entry.totals.due - allocated), totalDue: roundMoney(entry.totals.totalDue - allocated) }, paymentStatus: paymentStatus(entry.totals.grandTotal, entry.totals.paid + allocated) } : entry) }
 }
 if (input.entityType === 'plumber') next.plumbers = next.plumbers.map(entry => entry.id === input.entityId ? { ...entry, commissionPaid: roundMoney(entry.commissionPaid + input.amount) } : entry)
 return next
}
export function setAttendance(data: AppData, entry: Omit<Attendance, 'id'>): AppData {
 if (!data.workers.some(worker => worker.id === entry.workerId)) throw new Error('Worker not found.')
 finite(entry.overtime, 'Overtime')
 if (entry.checkIn && entry.checkOut && entry.checkOut <= entry.checkIn) throw new Error('Check-out must be after check-in.')
 const existing = data.attendance.find(item => item.workerId === entry.workerId && item.date === entry.date)
 return { ...data, attendance: [{ ...entry, id: existing?.id ?? uid('attendance') }, ...data.attendance.filter(item => item.workerId !== entry.workerId || item.date !== entry.date)] }
}
export function saveDeposit(data: AppData, entry: Omit<Deposit, 'id'>): AppData {
 finite(entry.expected, 'Expected amount'); finite(entry.paid, 'Paid amount')
 if (!entry.date) throw new Error('Choose a deposit date.')
 if (entry.paid > entry.expected) throw new Error('Deposit cannot exceed the expected amount.')
 if ((entry.status === 'Skipped' || entry.status === 'Holiday') && entry.paid > 0) throw new Error('A skipped or holiday entry cannot have a paid amount.')
 const existing = data.deposits.find(item => item.date === entry.date)
 const status = entry.status === 'Holiday' ? 'Holiday' : entry.paid === 0 ? 'Skipped' : entry.paid < entry.expected ? 'Partial' : 'Paid'
 return { ...data, deposits: [{ ...entry, status, id: existing?.id ?? uid('deposit') }, ...data.deposits.filter(item => item.date !== entry.date)] }
}
