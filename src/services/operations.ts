import type { AppData, Attendance, Deposit, Expense, InvoiceInput, InvoiceReturn, InvoiceReturnItem, LineItem, Payment, PaymentMethod, PaymentSplit, Product, PurchaseInput, QuotationInput } from '../types'
import { commissionForItems } from '../utils/commission'
import { formatCurrency, roundMoney, today, uid } from '../utils/format'
import { calculateInvoiceTotals, calculateLineTotals, paymentStatus } from '../utils/invoice'
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
 const quotation = input.quotationId ? data.quotations.find(entry => entry.id === input.quotationId) : undefined
 if (input.quotationId && !quotation) throw new Error('Quotation not found.')
 if (input.quotationId && quotation?.convertedInvoiceId && quotation.convertedInvoiceId !== input.id) throw new Error(`${quotation.number} has already been converted to a bill.`)
 const customer = input.customerId ? data.customers.find(entry => entry.id === input.customerId) : undefined
 if (input.customerId && !customer) throw new Error('Select a valid customer.')
 const plumber = input.plumberId ? data.plumbers.find(entry => entry.id === input.plumberId) : undefined
 if (input.plumberId && (!plumber || plumber.status !== 'Active')) throw new Error('Select an active plumber.')
 const status = input.status ?? 'Completed'
 const previousBalance = existing && customer?.id === existing.customerId ? Math.max(0, (customer?.balance ?? 0) - existing.totals.due) : customer?.balance ?? 0
 const totals = calculateInvoiceTotals(input.items, { paid: input.paid, previousBalance, roundOff: data.settings.roundOff, interstate: input.interstate, gstEnabled: data.settings.gstEnabled })
 if (status === 'Completed') {
  validatePayment(totals.grandTotal, input.paid, input.paymentMethod, input.payments)
  if (totals.due > 0 && !customer) throw new Error('Select or add a customer to record an outstanding balance.')
  if (customer && totals.due > 0 && previousBalance + totals.due > customer.creditLimit) throw new Error(`Credit limit exceeded for ${customer.name}. Available credit: ₹${Math.max(0, customer.creditLimit - previousBalance)}.`)
 }
 const next = structuredClone(data)
 const id = input.id ?? uid('invoice'), date = input.date ?? new Date().toISOString()
 const number = existing?.number ?? `${data.settings.invoicePrefix}-${data.settings.nextInvoiceNumber}`
 const commissionRate = plumber?.commissionRate ?? 0
 const commission = status === 'Completed' ? commissionForItems(input.items, totals, commissionRate, data.settings, data.products) : 0
 const rewardAmount = roundMoney(commission * (plumber?.rewardRate ?? 0) / 100)
 const invoice = { id, number, date, dueDate: input.dueDate ?? (totals.due > 0 ? date.slice(0, 10) : undefined), customerId: customer?.id, customerName: customer?.name ?? (input.customerName?.trim() || 'Walk-in customer'), customerMobile: customer?.mobile ?? input.customerMobile, customerAddress: customer?.address ?? input.customerAddress, plumberId: plumber?.id, items: structuredClone(input.items), totals, initialPaid: totals.paid, paymentMethod: input.paymentMethod, payments: input.payments, paymentStatus: paymentStatus(totals.grandTotal, totals.paid, input.paymentMethod), status, commission, commissionRate, commissionBasis: data.settings.commissionBasis, notes: input.notes ?? '', createdBy: 'Vinay Gaikwad' }
 next.invoices = [invoice, ...next.invoices.filter(entry => entry.id !== id)]
 if (!existing) next.settings.nextInvoiceNumber += 1
 if (status !== 'Completed') return next
 if (quotation) next.quotations = next.quotations.map(entry => entry.id === quotation.id ? { ...entry, status: 'Converted', convertedInvoiceId: id } : entry)
 if (existing?.status === 'Completed') {
  for (const oldItem of existing.items) {
   const product = next.products.find(entry => entry.id === oldItem.productId)
   if (!product) continue
   const restored = roundMoney(product.stock + oldItem.quantity)
   next.products = next.products.map(entry => entry.id === product.id ? { ...entry, stock: restored, batches: [...entry.batches, { id: uid('batch'), batchNumber: `EDIT-${existing.number}-${oldItem.id}`, productId: product.id, date, originalPurchaseQty: oldItem.quantity, purchaseUnit: oldItem.unit, conversionFactor: 1, convertedQty: oldItem.quantity, salesUnit: product.salesUnit, soldQty: 0, remainingQty: oldItem.quantity, purchaseRate: product.purchaseRate }] } : entry)
  }
  next.stockTransactions = next.stockTransactions.filter(transaction => !(transaction.type === 'Sale' && transaction.reference === existing.number))
  if (existing.customerId) next.customers = next.customers.map(entry => entry.id === existing.customerId ? { ...entry, balance: roundMoney(Math.max(0, entry.balance - existing.totals.due)), totalPurchase: roundMoney(Math.max(0, entry.totalPurchase - existing.totals.grandTotal)), bills: Math.max(0, entry.bills - 1) } : entry)
  if (existing.plumberId) next.plumbers = next.plumbers.map(entry => entry.id === existing.plumberId ? { ...entry, referralSales: roundMoney(Math.max(0, entry.referralSales - existing.totals.grandTotal)), commissionEarned: roundMoney(Math.max(0, entry.commissionEarned - existing.commission)), rewardBalance: roundMoney(Math.max(0, (entry.rewardBalance ?? 0) - roundMoney(existing.commission * (entry.rewardRate ?? 0) / 100))), bills: Math.max(0, entry.bills - 1) } : entry)
 }
 for (const item of input.items) {
  const index = next.products.findIndex(product => product.id === item.productId)
  const product = consumeStock(next.products[index], item.quantity, data.settings.allowNegativeStock, item.batchId)
  next.products[index] = product
  next.stockTransactions.unshift({ id: uid('stock'), productId: product.id, date, type: 'Sale', reference: number, in: 0, out: item.quantity, balance: product.stock, unit: product.salesUnit, location: product.warehouse, user: 'Vinay Gaikwad' })
 }
 for (const product of next.products.filter(entry => entry.stock <= entry.reorderLevel)) {
  const href = `/inventory/products/${product.id}`
  if (!next.notifications.some(notification => notification.type === 'low-stock' && notification.href === href && !notification.read)) next.notifications.unshift({ id: uid('notice'), type: 'low-stock', title: `Low stock · ${product.name}`, description: `${product.stock} ${product.salesUnit} remaining. Reorder level is ${product.reorderLevel}.`, date: date.slice(0, 10), read: false, href, severity: product.stock <= 0 ? 'danger' : 'warning' })
 }
 if (customer) next.customers = next.customers.map(entry => entry.id === customer.id ? { ...entry, balance: roundMoney(entry.balance + totals.due), totalPurchase: roundMoney(entry.totalPurchase + totals.grandTotal), bills: entry.bills + 1, lastPurchase: date } : entry)
 if (customer && totals.due > 0) next.notifications.unshift({ id: uid('notice'), type: 'payment-due', title: `Payment due · ${customer.name}`, description: `${formatCurrency(totals.due)} remains due on invoice ${number}${input.dueDate ? ` on ${input.dueDate}` : ''}.`, date: input.dueDate ?? date.slice(0, 10), read: false, href: `/billing/invoices/${id}`, severity: 'warning' })
 if (plumber) next.plumbers = next.plumbers.map(entry => entry.id === plumber.id ? { ...entry, referralSales: roundMoney(entry.referralSales + totals.grandTotal), commissionEarned: roundMoney(entry.commissionEarned + commission), rewardBalance: roundMoney((entry.rewardBalance ?? 0) + rewardAmount), bills: entry.bills + 1 } : entry)
 return next
}
export function createPurchase(data: AppData, input: PurchaseInput): AppData {
 validateItems(data, input.items, false)
 const supplier = data.suppliers.find(entry => entry.id === input.supplierId)
 if (!supplier) throw new Error('Select a valid supplier.')
 if (!input.supplierInvoice.trim()) throw new Error('Enter the supplier invoice number.')
 const existing = input.id ? data.purchases.find(purchase => purchase.id === input.id) : undefined
 const status = input.status ?? 'Completed'
 if (status === 'Completed' && data.purchases.some(entry => entry.id !== input.id && entry.status === 'Completed' && entry.supplierId === input.supplierId && entry.supplierInvoice.toLowerCase() === input.supplierInvoice.trim().toLowerCase())) throw new Error('This supplier invoice has already been recorded.')
 const oldSupplier = existing ? data.suppliers.find(entry => entry.id === existing.supplierId) : undefined
 const previousBalance = existing && oldSupplier?.id === supplier.id ? Math.max(0, supplier.balance - existing.totals.due) : supplier.balance
 const totals = calculateInvoiceTotals(input.items, { paid: input.paid, previousBalance, roundOff: data.settings.roundOff, interstate: input.interstate, gstEnabled: data.settings.gstEnabled })
 if (status === 'Completed') validatePayment(totals.grandTotal, input.paid, input.paymentMethod, input.payments)
 const next = structuredClone(data), date = input.date ?? new Date().toISOString(), id = input.id ?? uid('purchase')
 const number = existing?.number ?? `PUR-${String(data.purchases.length + 101).padStart(4, '0')}`
 if (existing?.status === 'Completed') {
  for (const oldItem of existing.items) {
   const product = next.products.find(entry => entry.id === oldItem.productId)
   if (!product) continue
   const factor = oldItem.unit === product.salesUnit ? 1 : oldItem.conversionFactor ?? product.conversionFactor
   const oldBatch = product.batches.find(batch => batch.batchNumber === `${existing.number}-${oldItem.id}`)
   const removed = oldBatch?.remainingQty ?? convertUnits(oldItem.quantity, factor)
   next.products = next.products.map(entry => entry.id === product.id ? { ...entry, stock: Math.round((entry.stock - removed) * 10000) / 10000, batches: entry.batches.filter(batch => batch.batchNumber !== `${existing.number}-${oldItem.id}`) } : entry)
  }
  next.stockTransactions = next.stockTransactions.filter(transaction => !(transaction.type === 'Purchase' && transaction.reference === existing.number))
 }
  next.purchases = [{ id, number, date, supplierId: supplier.id, supplierInvoice: input.supplierInvoice.trim(), invoiceDate: input.invoiceDate ?? date.slice(0, 10), dueDate: input.dueDate ?? date.slice(0, 10), items: structuredClone(input.items), totals, initialPaid: totals.paid, paymentMethod: input.paymentMethod, paymentStatus: paymentStatus(totals.grandTotal, totals.paid, input.paymentMethod), payments: input.payments, status, notes: input.notes ?? '', createdBy: 'Vinay Gaikwad', attachmentName: input.attachmentName ?? existing?.attachmentName, attachmentData: input.attachmentData ?? existing?.attachmentData }, ...next.purchases.filter(entry => entry.id !== id)]
 if (existing?.status === 'Completed') next.suppliers = next.suppliers.map(entry => entry.id === existing.supplierId ? { ...entry, balance: roundMoney(Math.max(0, entry.balance - existing.totals.due)) } : entry)
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
export function createInvoiceReturn(data: AppData, invoiceId: string, returnedItems: { lineId: string; quantity: number }[], restock: boolean, notes = ''): AppData {
 const invoice = data.invoices.find(entry => entry.id === invoiceId && (entry.status === 'Completed' || entry.status === 'Revised'))
 if (!invoice) throw new Error('Completed invoice not found.')
 if (!returnedItems.length) throw new Error('Select at least one item to return.')
 const next = structuredClone(data), date = new Date().toISOString(), returned: InvoiceReturnItem[] = []
 for (const selection of returnedItems) {
  finite(selection.quantity, 'Return quantity', .0001)
  const item = invoice.items.find(line => line.id === selection.lineId)
  if (!item) throw new Error('A selected invoice line no longer exists.')
  if (selection.quantity > item.quantity + .00001) throw new Error(`Return quantity exceeds the remaining quantity for ${item.name}.`)
  const amount = calculateLineTotals({ ...item, quantity: selection.quantity }).total
  returned.push({ invoiceLineId: item.id, productId: item.productId, name: item.name, variant: item.variant, quantity: selection.quantity, unit: item.unit, rate: item.rate, discount: item.discount, amount })
 }
 const returnedAmount = roundMoney(returned.reduce((sum, item) => sum + item.amount, 0))
 const remainingItems = invoice.items.map(item => {
  const quantity = returned.filter(line => line.invoiceLineId === item.id).reduce((sum, line) => sum + line.quantity, 0)
  return { ...item, quantity: roundMoney(item.quantity - quantity) }
 }).filter(item => item.quantity > .00001)
 const paidForNewBill = Math.min(invoice.totals.paid, calculateInvoiceTotals(remainingItems, { roundOff: data.settings.roundOff }).grandTotal)
 const totals = calculateInvoiceTotals(remainingItems, { paid: paidForNewBill, previousBalance: invoice.totals.previousBalance, roundOff: data.settings.roundOff })
 const relatedReturns = (next.invoiceReturns ?? []).filter(entry => entry.originalInvoiceId === invoice.id).length
 const returnNumber = `${invoice.number}-RET-${relatedReturns + 1}`
 const updatedId = uid('invoice')
 const commission = invoice.plumberId ? commissionForItems(remainingItems, totals, invoice.commissionRate, next.settings, next.products) : 0
 const commissionReversed = roundMoney(Math.max(0, invoice.commission - commission))
 const returnRecord: InvoiceReturn = { id: uid('return'), number: returnNumber, originalInvoiceId: invoice.id, updatedInvoiceId: updatedId, date, items: returned, amount: returnedAmount, restocked: restock, commissionReversed, notes: notes.trim() }
 if (restock) for (const line of returned) {
  const product = next.products.find(entry => entry.id === line.productId)
  if (!product) continue
  const stock = roundMoney(product.stock + line.quantity)
  next.products = next.products.map(entry => entry.id === product.id ? { ...entry, stock } : entry)
  next.stockTransactions.unshift({ id: uid('stock'), productId: product.id, date, type: 'Sale Return', reference: returnNumber, in: line.quantity, out: 0, balance: stock, unit: line.unit, location: product.warehouse, user: 'Vinay Gaikwad', notes: `Returned from ${invoice.number}` })
 }
 const updatedInvoice = { ...invoice, id: updatedId, number: `${invoice.number}-R${relatedReturns + 1}`, date, items: remainingItems.map(item => ({ ...item, id: uid('line') })), totals, initialPaid: totals.paid, paymentStatus: paymentStatus(totals.grandTotal, totals.paid, invoice.paymentMethod), commission, notes: `${invoice.notes}${invoice.notes ? '\n' : ''}Revised after return ${returnNumber}.`, status: 'Completed' as const }
 next.invoices = [updatedInvoice, ...next.invoices.map(entry => entry.id === invoice.id ? { ...entry, status: 'Revised' as const, notes: `${entry.notes}${entry.notes ? '\n' : ''}Revised by ${updatedInvoice.number} after return ${returnNumber}.` } : entry)]
 next.invoiceReturns = [returnRecord, ...(next.invoiceReturns ?? [])]
 if (invoice.customerId) next.customers = next.customers.map(entry => entry.id === invoice.customerId ? { ...entry, balance: roundMoney(Math.max(0, entry.balance + totals.due - invoice.totals.due)), totalPurchase: roundMoney(Math.max(0, entry.totalPurchase + totals.grandTotal - invoice.totals.grandTotal)) } : entry)
 if (invoice.plumberId) {
  const reversedReward = roundMoney(commissionReversed * (next.plumbers.find(entry => entry.id === invoice.plumberId)?.rewardRate ?? 0) / 100)
  next.plumbers = next.plumbers.map(entry => entry.id === invoice.plumberId ? { ...entry, referralSales: roundMoney(Math.max(0, entry.referralSales - returnedAmount)), commissionEarned: roundMoney(Math.max(0, entry.commissionEarned - commissionReversed)), rewardBalance: roundMoney(Math.max(0, (entry.rewardBalance ?? 0) - reversedReward)) } : entry)
 }
 return next
}

export function createExpense(data: AppData, input: Omit<Expense, 'id'>): AppData {
 finite(input.amount, 'Expense amount', .01)
 if (!input.title.trim()) throw new Error('Enter an expense description.')
 if (!input.date) throw new Error('Choose an expense date.')
 if (input.method === 'Credit' || input.method === 'Mixed') throw new Error('Choose a single payment method for this expense.')
 return { ...structuredClone(data), expenses: [{ ...input, title: input.title.trim(), id: uid('expense') }, ...(data.expenses ?? [])] }
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
export function updateProductDiscounts(data: AppData, changes: { id: string; defaultDiscount: number }[]): AppData {
 const next = structuredClone(data)
 for (const change of changes) {
  finite(change.defaultDiscount, 'Discount')
  if (change.defaultDiscount > 100) throw new Error('Discount must be between 0 and 100%.')
  if (!next.products.some(product => product.id === change.id)) throw new Error('Product not found.')
  next.products = next.products.map(product => product.id === change.id ? { ...product, defaultDiscount: roundMoney(change.defaultDiscount) } : product)
 }
 return next
}
export function createQuotation(data: AppData, input: QuotationInput): AppData {
 validateItems(data, input.items, true)
 if (!input.customerName.trim()) throw new Error('Enter a customer name.')
 const existing = input.id ? data.quotations.find(quotation => quotation.id === input.id) : undefined
 const date = input.date ?? today()
 const totals = calculateInvoiceTotals(input.items, { paid: 0, previousBalance: 0, roundOff: data.settings.roundOff, gstEnabled: false })
 const id = input.id ?? uid('quotation')
 const number = existing?.number ?? `QUO-${String(data.quotations.length + 1).padStart(4, '0')}`
 const validUntil = input.validUntil ?? new Date(`${date}T00:00:00`).toISOString().slice(0, 10)
 const quotation = { id, number, date, validUntil, customerId: input.customerId, customerName: input.customerName.trim(), customerMobile: input.customerMobile, customerAddress: input.customerAddress, items: structuredClone(input.items), totals, status: input.status ?? existing?.status ?? 'Draft', notes: input.notes ?? '', createdBy: 'Vinay Gaikwad' } as const
 return { ...structuredClone(data), quotations: [quotation, ...data.quotations.filter(entry => entry.id !== id)] }
}
export function deleteQuotation(data: AppData, quotationId: string): AppData {
 const quotation = data.quotations.find(entry => entry.id === quotationId)
 if (!quotation) throw new Error('Quotation not found.')
 if (quotation.convertedInvoiceId || quotation.status === 'Converted') throw new Error('Converted quotations cannot be deleted. Open the linked bill instead.')
 return { ...structuredClone(data), quotations: data.quotations.filter(entry => entry.id !== quotationId) }
}
export function recordPayment(data: AppData, input: Omit<Payment, 'id' | 'date'> & { date?: string }): AppData {
 finite(input.amount, 'Amount', .01)
 if (input.method === 'Credit' || input.method === 'Mixed') throw new Error('Choose Cash, UPI, Card or Bank for an account payment.')
 const next = structuredClone(data), date = input.date ?? today(), kind = input.kind ?? 'Payment'
 if (input.entityType !== 'worker' && kind !== 'Payment') throw new Error('Adjustments apply only to worker accounts.')
 let available = 0
 if (input.entityType === 'customer') available = Math.max(next.customers.find(entry => entry.id === input.entityId)?.balance ?? -1, next.invoices.filter(entry => entry.customerId === input.entityId && entry.status === 'Completed').reduce((sum, entry) => sum + entry.totals.due, 0))
 if (input.entityType === 'supplier') available = Math.max(next.suppliers.find(entry => entry.id === input.entityId)?.balance ?? -1, next.purchases.filter(entry => entry.supplierId === input.entityId && entry.status === 'Completed').reduce((sum, entry) => sum + entry.totals.due, 0))
 if (input.entityType === 'customer' && !next.customers.some(entry => entry.id === input.entityId)) available = -1
 if (input.entityType === 'supplier' && !next.suppliers.some(entry => entry.id === input.entityId)) available = -1
 if (input.entityType === 'customer' && input.invoiceId) {
  const invoice = next.invoices.find(entry => entry.id === input.invoiceId && entry.customerId === input.entityId && entry.status === 'Completed')
  if (!invoice) throw new Error('Invoice not found.')
  available = invoice.totals.due
 }
 if (input.entityType === 'supplier' && input.purchaseId) {
  const purchase = next.purchases.find(entry => entry.id === input.purchaseId && entry.supplierId === input.entityId && entry.status === 'Completed')
  if (!purchase) throw new Error('Purchase not found.')
  available = purchase.totals.due
 }
 if (input.entityType === 'plumber') { const plumber = next.plumbers.find(entry => entry.id === input.entityId); available = plumber ? kind === 'Bonus' ? roundMoney(plumber.rewardBalance ?? 0) : roundMoney(plumber.commissionEarned - plumber.commissionPaid) : -1 }
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
  next.customers = next.customers.map(entry => entry.id === input.entityId ? { ...entry, balance: roundMoney(Math.max(0, entry.balance - input.amount)) } : entry)
  let remaining = input.amount
  const invoices = [...next.invoices].filter(entry => entry.customerId === input.entityId && entry.status === 'Completed' && entry.totals.due > 0).sort((a, b) => a.id === input.invoiceId ? -1 : b.id === input.invoiceId ? 1 : a.date.localeCompare(b.date))
  for (const invoice of invoices) {
   const allocated = Math.min(remaining, invoice.totals.due); remaining = roundMoney(remaining - allocated)
   next.invoices = next.invoices.map(entry => entry.id === invoice.id ? { ...entry, initialPaid: entry.initialPaid ?? entry.totals.paid, totals: { ...entry.totals, paid: roundMoney(entry.totals.paid + allocated), due: roundMoney(entry.totals.due - allocated), totalDue: roundMoney(entry.totals.totalDue - allocated) }, paymentStatus: paymentStatus(entry.totals.grandTotal, entry.totals.paid + allocated) } : entry)
  }
 }
 if (input.entityType === 'supplier') {
  next.suppliers = next.suppliers.map(entry => entry.id === input.entityId ? { ...entry, balance: roundMoney(Math.max(0, entry.balance - input.amount)) } : entry)
  let remaining = input.amount
  const purchases = [...next.purchases].filter(entry => entry.supplierId === input.entityId && entry.status === 'Completed' && entry.totals.due > 0).sort((a, b) => a.id === input.purchaseId ? -1 : b.id === input.purchaseId ? 1 : a.date.localeCompare(b.date))
  for (const purchase of purchases) { const allocated = Math.min(remaining, purchase.totals.due); remaining = roundMoney(remaining - allocated); next.purchases = next.purchases.map(entry => entry.id === purchase.id ? { ...entry, initialPaid: entry.initialPaid ?? entry.totals.paid, totals: { ...entry.totals, paid: roundMoney(entry.totals.paid + allocated), due: roundMoney(entry.totals.due - allocated), totalDue: roundMoney(entry.totals.totalDue - allocated) }, paymentStatus: paymentStatus(entry.totals.grandTotal, entry.totals.paid + allocated) } : entry) }
 }
 if (input.entityType === 'plumber') next.plumbers = next.plumbers.map(entry => entry.id === input.entityId ? kind === 'Bonus' ? { ...entry, rewardBalance: roundMoney((entry.rewardBalance ?? 0) - input.amount), rewardPaid: roundMoney((entry.rewardPaid ?? 0) + input.amount) } : { ...entry, commissionPaid: roundMoney(entry.commissionPaid + input.amount) } : entry)
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
  const plan = data.settings.depositPlans?.find(item => item.id === entry.planId)
  const planId = plan?.id ?? entry.planId ?? 'deposit-default'
  const planName = plan?.name ?? entry.planName ?? 'Shop Deposit'
  const expected = entry.expected || plan?.dailyAmount || data.settings.dailyDeposit
  if (entry.paid > expected) throw new Error('Deposit cannot exceed the expected amount.')
  const existing = data.deposits.find(item => item.date === entry.date && (item.planId ?? 'deposit-default') === planId)
  const status = entry.status === 'Holiday' ? 'Holiday' : entry.paid === 0 ? 'Skipped' : entry.paid < expected ? 'Partial' : 'Paid'
  return { ...data, deposits: [{ ...entry, expected, planId, planName, status, id: existing?.id ?? uid('deposit') }, ...data.deposits.filter(item => item.id !== existing?.id)] }
}
