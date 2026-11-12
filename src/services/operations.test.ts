import { describe, expect, it } from 'vitest'
import { initialData } from '../mock-data'
import type { Attendance, Invoice, LineItem, Payment, PurchaseInput } from '../types'
import { calculateInvoiceTotals } from '../utils/invoice'
import { calculatePayroll } from '../utils/payroll'
import { adjustStock, createInvoiceReturn, createPurchase, recordReturnRefund } from './operations'

describe('Vinay Traders accounting regressions', () => {
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
