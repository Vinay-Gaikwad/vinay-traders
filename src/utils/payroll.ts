import type { Attendance, Payment, Worker } from '../types'
import { roundMoney } from './format'
export function calculatePayroll(worker: Worker, attendance: Attendance[], options: { workingDays?: number; period?: string; paid?: number; payments?: Payment[] } = {}) {
 const entries = attendance.filter(entry => entry.workerId === worker.id && (!options.period || entry.date.startsWith(options.period)))
 const count = (status: Attendance['status']) => entries.filter(entry => entry.status === status).length
 const present = count('Present'), absent = count('Absent'), halfDays = count('Half Day'), paidLeave = count('Paid Leave'), unpaidLeave = count('Unpaid Leave'), weeklyOff = count('Weekly Off')
 const paidDays = present + halfDays * .5 + paidLeave
 const workingDays = options.workingDays ?? 26
 if (!Number.isFinite(workingDays) || workingDays <= 0) throw new Error('Working days must be greater than zero.')
 const basicPay = roundMoney(worker.salaryType === 'Daily Wage' ? worker.dailyWage * paidDays : worker.salary * Math.min(paidDays / workingDays, 1))
 const overtime = entries.reduce((sum, entry) => sum + entry.overtime, 0)
 const overtimePay = roundMoney(overtime * worker.overtimeRate)
 const adjustments = (options.payments ?? []).filter(payment => payment.entityType === 'worker' && payment.entityId === worker.id && (!options.period || payment.period === options.period))
 const includeBaseline = !options.period || worker.adjustmentPeriod === options.period
 const adjustment = (kind: Payment['kind'], initial: number) => roundMoney((includeBaseline ? initial : 0) + adjustments.filter(payment => payment.kind === kind).reduce((sum, payment) => sum + payment.amount, 0))
 const bonus = adjustment('Bonus', worker.bonus), advance = adjustment('Advance', worker.advance), deduction = adjustment('Deduction', worker.deduction)
 const netPay = roundMoney(Math.max(0, basicPay + overtimePay + bonus - advance - deduction))
 const paid = roundMoney(options.paid ?? 0)
 return { present, absent, halfDays, paidLeave, unpaidLeave, weeklyOff, overtime, paidDays, basicPay, bonus, advance, deduction, overtimePay, netPay, paid, balance: roundMoney(Math.max(0, netPay - paid)) }
}

