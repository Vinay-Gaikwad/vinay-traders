import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fixture => {
    if (!localStorage.getItem('vinay-traders-client-data-v2')) {
      localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(fixture))
    }
  }, initialData)
})

test('purchase supplier search rejects text that is not a selected supplier', async ({ page }) => {
  await page.goto('/purchase/new')

  await page.getByRole('textbox', { name: 'Supplier invoice no.' }).fill('TEST-UNMATCHED-SUPPLIER')
  await page.getByRole('combobox', { name: 'Supplier search' }).fill('Supplier that does not exist')
  await page.getByRole('button', { name: 'Save & print' }).click()

  await expect(page.getByText('Select a supplier from the search results')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'New purchase' })).toBeVisible()
})

test('purchase attachment remains available after save and reopening the purchase', async ({ page }) => {
  const expectPurchaseInRegister = async () => expect.poll(() => page.getByText('TEST-ATTACHED-INVOICE-2026', { exact: true }).evaluateAll(nodes => nodes.some(node => node.getClientRects().length > 0))).toBe(true)
  await page.goto('/purchase/new')

  await page.getByRole('textbox', { name: 'Supplier invoice no.' }).fill('TEST-ATTACHED-INVOICE-2026')
  const upload = page.getByLabel('Upload supplier invoice PDF or image')
  await upload.setInputFiles({
    name: 'supplier-invoice.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% test invoice for the isolated browser workspace\n'),
  })
  await expect(page.getByRole('button', { name: 'View supplier invoice' })).toBeVisible()
  await page.getByRole('button', { name: 'Save & print' }).click()

  await expect(page.getByRole('heading', { name: 'Purchases' })).toBeVisible()
  await expectPurchaseInRegister()
  const purchase = await page.evaluate(() => {
    const stored = localStorage.getItem('vinay-traders-client-data-v2')
    if (!stored) return null
    const data = JSON.parse(stored) as {
      purchases: Array<{ id: string; number: string; supplierId: string; supplierInvoice: string; totals: { due: number }; items: Array<{ productId: string; quantity: number }>; attachmentName?: string; attachmentData?: string }>
      products: Array<{ id: string; stock: number }>
      suppliers: Array<{ id: string; balance: number }>
    }
    const row = data.purchases.find(item => item.supplierInvoice === 'TEST-ATTACHED-INVOICE-2026')
    const product = row && data.products.find(item => item.id === row.items[0]?.productId)
    const supplier = row && data.suppliers.find(item => item.id === row.supplierId)
    return row ? { ...row, productStock: product?.stock, supplierBalance: supplier?.balance } : null
  })
  if (!purchase) throw new Error('Saved purchase was not present in local storage')
  const firstItem = purchase.items[0]
  if (!firstItem) throw new Error('Saved purchase had no line item')
  const originalProduct = initialData.products.find(row => row.id === firstItem.productId)
  const originalSupplier = initialData.suppliers.find(row => row.id === purchase.supplierId)
  if (!originalProduct || !originalSupplier) throw new Error('Purchase references an unknown product or supplier')
  expect(purchase.attachmentName).toBe('supplier-invoice.pdf')
  expect(purchase.attachmentData).toContain('data:application/pdf;base64,JVBERi0xLjQK')
  expect(purchase.productStock).toBe(originalProduct.stock + firstItem.quantity)
  expect(purchase.supplierBalance).toBe(originalSupplier.balance + purchase.totals.due)

  await page.reload()
  await expectPurchaseInRegister()
  await page.goto(`/purchase/${purchase.id}`)
  await expect(page.getByRole('heading', { name: purchase.number })).toBeVisible()
  await expect(page.getByRole('button', { name: 'View supplier invoice' })).toBeVisible()
})

test('duplicate supplier invoice numbers are rejected', async ({ page }) => {
  await page.goto('/purchase/new')
  await page.getByRole('textbox', { name: 'Supplier invoice no.' }).fill(initialData.purchases[0]!.supplierInvoice)
  await page.getByRole('button', { name: 'Save & print' }).click()

  await expect(page.getByText('This supplier invoice has already been recorded.')).toBeVisible()
  const purchaseCount = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as { purchases: unknown[] }
    return data.purchases.length
  })
  expect(purchaseCount).toBe(initialData.purchases.length)
})

test('purchase register filters records by supplier name', async ({ page }) => {
  await page.goto('/purchase')
  const purchaseRows = page.locator('.data-table tbody tr')
  await expect(purchaseRows).toHaveCount(initialData.purchases.length)

  const supplierSearch = page.getByRole('textbox', { name: 'Search purchase register by supplier name' })
  await supplierSearch.fill('Finolex')
  await expect(purchaseRows).toHaveCount(1)
  await expect(purchaseRows.first()).toContainText('Finolex Maharashtra')

  await supplierSearch.fill('supplier not in the register')
  await expect(purchaseRows).toHaveCount(0)
})

test('purchase invoice, register and product report export as A4 PDFs', async ({ page }, info) => {
  test.setTimeout(120_000)

  await page.goto('/')
  await page.evaluate(() => {
    const key = 'vinay-traders-client-data-v2'
    const data = JSON.parse(localStorage.getItem(key) ?? '{}') as { products: Array<Record<string, unknown>> }
    if (data.products[0]) data.products[0] = { ...data.products[0], stock: 3, purchaseRate: 12.5 }
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()

  const purchase = initialData.purchases[0]
  expect(purchase).toBeTruthy()
  await page.goto(`/purchase/${purchase!.id}`)
  let downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export A4 invoice' }).click()
  let download = await downloadEvent
  await download.saveAs(info.outputPath('purchase-invoice-a4.pdf'))

  await page.goto('/purchase')
  downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export records' }).click()
  download = await downloadEvent
  await download.saveAs(info.outputPath('purchase-register-a4.pdf'))

  await page.goto('/inventory')
  downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export product report' }).click()
  download = await downloadEvent
  await download.saveAs(info.outputPath('product-purchase-report-a4.pdf'))
})

test('monthly bulk attendance preserves recorded statuses and skips future days', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-13T12:00:00') })
  await page.goto('/attendance/monthly')
  await page.evaluate(() => {
    const key = 'vinay-traders-client-data-v2'
    const data = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      workers: Array<{ id: string }>
      attendance: Array<Record<string, unknown>>
    }
    const worker = data.workers[0]
    if (!worker) throw new Error('Expected isolated worker fixture')
    data.attendance = [{ id: 'keep-absence', workerId: worker.id, date: '2026-11-12', status: 'Absent', checkIn: '', checkOut: '', overtime: 0, notes: '' }]
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()

  await page.getByRole('button', { name: 'Mark pending present' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(page.getByText('Pending attendance dates through today marked present')).toBeVisible()

  const attendance = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as { attendance: Array<{ date: string; status: string }> }
    return data.attendance
  })
  expect(attendance).toContainEqual(expect.objectContaining({ date: '2026-11-12', status: 'Absent' }))
  expect(attendance.some(row => row.date > '2026-11-13')).toBe(false)
  expect(attendance.filter(row => row.date === '2026-11-13' && row.status === 'Present').length).toBeGreaterThan(0)
})

test('purchase invoice and register paginate 100 rows on A4', async ({ page }, info) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.evaluate(() => {
    const key = 'vinay-traders-client-data-v2'
    const data = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      purchases: Array<Record<string, unknown> & { items: Array<Record<string, unknown>> }>
    }
    const template = data.purchases[0]
    if (!template) throw new Error('Expected isolated purchase fixture')
    const original = template.items[0]
    if (!original) throw new Error('Expected purchase line fixture')
    const items = Array.from({ length: 100 }, (_, index) => ({
      ...original,
      id: `pdf-line-${index + 1}`,
      name: `Long product description for A4 pagination verification ${index + 1}`,
      variant: `Variant size ${index + 1} with an additional printable description`,
      quantity: 1,
      rate: 10 + index,
      discount: index % 3,
    }))
    const subtotal = items.reduce((sum, item) => sum + Number(item.rate), 0)
    const discount = items.reduce((sum, item) => sum + Number(item.rate) * Number(item.discount) / 100, 0)
    const grandTotal = Math.round(subtotal - discount)
    const totals = { subtotal, discount, taxable: subtotal - discount, gst: 0, cgst: 0, sgst: 0, igst: 0, roundOff: grandTotal - (subtotal - discount), grandTotal, previousBalance: 0, paid: 0, due: grandTotal, change: 0, totalDue: grandTotal }
    data.purchases = Array.from({ length: 100 }, (_, index) => ({
      ...template,
      id: `pdf-purchase-${index + 1}`,
      number: `PUR-PDF-${String(index + 1).padStart(3, '0')}`,
      supplierInvoice: `PDF-${String(index + 1).padStart(3, '0')}`,
      date: `2026-11-${String(index % 28 + 1).padStart(2, '0')}`,
      items: index === 0 ? items : [original],
      totals: index === 0 ? totals : template.totals,
    }))
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()

  await page.goto('/purchase/pdf-purchase-1')
  let downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export A4 invoice' }).click()
  let download = await downloadEvent
  await download.saveAs(info.outputPath('purchase-invoice-100-rows-a4.pdf'))

  await page.goto('/purchase')
  downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export records' }).click()
  download = await downloadEvent
  await download.saveAs(info.outputPath('purchase-register-100-rows-a4.pdf'))

  await page.evaluate(() => {
    const key = 'vinay-traders-client-data-v2'
    const data = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      purchases: Array<Record<string, unknown> & { items: Array<Record<string, unknown>>; totals: Record<string, number> }>
    }
    const purchase = data.purchases[0]
    if (!purchase) throw new Error('Expected purchase PDF fixture')
    const items = purchase.items.slice(0, 20)
    const subtotal = items.reduce((sum, item) => sum + Number(item.rate) * Number(item.quantity), 0)
    const discount = items.reduce((sum, item) => sum + Number(item.rate) * Number(item.quantity) * Number(item.discount) / 100, 0)
    const unrounded = subtotal - discount
    const grandTotal = Math.round(unrounded)
    purchase.items = items
    purchase.totals = { subtotal, discount, taxable: unrounded, gst: 0, cgst: 0, sgst: 0, igst: 0, roundOff: grandTotal - unrounded, grandTotal, previousBalance: 0, paid: 0, due: grandTotal, change: 0, totalDue: grandTotal }
    data.purchases = data.purchases.slice(0, 20)
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()

  await page.goto('/purchase/pdf-purchase-1')
  downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export A4 invoice' }).click()
  download = await downloadEvent
  await download.saveAs(info.outputPath('purchase-invoice-20-rows-a4.pdf'))

  await page.goto('/purchase')
  downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export records' }).click()
  download = await downloadEvent
  await download.saveAs(info.outputPath('purchase-register-20-rows-a4.pdf'))
})
