import { describe, expect, it } from 'vitest'
import { initialData } from '../mock-data'
import type { Attendance, Invoice, InvoiceInput, LineItem, Payment, PurchaseInput } from '../types'
import { calculateInvoiceTotals } from '../utils/invoice'
import { calculatePayroll } from '../utils/payroll'
import { adjustStock, createInvoice, createInvoiceReturn, createPurchase, recordReturnRefund } from './operations'

function billingFixture() {
 const data = structuredClone(initialData)
 const product = data.products[0]
 const customer = { ...data.customers[0], balance: 900, openingBalance: 900, creditLimit: 1000, totalPurchase: 0, bills: 0 }
 data.products = [product]
 data.customers = [customer]
 data.invoices = []
 data.quotations = []
 data.stockTransactions = []
 data.payments = []
 data.notifications = []
 data.settings.roundOff = false
 const input: InvoiceInput = {
  id: 'bill-draft-regression', date: '2026-11-12T09:00:00Z', customerId: customer.id,
  items: [{ id: 'bill-line-regression', productId: product.id, name: product.name, variant: product.variant,
   quantity: 2, unit: product.salesUnit, rate: 100, discount: 0, gst: 0, hsn: '' }],
  paid: 0, paymentMethod: 'Credit', status: 'Draft',
 }
 return { data, product, customer, input }
}

describe('Vinay Traders accounting regressions', () => {
 it('checks the full customer balance when completing a draft and books a valid part payment once', () => {
  const { data, product, customer, input } = billingFixture()
  const saved = createInvoice(data, input)
  expect(saved.products[0].stock).toBe(product.stock)
  expect(saved.customers[0].balance).toBe(customer.balance)
  expect(saved.stockTransactions).toHaveLength(0)
  const draftSnapshot = structuredClone(saved)
  expect(() => createInvoice(saved, { ...input, status: 'Completed' })).toThrow(/Credit limit exceeded/)
  expect(saved).toEqual(draftSnapshot)

  const completion: InvoiceInput = { ...input, status: 'Completed', paid: 150, paymentMethod: 'UPI' }
  const completed = createInvoice(saved, completion)
  expect(completed.invoices[0].totals).toMatchObject({ grandTotal: 200, paid: 150, due: 50, previousBalance: 900 })
  expect(completed.customers[0]).toMatchObject({ balance: 950, totalPurchase: 200, bills: 1 })
  expect(completed.products[0].stock).toBe(product.stock - 2)
  expect(completed.stockTransactions).toHaveLength(1)

  const savedAgain = createInvoice(completed, completion)
  expect(savedAgain.products[0].stock).toBe(product.stock - 2)
  expect(savedAgain.customers[0]).toMatchObject({ balance: 950, totalPurchase: 200, bills: 1 })
  expect(savedAgain.stockTransactions).toHaveLength(1)
  expect(savedAgain.invoices).toHaveLength(1)
  expect(savedAgain.invoices[0].number).toBe(saved.invoices[0].number)
  expect(savedAgain.settings.nextInvoiceNumber).toBe(saved.settings.nextInvoiceNumber)
 })

 it.each(['Draft', 'Held'] as const)('rejects changing a completed bill back to %s without altering accounting', status => {
  const { data, input } = billingFixture()
  const completed = createInvoice(data, { ...input, status: 'Completed', paid: 200, paymentMethod: 'Cash' })
  const snapshot = structuredClone(completed)
  expect(() => createInvoice(completed, { ...input, status })).toThrow(/cannot be changed back/)
  expect(completed).toEqual(snapshot)
 })

 it.each(['Revised', 'Returned'] as const)('preserves %s bill history after a return', status => {
  const { data, input } = billingFixture()
  const completed = createInvoice(data, { ...input, status: 'Completed', paid: 200, paymentMethod: 'Cash' })
  const returned = createInvoiceReturn(completed, input.id!, [{ lineId: input.items[0].id, quantity: 1 }], true)
  returned.invoices.find(invoice => invoice.id === input.id)!.status = status
  const snapshot = structuredClone(returned)
  expect(() => createInvoice(returned, { ...input, status: 'Completed', paid: 200, paymentMethod: 'Cash' })).toThrow(/Historical returned bills cannot be edited/)
  expect(returned).toEqual(snapshot)
 })

 it.each(['Revised', 'Returned'] as const)('requires the return workflow to create a %s bill', status => {
  const { data, input } = billingFixture()
  const snapshot = structuredClone(data)
  expect(() => createInvoice(data, { ...input, status })).toThrow(/sales return workflow/)
  expect(data).toEqual(snapshot)
 })

 it('retains a quotation draft identity, date, preparer and source when it is resumed and completed', () => {
  const { data, product, customer, input } = billingFixture()
  data.quotations = [{
   id: 'quotation-draft-source', number: 'QUO-DRAFT-REGRESSION', date: '2026-11-12', validUntil: '2026-11-30',
   customerId: customer.id, customerName: customer.name, items: structuredClone(input.items),
   totals: calculateInvoiceTotals(input.items), status: 'Sent', notes: '', createdBy: 'Original preparer',
  }]
  const saved = createInvoice(data, { ...input, quotationId: data.quotations[0].id })
  const original = saved.invoices[0]
  original.createdBy = 'Original preparer'
  const resaved = createInvoice(saved, { ...input, date: '2026-11-13T10:00:00Z' })
  expect(resaved.invoices[0]).toMatchObject({ id: original.id, number: original.number, date: original.date, createdBy: original.createdBy, quotationId: data.quotations[0].id })
  expect(resaved.quotations[0].status).toBe('Sent')
  expect(resaved.quotations[0].convertedInvoiceId).toBeUndefined()

  const completed = createInvoice(resaved, { ...input, date: '2026-11-14T11:00:00Z', status: 'Completed', paid: 200, paymentMethod: 'Cash' })
  expect(completed.invoices).toHaveLength(1)
  expect(completed.invoices[0]).toMatchObject({ id: original.id, number: original.number, date: original.date, createdBy: original.createdBy, quotationId: data.quotations[0].id, status: 'Completed' })
  expect(completed.quotations[0]).toMatchObject({ status: 'Converted', convertedInvoiceId: original.id })
  expect(completed.products[0].stock).toBe(product.stock - 2)
  expect(completed.stockTransactions).toHaveLength(1)
  expect(completed.settings.nextInvoiceNumber).toBe(saved.settings.nextInvoiceNumber)
  expect(() => createInvoice(completed, { ...input, id: 'duplicate-conversion', quotationId: data.quotations[0].id, paid: 200, paymentMethod: 'Cash', status: 'Completed' })).toThrow(/already been converted/)
  const returned = createInvoiceReturn(completed, original.id, [{ lineId: input.items[0].id, quantity: 1 }], true)
  const revised = returned.invoices[0]
  expect(returned.quotations[0].convertedInvoiceId).toBe(revised.id)
  const revisedSaved = createInvoice(returned, { ...input, id: revised.id, items: revised.items, status: 'Completed', paid: 100, paymentMethod: 'Cash' })
  expect(revisedSaved.products[0].stock).toBe(product.stock - 1)
  expect(revisedSaved.quotations[0].convertedInvoiceId).toBe(revised.id)
 })

 it('saves a purchase, preserves its supplier attachment, and increases stock once', () => {
  const before = structuredClone(initialData)
  before.settings.gstEnabled = true // Purchases must still be tax-free in this shop.
  const product = before.products[0]
  const supplier = before.suppliers[0]
  const input: PurchaseInput = {
   supplierId: supplier.id, supplierInvoice: 'REGRESSION-UNIT-2026-11',
   invoiceDate: '2026-11-12', dueDate: '2026-11-25', date: '2026-11-12',
   items: [{ id: 'line-test', productId: product.id, name: product.name, variant: product.variant, quantity: 2, unit: product.purchaseUnit, rate: 100, discount: 10, gst: 0, hsn: '' }],
   paid: 0, paymentMethod: 'Credit', status: 'Completed',
   attachmentName: 'supplier-bill.pdf', attachmentData: 'data:application/pdf;base64,JVBERi0xLjQK',
  }
  const updated = createPurchase(before, input)
  const purchase = updated.purchases.find(p => p.supplierInvoice === input.supplierInvoice)
  expect(purchase).toBeDefined()
  expect(purchase?.attachmentName).toBe('supplier-bill.pdf')
  expect(purchase?.attachmentData).toBe(input.attachmentData)
  expect(purchase?.totals.grandTotal).toBe(180)
  expect(updated.products.find(p => p.id === product.id)?.stock).toBe(product.stock + 2 * product.conversionFactor)
  expect(before.products.find(p => p.id === product.id)?.stock).toBe(product.stock)
 })

 it('records opening and edited stock as auditable inventory adjustments', () => {
  const before = structuredClone(initialData)
  const product = before.products[0]
  const added = adjustStock(before, product.id, 3, 'Opening stock correction')
  const after = added.products.find(p => p.id === product.id)
  expect(after?.stock).toBe(product.stock + 3)
  expect(added.stockTransactions[0].type).toBe('Adjustment')
  expect(added.stockTransactions[0].in).toBe(3)
  expect(added.stockTransactions[0].notes).toBe('Opening stock correction')
  expect(before.products.find(p => p.id === product.id)?.stock).toBe(product.stock)
 })

 it('returns only the current completed bill and records stock, refund and revision once', () => {
  const before = structuredClone(initialData)
  const product = before.products[0]
  const item: LineItem = {
   id: 'original-line', productId: product.id, name: product.name, variant: product.variant,
   hsn: '', quantity: 4, unit: product.salesUnit, rate: 100, discount: 0, gst: 0,
  }
  const totals = calculateInvoiceTotals([item], { paid: 400, roundOff: false })
  const invoice: Invoice = {
   id: 'bill-original', number: 'VT-RETURN-UNIT', date: '2026-11-12', customerName: 'Walk-in customer',
   items: [item], totals, initialPaid: 400, paymentMethod: 'Cash', paymentStatus: 'Paid',
   status: 'Completed', commission: 0, commissionRate: 0, commissionBasis: 'invoice-total',
   notes: '', createdBy: 'Regression test',
  }
  before.invoices = [invoice]
  before.invoiceReturns = []
  const returned = createInvoiceReturn(before, invoice.id, [{ lineId: item.id, quantity: 2 }], true, 'Test return')
  expect(returned.invoiceReturns).toHaveLength(1)
  const record = returned.invoiceReturns[0]
  expect(record.amount).toBe(200)
  expect(record.refundDue).toBe(200)
  expect(record.refundPaid).toBe(0)
  expect(returned.invoices.find(row => row.id === invoice.id)?.status).toBe('Revised')
  const newBill = returned.invoices.find(row => row.id === record.updatedInvoiceId)
  expect(newBill?.status).toBe('Completed')
  expect(newBill?.items[0].quantity).toBe(2)
  const restockedProduct = returned.products.find(row => row.id === product.id)
  expect(restockedProduct?.stock).toBe(product.stock + 2)
  expect(restockedProduct?.batches.length).toBe(product.batches.length + 1)
  expect(() => createInvoiceReturn(returned, invoice.id, [{ lineId: item.id, quantity: 1 }], true)).toThrow()
  expect(() => createInvoiceReturn(before, invoice.id, [{ lineId: item.id, quantity: 1 }, { lineId: item.id, quantity: 1 }], true)).toThrow()
  const settled = recordReturnRefund(returned, record.id, { amount: 75, method: 'UPI', reference: 'TX-001', date: '2026-11-13' })
  expect(settled.invoiceReturns[0].refundPaid).toBe(75)
  expect(settled.invoiceReturns[0].refunds?.[0].reference).toBe('TX-001')
  expect(() => recordReturnRefund(settled, record.id, { amount: 126, method: 'Cash', reference: 'too-much' })).toThrow()
 })

 it('shows zero outstanding salary after full payment without erasing earned basic pay', () => {
  const worker = { ...initialData.workers[0], id: 'w-regression', salaryType: 'Monthly Fixed' as const, salary: 10000, bonus: 0, bonusPeriods: [], advance: 0, deduction: 0, overtimeRate: 0 }
  const attendance: Attendance[] = [10, 11, 12].map(day => ({
   id: 'att-' + day, workerId: worker.id, date: '2026-11-' + day, status: 'Present',
   checkIn: '09:00', checkOut: '18:00', overtime: 0, notes: '',
  }))
  const unpaid = calculatePayroll(worker, attendance, { workingDays: 26, period: '2026-11', payments: [] })
  expect(unpaid.basicPay).toBe(1153.85)
  const payment: Payment = {
   id: 'pay-regression', date: '2026-11-13', entityType: 'worker', entityId: worker.id,
   amount: unpaid.netPay, method: 'Bank', reference: 'SAL-2026-11', notes: '',
   kind: 'Payment', period: '2026-11',
  }
  const settled = calculatePayroll(worker, attendance, { workingDays: 26, period: '2026-11', payments: [payment] })
  expect(settled.balance).toBe(0)
  expect(settled.basicPay).toBe(1153.85)
  expect(worker.salary).toBe(10000)
 })
})
