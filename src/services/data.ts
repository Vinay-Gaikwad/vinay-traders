import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clientInitialData, initialData } from '../mock-data'
import { clientRelease, supabase, supabaseConfigured } from '../lib/supabase'
import { priceListCatalog } from '../assets/price-list-catalog'
import type { AppData, Attendance, Customer, Deposit, Invoice, LineItem, Payment, Plumber, PriceHistory, Product, Purchase, RolePermission, Settings, StockTransaction, Supplier, Worker } from '../types'

const STORAGE_KEY = 'vinay-traders-app-data-v1'
// Bump this key whenever a new client distribution must start from the clean
// catalogue-only workspace instead of inheriting data from an older build.
const CLIENT_STORAGE_KEY = 'vinay-traders-client-data-v2'
const PENDING_SYNC_KEY = 'vinay-traders-pending-sync-v1'
const QUERY_KEY = ['vinay-traders-data'] as const
let memoryData: AppData | undefined

const numberValue = (value: unknown, fallback = 0) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
const optionalString = (value: unknown) => value === null || value === undefined || value === '' ? undefined : String(value)
const optionalNumber = (value: unknown) => value === null || value === undefined ? undefined : numberValue(value)
const jsonValue = <T>(value: unknown, fallback: T): T => value === null || value === undefined ? fallback : value as T

function normalizeAppData(value: Partial<AppData>): AppData {
 const seed = clientRelease ? clientInitialData : initialData
 const sourceProducts = value.products ?? seed.products
 const productIds = new Set(sourceProducts.map(product => product.id))
 return {
  ...structuredClone(seed), ...value,
  products: [...sourceProducts, ...priceListCatalog.filter(product => !productIds.has(product.id))].map(product => ({ ...product, barcodes: product.barcodes ?? (product.barcode ? [{ value: product.barcode, unit: product.salesUnit }] : []), defaultDiscount: product.defaultDiscount ?? 0 })),
  quotations: value.quotations ?? [], expenses: value.expenses ?? [], invoiceReturns: value.invoiceReturns ?? [],
  settings: { ...seed.settings, ...value.settings, depositPlans: value.settings?.depositPlans ?? seed.settings.depositPlans ?? [] },
 }
}

function readLocalData(): AppData {
 const storageKey = clientRelease ? CLIENT_STORAGE_KEY : STORAGE_KEY
 try {
  const raw = localStorage.getItem(storageKey)
  if (raw) {
   const parsed = JSON.parse(raw) as Partial<AppData>
   const normalized = normalizeAppData(parsed)
   if (clientRelease && (!parsed.suppliers || parsed.suppliers.length === 0)) normalized.suppliers = structuredClone(clientInitialData.suppliers)
   return normalized
  }
 } catch { /* fall back to the seed */ }
 return normalizeAppData(clientRelease ? clientInitialData : initialData)
}

function saveLocalData(data: AppData) {
 memoryData = data
 try {
  localStorage.setItem(clientRelease ? CLIENT_STORAGE_KEY : STORAGE_KEY, JSON.stringify(data))
  if (supabaseConfigured) localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(data))
 } catch { /* persistence is best effort in private mode */ }
}

function readPendingSync(): AppData | undefined {
 try {
  const raw = localStorage.getItem(PENDING_SYNC_KEY)
  return raw ? JSON.parse(raw) as AppData : undefined
 } catch { return undefined }
}

function clearPendingSync() {
 try { localStorage.removeItem(PENDING_SYNC_KEY) } catch { /* persistence is best effort in private mode */ }
}

export function getData(): AppData { if (!memoryData) memoryData = readLocalData(); return memoryData }

function productRow(product: Product) { return { id: product.id, name: product.name, brand: product.brand, category: product.category, subcategory: product.subcategory, product_family: product.productFamily, sku: product.sku, barcode: product.barcode, barcodes: product.barcodes, default_discount: product.defaultDiscount ?? 0, hsn: product.hsn, gst: product.gst, size: product.size, variant: product.variant, attributes: product.attributes, purchase_unit: product.purchaseUnit, sales_unit: product.salesUnit, base_unit: product.baseUnit, conversion_factor: product.conversionFactor, purchase_rate: product.purchaseRate, selling_rate: product.sellingRate, mrp: product.mrp, minimum_selling_price: product.minimumSellingPrice, stock: product.stock, reserved: product.reserved, reorder_level: product.reorderLevel, minimum_stock: product.minimumStock, rack: product.rack, shelf: product.shelf, warehouse: product.warehouse, supplier_id: product.supplierId, images: product.images, notes: product.notes, status: product.status, historical_source: product.historicalSource } }
function supplierRow(supplier: Supplier) { return { id: supplier.id, name: supplier.name, mobile: supplier.mobile, gstin: supplier.gstin, address: supplier.address, balance: supplier.balance, notes: supplier.notes } }
function customerRow(customer: Customer) { return { id: customer.id, name: customer.name, mobile: customer.mobile, alternate_mobile: customer.alternateMobile, area: customer.area, address: customer.address, delivery_address: customer.deliveryAddress, gstin: customer.gstin, type: customer.type, opening_balance: customer.openingBalance, credit_limit: customer.creditLimit, credit_days: customer.creditDays, plumber_id: customer.plumberId, notes: customer.notes, status: customer.status, balance: customer.balance, total_purchase: customer.totalPurchase, bills: customer.bills, last_purchase: customer.lastPurchase } }
function plumberRow(plumber: Plumber) { return { id: plumber.id, name: plumber.name, mobile: plumber.mobile, alternate_mobile: plumber.alternateMobile, area: plumber.area, address: plumber.address, joined_date: plumber.joinedDate, commission_rate: plumber.commissionRate, reward_rate: plumber.rewardRate ?? 0, reward_balance: plumber.rewardBalance ?? 0, reward_paid: plumber.rewardPaid ?? 0, bank: plumber.bank, upi: plumber.upi, notes: plumber.notes, status: plumber.status, referral_sales: plumber.referralSales, commission_earned: plumber.commissionEarned, commission_paid: plumber.commissionPaid, customers: plumber.customers, bills: plumber.bills } }
function workerRow(worker: Worker) { return { id: worker.id, name: worker.name, mobile: worker.mobile, address: worker.address, role: worker.role, joined_date: worker.joinedDate, salary_type: worker.salaryType, salary: worker.salary, daily_wage: worker.dailyWage, bonus: worker.bonus, bonus_periods: worker.bonusPeriods ?? [], advance: worker.advance, deduction: worker.deduction, overtime_rate: worker.overtimeRate, bank: worker.bank, upi: worker.upi, adjustment_period: worker.adjustmentPeriod, emergency_contact: worker.emergencyContact, dob: worker.dob, notes: worker.notes, status: worker.status } }
function attendanceRow(entry: Attendance) { return { id: entry.id, worker_id: entry.workerId, date: entry.date, status: entry.status, check_in: entry.checkIn || null, check_out: entry.checkOut || null, overtime: entry.overtime, notes: entry.notes } }
function lineRow(item: LineItem, parentKey: 'invoice_id' | 'purchase_id', parentId: string) { return { id: item.id, [parentKey]: parentId, product_id: item.productId, name: item.name, variant: item.variant, hsn: item.hsn, quantity: item.quantity, unit: item.unit, rate: item.rate, discount: item.discount, gst: item.gst, conversion_factor: item.conversionFactor, batch_id: item.batchId } }
function invoiceRow(invoice: Invoice) { return { id: invoice.id, number: invoice.number, date: invoice.date, due_date: invoice.dueDate, customer_id: invoice.customerId, customer_name: invoice.customerName, customer_mobile: invoice.customerMobile, customer_address: invoice.customerAddress, plumber_id: invoice.plumberId, totals: invoice.totals, initial_paid: invoice.initialPaid ?? invoice.totals.paid, payment_method: invoice.paymentMethod, payment_status: invoice.paymentStatus, payment_splits: invoice.payments, status: invoice.status, commission: invoice.commission, commission_rate: invoice.commissionRate, commission_basis: invoice.commissionBasis, notes: invoice.notes, created_by: invoice.createdBy } }
function purchaseRow(purchase: Purchase) { return { id: purchase.id, number: purchase.number, date: purchase.date, supplier_id: purchase.supplierId, supplier_invoice: purchase.supplierInvoice, invoice_date: purchase.invoiceDate, due_date: purchase.dueDate, totals: purchase.totals, initial_paid: purchase.initialPaid ?? purchase.totals.paid, payment_method: purchase.paymentMethod, payment_status: purchase.paymentStatus, payment_splits: purchase.payments, status: purchase.status, notes: purchase.notes, created_by: purchase.createdBy, attachment_name: purchase.attachmentName } }
function paymentRow(payment: Payment) { return { id: payment.id, date: payment.date, entity_type: payment.entityType, entity_id: payment.entityId, amount: payment.amount, method: payment.method, reference: payment.reference, notes: payment.notes, kind: payment.kind ?? 'Payment', invoice_id: payment.invoiceId, purchase_id: payment.purchaseId, period: payment.period } }
function depositRow(deposit: Deposit) { return { id: deposit.id, date: deposit.date, expected: deposit.expected, paid: deposit.paid, status: deposit.status, method: deposit.method, receipt: deposit.receipt, notes: deposit.notes, attachment_name: deposit.attachmentName } }
function stockRow(entry: StockTransaction) { return { id: entry.id, product_id: entry.productId, date: entry.date, type: entry.type, reference: entry.reference, quantity_in: entry.in, quantity_out: entry.out, balance: entry.balance, unit: entry.unit, location: entry.location, user_name: entry.user, notes: entry.notes } }
function priceRow(entry: PriceHistory) { return { id: entry.id, product_id: entry.productId, supplier_id: entry.supplierId, date: entry.date, previous_purchase_rate: entry.previousPurchaseRate, purchase_rate: entry.purchaseRate, previous_selling_rate: entry.previousSellingRate, selling_rate: entry.sellingRate, reason: entry.reason } }

function mapBatch(row: Record<string, unknown>) { return { id: String(row.id), batchNumber: String(row.batch_number ?? ''), productId: String(row.product_id), date: String(row.date), originalPurchaseQty: numberValue(row.original_purchase_qty), purchaseUnit: String(row.purchase_unit ?? 'Piece'), conversionFactor: numberValue(row.conversion_factor, 1), convertedQty: numberValue(row.converted_qty), salesUnit: String(row.sales_unit ?? 'Piece'), soldQty: numberValue(row.sold_qty), remainingQty: numberValue(row.remaining_qty), purchaseRate: numberValue(row.purchase_rate), rollNumber: optionalString(row.roll_number), width: optionalNumber(row.width), length: optionalNumber(row.length), weight: optionalNumber(row.weight), wastage: optionalNumber(row.wastage) }
}
function mapProduct(row: Record<string, unknown>, batches: Record<string, unknown>[]): Product { const salesUnit = String(row.sales_unit ?? 'Piece'); const barcode = String(row.barcode ?? ''); return { id: String(row.id), name: String(row.name ?? ''), brand: String(row.brand ?? ''), category: String(row.category ?? ''), subcategory: optionalString(row.subcategory), productFamily: optionalString(row.product_family), sku: String(row.sku ?? ''), barcode, barcodes: jsonValue(row.barcodes, barcode ? [{ value: barcode, unit: salesUnit }] : []), defaultDiscount: numberValue(row.default_discount), hsn: String(row.hsn ?? ''), gst: numberValue(row.gst), size: String(row.size ?? ''), variant: String(row.variant ?? ''), attributes: jsonValue(row.attributes, {}), purchaseUnit: String(row.purchase_unit ?? 'Piece'), salesUnit, baseUnit: String(row.base_unit ?? 'Piece'), conversionFactor: numberValue(row.conversion_factor, 1), purchaseRate: numberValue(row.purchase_rate), sellingRate: numberValue(row.selling_rate), mrp: numberValue(row.mrp), minimumSellingPrice: numberValue(row.minimum_selling_price), stock: numberValue(row.stock), reserved: numberValue(row.reserved), reorderLevel: numberValue(row.reorder_level), minimumStock: numberValue(row.minimum_stock), rack: String(row.rack ?? ''), shelf: optionalString(row.shelf), warehouse: String(row.warehouse ?? ''), supplierId: String(row.supplier_id ?? ''), images: jsonValue(row.images, []), notes: String(row.notes ?? ''), status: row.status === 'Inactive' ? 'Inactive' : 'Active', batches: batches.filter(batch => String(batch.product_id) === String(row.id)).map(mapBatch), historicalSource: jsonValue(row.historical_source, undefined) }
}
function mapSupplier(row: Record<string, unknown>): Supplier { return { id: String(row.id), name: String(row.name ?? ''), mobile: String(row.mobile ?? ''), gstin: String(row.gstin ?? ''), address: String(row.address ?? ''), balance: numberValue(row.balance), notes: optionalString(row.notes) } }
function mapCustomer(row: Record<string, unknown>): Customer { return { id: String(row.id), name: String(row.name ?? ''), mobile: String(row.mobile ?? ''), alternateMobile: optionalString(row.alternate_mobile), area: String(row.area ?? ''), address: String(row.address ?? ''), deliveryAddress: optionalString(row.delivery_address), gstin: String(row.gstin ?? ''), type: ['Walk-in', 'Regular', 'Business', 'Contractor'].includes(String(row.type)) ? row.type as Customer['type'] : 'Regular', openingBalance: numberValue(row.opening_balance), creditLimit: numberValue(row.credit_limit), creditDays: numberValue(row.credit_days), plumberId: optionalString(row.plumber_id), notes: String(row.notes ?? ''), status: row.status === 'Inactive' ? 'Inactive' : 'Active', balance: numberValue(row.balance), totalPurchase: numberValue(row.total_purchase), bills: numberValue(row.bills), lastPurchase: optionalString(row.last_purchase) } }
function mapPlumber(row: Record<string, unknown>): Plumber { return { id: String(row.id), name: String(row.name ?? ''), mobile: String(row.mobile ?? ''), alternateMobile: optionalString(row.alternate_mobile), area: String(row.area ?? ''), address: String(row.address ?? ''), joinedDate: String(row.joined_date ?? ''), commissionRate: numberValue(row.commission_rate), rewardRate: numberValue(row.reward_rate), rewardBalance: numberValue(row.reward_balance), rewardPaid: numberValue(row.reward_paid), bank: optionalString(row.bank), upi: optionalString(row.upi), notes: String(row.notes ?? ''), status: row.status === 'Inactive' ? 'Inactive' : 'Active', referralSales: numberValue(row.referral_sales), commissionEarned: numberValue(row.commission_earned), commissionPaid: numberValue(row.commission_paid), customers: numberValue(row.customers), bills: numberValue(row.bills) } }
function mapWorker(row: Record<string, unknown>): Worker { return { id: String(row.id), name: String(row.name ?? ''), mobile: String(row.mobile ?? ''), address: String(row.address ?? ''), role: String(row.role ?? ''), joinedDate: String(row.joined_date ?? ''), salaryType: row.salary_type === 'Daily Wage' ? 'Daily Wage' : 'Monthly Fixed', salary: numberValue(row.salary), dailyWage: numberValue(row.daily_wage), bonus: numberValue(row.bonus), bonusPeriods: jsonValue(row.bonus_periods, []), advance: numberValue(row.advance), deduction: numberValue(row.deduction), overtimeRate: numberValue(row.overtime_rate), bank: String(row.bank ?? ''), upi: String(row.upi ?? ''), adjustmentPeriod: optionalString(row.adjustment_period), emergencyContact: optionalString(row.emergency_contact), dob: optionalString(row.dob), notes: String(row.notes ?? ''), status: row.status === 'Inactive' ? 'Inactive' : 'Active' } }
function mapAttendance(row: Record<string, unknown>): Attendance { return { id: String(row.id), workerId: String(row.worker_id), date: String(row.date), status: row.status as Attendance['status'], checkIn: String(row.check_in ?? ''), checkOut: String(row.check_out ?? ''), overtime: numberValue(row.overtime), notes: String(row.notes ?? '') } }
function mapLine(row: Record<string, unknown>): LineItem { return { id: String(row.id), productId: String(row.product_id), name: String(row.name ?? ''), variant: String(row.variant ?? ''), hsn: String(row.hsn ?? ''), quantity: numberValue(row.quantity), unit: String(row.unit ?? 'Piece'), rate: numberValue(row.rate), discount: numberValue(row.discount), gst: numberValue(row.gst), conversionFactor: optionalNumber(row.conversion_factor), batchId: optionalString(row.batch_id) } }
function mapInvoice(row: Record<string, unknown>, items: Record<string, unknown>[]): Invoice { return { id: String(row.id), number: String(row.number), date: String(row.date), dueDate: optionalString(row.due_date), customerId: optionalString(row.customer_id), customerName: String(row.customer_name ?? 'Walk-in customer'), customerMobile: optionalString(row.customer_mobile), customerAddress: optionalString(row.customer_address), plumberId: optionalString(row.plumber_id), items: items.filter(item => String(item.invoice_id) === String(row.id)).map(mapLine), totals: jsonValue(row.totals, initialData.invoices[0]?.totals), initialPaid: numberValue(row.initial_paid), paymentMethod: row.payment_method as Invoice['paymentMethod'], payments: jsonValue(row.payment_splits, undefined), paymentStatus: row.payment_status as Invoice['paymentStatus'], status: row.status as Invoice['status'], commission: numberValue(row.commission), commissionRate: numberValue(row.commission_rate), commissionBasis: row.commission_basis === 'invoice-total' ? 'invoice-total' : 'before-gst', notes: String(row.notes ?? ''), createdBy: String(row.created_by ?? '') } }
function mapPurchase(row: Record<string, unknown>, items: Record<string, unknown>[]): Purchase { return { id: String(row.id), number: String(row.number), date: String(row.date), supplierId: String(row.supplier_id), supplierInvoice: String(row.supplier_invoice), invoiceDate: String(row.invoice_date), dueDate: String(row.due_date), items: items.filter(item => String(item.purchase_id) === String(row.id)).map(mapLine), totals: jsonValue(row.totals, initialData.purchases[0]?.totals), initialPaid: numberValue(row.initial_paid), paymentMethod: row.payment_method as Purchase['paymentMethod'], payments: jsonValue(row.payment_splits, undefined), paymentStatus: row.payment_status as Purchase['paymentStatus'], status: row.status as Purchase['status'], notes: String(row.notes ?? ''), createdBy: String(row.created_by ?? ''), attachmentName: optionalString(row.attachment_name) } }
function mapPayment(row: Record<string, unknown>): Payment { return { id: String(row.id), date: String(row.date), entityType: row.entity_type as Payment['entityType'], entityId: String(row.entity_id), amount: numberValue(row.amount), method: row.method as Payment['method'], reference: String(row.reference ?? ''), notes: String(row.notes ?? ''), kind: row.kind as Payment['kind'], invoiceId: optionalString(row.invoice_id), purchaseId: optionalString(row.purchase_id), period: optionalString(row.period) } }
function mapDeposit(row: Record<string, unknown>): Deposit { return { id: String(row.id), date: String(row.date), expected: numberValue(row.expected), paid: numberValue(row.paid), status: row.status as Deposit['status'], method: row.method as Deposit['method'], receipt: String(row.receipt ?? ''), notes: String(row.notes ?? ''), attachmentName: optionalString(row.attachment_name) } }
function mapStock(row: Record<string, unknown>): StockTransaction { return { id: String(row.id), productId: String(row.product_id), date: String(row.date), type: row.type as StockTransaction['type'], reference: String(row.reference ?? ''), in: numberValue(row.quantity_in), out: numberValue(row.quantity_out), balance: numberValue(row.balance), unit: String(row.unit ?? 'Piece'), location: String(row.location ?? ''), user: String(row.user_name ?? ''), notes: optionalString(row.notes) } }
function mapPrice(row: Record<string, unknown>): PriceHistory { return { id: String(row.id), productId: String(row.product_id), supplierId: String(row.supplier_id ?? ''), date: String(row.date), previousPurchaseRate: numberValue(row.previous_purchase_rate), purchaseRate: numberValue(row.purchase_rate), previousSellingRate: numberValue(row.previous_selling_rate), sellingRate: numberValue(row.selling_rate), reason: String(row.reason ?? '') } }

async function selectRows(table: string) {
 if (!supabase) return [] as Record<string, unknown>[]
 const { data, error } = await supabase.from(table).select('*')
 if (error) throw error
 return (data ?? []) as Record<string, unknown>[]
}

async function loadRemoteData(): Promise<AppData> {
 if (!supabase) return getData()
 try {
  const pending = readPendingSync()
  if (pending) {
   await saveRemoteData(pending)
   clearPendingSync()
   return structuredClone(pending)
  }
  const stateRows = await selectRows('vt_app_state')
  if (stateRows[0]?.data) {
   const normalized = normalizeAppData(stateRows[0].data as Partial<AppData>)
   if (normalized.products.length !== (stateRows[0].data as AppData).products?.length) await saveRemoteData(normalized)
   return normalized
  }
  if (!stateRows.length) { await saveRemoteData(initialData); return structuredClone(initialData) }
  const [products, batches, suppliers, customers, plumbers, workers, attendance, invoices, invoiceItems, purchases, purchaseItems, payments, deposits, stocks, prices, settingsRows, permissions, notifications] = await Promise.all([
   selectRows('vt_products'), selectRows('vt_inventory_batches'), selectRows('vt_suppliers'), selectRows('vt_customers'), selectRows('vt_plumbers'), selectRows('vt_workers'), selectRows('vt_attendance'), selectRows('vt_invoices'), selectRows('vt_invoice_items'), selectRows('vt_purchases'), selectRows('vt_purchase_items'), selectRows('vt_payments'), selectRows('vt_deposits'), selectRows('vt_stock_transactions'), selectRows('vt_price_history'), selectRows('vt_settings'), selectRows('vt_role_permissions'), selectRows('vt_notifications'),
  ])
  const empty = products.length === 0 && suppliers.length === 0 && customers.length === 0 && settingsRows.length === 0
  if (empty) { await saveRemoteData(initialData); return structuredClone(initialData) }
  const settings = jsonValue(settingsRows[0]?.settings, initialData.settings) as Settings
  const mappedPermissions: RolePermission[] = permissions.map(row => ({ role: String(row.role), module: String(row.module), view: Boolean(row.can_view), create: Boolean(row.can_create), edit: Boolean(row.can_edit), delete: Boolean(row.can_delete) }))
  return normalizeAppData({ version: 1, products: products.map(row => mapProduct(row, batches)), customers: customers.map(mapCustomer), plumbers: plumbers.map(mapPlumber), suppliers: suppliers.map(mapSupplier), invoices: invoices.map(row => mapInvoice(row, invoiceItems)), purchases: purchases.map(row => mapPurchase(row, purchaseItems)), quotations: [], workers: workers.map(mapWorker), attendance: attendance.map(mapAttendance), deposits: deposits.map(mapDeposit), payments: payments.map(mapPayment), expenses: [], invoiceReturns: [], stockTransactions: stocks.map(mapStock), priceHistory: prices.map(mapPrice), settings: { ...settings, permissions: mappedPermissions }, notifications: notifications.map(row => ({ id: String(row.id), type: String(row.type ?? 'info'), title: String(row.title), description: String(row.description ?? ''), date: String(row.date), read: Boolean(row.read), href: String(row.href ?? '/'), severity: row.severity as 'info' | 'warning' | 'danger' })) })
 } catch (error) {
  console.error('Supabase bootstrap failed', error)
  throw error
 }
}

async function replaceRows(table: string, rows: Record<string, unknown>[]) {
 if (!supabase) return
 const { error: deleteError } = await supabase.from(table).delete().not('id', 'is', null)
 if (deleteError) throw deleteError
 if (!rows.length) return
 const { error } = await supabase.from(table).insert(rows)
 if (error) throw error
}

async function syncNormalizedData(data: AppData) {
 if (!supabase) return
 try {
  const batches = data.products.flatMap(product => product.batches.map(batch => ({ id: batch.id, product_id: batch.productId, batch_number: batch.batchNumber, date: batch.date, original_purchase_qty: batch.originalPurchaseQty, purchase_unit: batch.purchaseUnit, conversion_factor: batch.conversionFactor, converted_qty: batch.convertedQty, sales_unit: batch.salesUnit, sold_qty: batch.soldQty, remaining_qty: batch.remainingQty, purchase_rate: batch.purchaseRate, roll_number: batch.rollNumber, width: batch.width, length: batch.length, weight: batch.weight, wastage: batch.wastage })))
  const invoiceItems = data.invoices.flatMap(invoice => invoice.items.map(item => lineRow(item, 'invoice_id', invoice.id)))
  const purchaseItems = data.purchases.flatMap(purchase => purchase.items.map(item => lineRow(item, 'purchase_id', purchase.id)))
  await replaceRows('vt_inventory_batches', [])
  await replaceRows('vt_invoice_items', [])
  await replaceRows('vt_purchase_items', [])
  await replaceRows('vt_payment_splits', [])
  await replaceRows('vt_invoices', data.invoices.map(invoiceRow))
  await replaceRows('vt_purchases', data.purchases.map(purchaseRow))
  await replaceRows('vt_products', data.products.map(productRow))
  await replaceRows('vt_suppliers', data.suppliers.map(supplierRow))
  await replaceRows('vt_customers', data.customers.map(customerRow))
  await replaceRows('vt_plumbers', data.plumbers.map(plumberRow))
  await replaceRows('vt_workers', data.workers.map(workerRow))
  await replaceRows('vt_attendance', data.attendance.map(attendanceRow))
  await replaceRows('vt_payments', data.payments.map(paymentRow))
  await replaceRows('vt_deposits', data.deposits.map(depositRow))
  await replaceRows('vt_stock_transactions', data.stockTransactions.map(stockRow))
  await replaceRows('vt_price_history', data.priceHistory.map(priceRow))
  await replaceRows('vt_settings', [{ id: 'default', settings: { ...data.settings, permissions: [] } }])
  await replaceRows('vt_role_permissions', data.settings.permissions.map(permission => ({ role: permission.role, module: permission.module, can_view: permission.view, can_create: permission.create, can_edit: permission.edit, can_delete: permission.delete })))
  await replaceRows('vt_notifications', data.notifications.map(notification => ({ id: notification.id, type: notification.type, title: notification.title, description: notification.description, date: notification.date, read: notification.read, href: notification.href, severity: notification.severity })))
  await replaceRows('vt_inventory_batches', batches)
  await replaceRows('vt_invoice_items', invoiceItems)
  await replaceRows('vt_purchase_items', purchaseItems)
 } catch (error) {
  console.warn('Normalized Supabase projection sync skipped', error)
 }
}

async function saveRemoteData(data: AppData) {
 if (!supabase) return
 const { error: stateError } = await supabase.from('vt_app_state').upsert({ id: 'default', data, updated_at: new Date().toISOString() })
 if (stateError) throw stateError
 void syncNormalizedData(data)
}

function notifyRemoteSyncWarning(error: unknown) {
 if (typeof window === 'undefined') return
 const message = error instanceof Error ? error.message : 'Cloud database is unavailable.'
 window.dispatchEvent(new CustomEvent('vinay-traders-sync-warning', { detail: { message } }))
}

export async function saveData(data: AppData) {
 saveLocalData(data)
 if (supabaseConfigured) {
  try {
   await saveRemoteData(data)
   clearPendingSync()
  } catch (error) {
   // Keep the operator's change in this browser when Supabase is paused or offline.
   // The warning event lets the shell explain that cloud sync still needs attention.
   console.error('Supabase save failed; local change preserved', error)
   notifyRemoteSyncWarning(error)
  }
 }
}

export function useData() {
 const client = useQueryClient()
 const query = useQuery({ queryKey: QUERY_KEY, queryFn: supabaseConfigured ? loadRemoteData : async () => getData(), staleTime: 30_000, initialData: supabaseConfigured ? undefined : getData, placeholderData: supabaseConfigured ? getData() : undefined, retry: 1 })
 const mutate = async (updater: (data: AppData) => AppData) => { const current = structuredClone(query.data ?? getData()); const next = updater(current); await saveData(next); client.setQueryData(QUERY_KEY, next) }
 return { data: query.data ?? (clientRelease ? clientInitialData : initialData), isLoading: query.isLoading, error: query.error, refresh: () => client.invalidateQueries({ queryKey: QUERY_KEY }), mutate }
}
