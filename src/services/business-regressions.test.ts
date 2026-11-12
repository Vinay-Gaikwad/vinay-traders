import { describe, expect, it } from 'vitest'
import { initialData } from '../mock-data'
import type { Attendance } from '../types'
import { calculatePayroll } from '../utils/payroll'
import { createExpense, createInvoice, saveDeposit, setAttendance } from './operations'

describe('Vinay Traders phase 04–16 accounting regressions', () => {
 it('calculates a new customer bill without GST even when legacy settings contain tax', () => {
  const before = structuredClone(initialData)
  const product = before.products[0]
  const unitRate = Math.max(100, product.minimumSellingPrice + 20, product.sellingRate + 20)
  before.settings.gstEnabled = true
  before.products = before.products.map(item => item.id === product.id ? { ...item, stock: item.stock + 10 } : item)
  const result = createInvoice(before, {
   customerName: 'Regression walk-in',
   items: [{ id: 'sale-line', productId: product.id, name: product.name, variant: product.variant,
    quantity: 1, unit: product.salesUnit, rate: unitRate, discount: 0, gst: 18, hsn: '' }],
   paid: unitRate, paymentMethod: 'Cash', status: 'Completed',
  })
  const bill = result.invoices[0]
  expect(bill.totals.gst).toBe(0)
  expect(bill.totals.grandTotal).toBe(unitRate)
  expect(bill.totals.due).toBe(0)
  expect(result.products.find(item => item.id === product.id)?.stock).toBe(product.stock + 9)
 })

 it('tracks separate same-day Pat Sanstha deposits and changes only the selected plan', () => {
  const before = structuredClone(initialData)
  before.deposits = []
  before.settings.depositPlans = [
   { id: 'sanstha-a', name: 'Daily savings', dailyAmount: 500, active: true },
   { id: 'sanstha-b', name: 'Cooperative savings', dailyAmount: 350, active: true },
  ]
  const input = (planId: string, paid: number) => ({
   date: '2026-11-13', expected: 0, paid, status: 'Paid' as const,
   method: 'UPI' as const, receipt: '', notes: '', planId,
  })
  const first = saveDeposit(before, input('sanstha-a', 500))
  const second = saveDeposit(first, input('sanstha-b', 350))
  expect(second.deposits).toHaveLength(2)
  const a = second.deposits.find(deposit => deposit.planId === 'sanstha-a')!
  const b = second.deposits.find(deposit => deposit.planId === 'sanstha-b')!
  expect(a.expected).toBe(500)
  expect(b.expected).toBe(350)
  const amended = saveDeposit(second, input('sanstha-a', 250))
  expect(amended.deposits).toHaveLength(2)
  expect(amended.deposits.find(row => row.planId === 'sanstha-a')).toMatchObject({
   id: a.id, paid: 250, expected: 500, status: 'Partial',
  })
  expect(amended.deposits.find(row => row.planId === 'sanstha-b')?.paid).toBe(350)
  expect(() => saveDeposit(before, input('missing-plan', 100))).toThrow()
  expect(() => saveDeposit(before, input('sanstha-b', 351))).toThrow()
 })

 it('separates personal and shop expenses and preserves original data', () => {
  const before = structuredClone(initialData)
  before.expenses = []
  const personal = createExpense(before, { date: '2026-11-13', kind: 'Personal', title: 'Owner travel',
   amount: 130, method: 'Cash', notes: '' })
  const shop = createExpense(personal, { date: '2026-11-13', kind: 'Shop', title: 'Cleaning products',
   amount: 245, method: 'UPI', notes: 'Shop supplies' })
  expect(before.expenses).toHaveLength(0)
  expect(shop.expenses).toHaveLength(2)
  expect(shop.expenses.filter(row => row.kind === 'Personal').reduce((sum, row) => sum + row.amount, 0)).toBe(130)
  expect(shop.expenses.filter(row => row.kind === 'Shop').reduce((sum, row) => sum + row.amount, 0)).toBe(245)
  expect(shop.expenses.reduce((sum, row) => sum + row.amount, 0)).toBe(375)
  expect(() => createExpense(shop, { date: '2026-11-13', kind: 'Personal', title: '',
   amount: 20, method: 'Cash', notes: '' })).toThrow()
 })

 it('updates attendance without duplicates and pays bonuses in only their scheduled period', () => {
  const before = structuredClone(initialData)
  const worker = { ...before.workers[0], id: 'worker-scheduled-bonus', bonus: 0,
   adjustmentPeriod: '2026-11', salary: 10000, salaryType: 'Monthly Fixed' as const,
   bonusPeriods: [{ id: 'bp-1', from: '2026-11-10', to: '2026-11-12', perDay: 25 }],
  }
  before.workers = [worker]
  before.attendance = []
  const entry = (date: string, status: Attendance['status']): Omit<Attendance, 'id'> => ({
   workerId: worker.id, date, status, checkIn: '', checkOut: '', overtime: 0, notes: '',
  })
  const a = setAttendance(before, entry('2026-11-10', 'Present'))
  const b = setAttendance(a, entry('2026-11-11', 'Half Day'))
  const c = setAttendance(b, entry('2026-11-12', 'Absent'))
  expect(calculatePayroll(worker, c.attendance, { workingDays: 26, period: '2026-11', payments: [] }).bonus).toBe(37.5)
  const revised = setAttendance(c, entry('2026-11-12', 'Paid Leave'))
  expect(revised.attendance).toHaveLength(3)
  expect(calculatePayroll(worker, revised.attendance, { workingDays: 26, period: '2026-11', payments: [] }).bonus).toBe(62.5)
 })
})
