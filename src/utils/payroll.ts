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
 const periodStart = options.period ? `${options.period}-01` : ''
 const periodEnd = options.period ? `${options.period}-31` : '9999-12-31'
 const scheduledBonus = roundMoney((worker.bonusPeriods ?? []).reduce((total, schedule) => {
  if (!Number.isFinite(schedule.perDay) || schedule.perDay <= 0) return total
  const from = schedule.from > periodStart ? schedule.from : periodStart
  const to = schedule.to < periodEnd ? schedule.to : periodEnd
  if (from > to) return total
  const eligibleDays = entries.filter(entry => entry.date >= from && entry.date <= to && ['Present', 'Half Day', 'Paid Leave'].includes(entry.status)).reduce((sum, entry) => sum + (entry.status === 'Half Day' ? .5 : 1), 0)
  return total + eligibleDays * schedule.perDay
 }, 0))
 const bonus = roundMoney(adjustment('Bonus', worker.bonus) + scheduledBonus), advance = adjustment('Advance', worker.advance), deduction = adjustment('Deduction', worker.deduction)
 const netPay = roundMoney(Math.max(0, basicPay + overtimePay + bonus - advance - deduction))
 const recordedPayments = (options.payments ?? []).filter(payment => payment.entityType === 'worker' && payment.entityId === worker.id && (payment.kind ?? 'Payment') === 'Payment' && (!options.period || (payment.period ?? payment.date.slice(0, 7)) === options.period))
 const paid = roundMoney(options.paid ?? recordedPayments.reduce((sum, payment) => sum + payment.amount, 0))
 return { present, absent, halfDays, paidLeave, unpaidLeave, weeklyOff, overtime, paidDays, basicPay, bonus, advance, deduction, overtimePay, netPay, paid, balance: roundMoney(Math.max(0, netPay - paid)) }
}

