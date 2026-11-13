import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fixture => {
    if (localStorage.getItem('vinay-traders-client-data-v2')) return
    const data = structuredClone(fixture)
    const invoice = data.invoices.find(row => row.id === 'inv-001')
    if (!invoice) throw new Error('Expected isolated invoice fixture')
    // The seed's historical payment is intentionally over the bill total. Make
    // this scenario a valid fully paid invoice before exercising a refund.
    invoice.totals.paid = invoice.totals.grandTotal
    invoice.totals.due = 0
    invoice.totals.totalDue = 0
    invoice.totals.change = 0
    invoice.initialPaid = invoice.totals.grandTotal
    invoice.paymentMethod = 'Cash'
    invoice.paymentStatus = 'Paid'
    localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(data))
  }, initialData)
})

test('sales return revises bill, restores stock, adjusts referral totals, and records refund history', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-11-13T12:00:00') })
  await page.goto('/returns')

  const recordSelector = page.viewportSize()!.width <= 600
    ? '.mobile-data .mobile-record'
    : '.desktop-data .data-table tbody tr'
  const billRow = page.locator(recordSelector).filter({ hasText: 'VT-2026-0118' })
  await expect(billRow).toBeVisible()
  await billRow.getByRole('button', { name: 'Return items' }).click()
  await page.getByLabel('Return quantity for CPVC Pipe').fill('2')
  await expect(page.getByRole('dialog').getByText('₹184.00')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Create revised bill' }).click()
  await expect(page.getByText('Return recorded. A revised bill is now available in bill history.')).toBeVisible()

  const financials = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      invoices: Array<{ id: string; number: string; status: string; customerId?: string; plumberId?: string; items: Array<{ productId: string; quantity: number }>; totals: { grandTotal: number; paid: number; due: number } }>
      products: Array<{ id: string; stock: number }>
      customers: Array<{ id: string; totalPurchase: number; balance: number }>
      plumbers: Array<{ id: string; referralSales: number; commissionEarned: number; commissionPaid: number }>
      invoiceReturns: Array<{ id: string; number: string; originalInvoiceId: string; updatedInvoiceId: string; amount: number; restocked: boolean; commissionReversed: number; refundDue: number; refundPaid: number }>
      stockTransactions: Array<{ type: string; reference: string; productId: string; in: number }>
    }
    const original = data.invoices.find(row => row.id === 'inv-001')
    const revised = data.invoices.find(row => row.number === 'VT-2026-0118-R1')
    const returned = data.invoiceReturns[0]
    if (!original || !revised || !returned) throw new Error('Return transaction was not persisted')
    return {
      originalStatus: original.status,
      revised,
      returned,
      productStock: data.products.find(row => row.id === 'p-cpvc-1')?.stock,
      customer: data.customers.find(row => row.id === 'c-001'),
      plumber: data.plumbers.find(row => row.id === 'pl-001'),
      stockReturn: data.stockTransactions.find(row => row.type === 'Sale Return' && row.reference === returned.number),
    }
  })

  const originalBill = initialData.invoices.find(row => row.id === 'inv-001')!
  const originalProduct = initialData.products.find(row => row.id === 'p-cpvc-1')!
  const originalCustomer = initialData.customers.find(row => row.id === 'c-001')!
  const originalPlumber = initialData.plumbers.find(row => row.id === 'pl-001')!
  expect(financials.originalStatus).toBe('Revised')
  expect(financials.revised.number).toBe('VT-2026-0118-R1')
  expect(financials.revised.items[0]?.quantity).toBe(10)
  expect(financials.productStock).toBe(originalProduct.stock + 2)
  expect(financials.stockReturn).toMatchObject({ type: 'Sale Return', productId: 'p-cpvc-1', in: 2 })
  expect(financials.returned.restocked).toBe(true)
  expect(financials.returned.refundDue).toBe(originalBill.totals.grandTotal - financials.revised.totals.grandTotal)
  expect(financials.returned.refundDue).toBeGreaterThan(25)
  expect(financials.customer?.totalPurchase).toBe(originalCustomer.totalPurchase + financials.revised.totals.grandTotal - originalBill.totals.grandTotal)
  expect(financials.plumber?.referralSales).toBe(originalPlumber.referralSales - financials.returned.amount)
  expect(financials.plumber?.commissionEarned).toBe(originalPlumber.commissionEarned - financials.returned.commissionReversed)
  expect(financials.plumber?.commissionPaid).toBe(originalPlumber.commissionPaid)

  await page.reload()
  const returnRow = page.locator(recordSelector).filter({ hasText: 'VT-2026-0118-RET-1' })
  await expect(returnRow).toBeVisible()
  await expect(returnRow).toContainText('VT-2026-0118-R1')

  await returnRow.getByRole('button', { name: 'Record refund' }).click()
  const refundDialog = page.getByRole('dialog')
  await refundDialog.getByLabel('Amount refunded').fill('25')
  await refundDialog.getByLabel('Method').selectOption('UPI')
  await refundDialog.getByLabel('Reference (optional)').fill('RETURN-UPI-001')
  await refundDialog.getByRole('button', { name: 'Record refund payment' }).click()
  await expect(page.getByText('Refund recorded; historical bills preserved')).toBeVisible()

  const savedRefund = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      invoiceReturns: Array<{ refundDue: number; refundPaid: number; refunds: Array<{ amount: number; method: string; reference: string; date: string }> }>
    }
    return data.invoiceReturns[0]
  })
  expect(savedRefund.refundPaid).toBe(25)
  expect(savedRefund.refunds).toHaveLength(1)
  expect(savedRefund.refunds[0]).toMatchObject({ amount: 25, method: 'UPI', reference: 'RETURN-UPI-001', date: '2026-11-13' })
  if (page.viewportSize()!.width > 600) {
    await expect(page.locator(recordSelector).filter({ hasText: 'VT-2026-0118-RET-1' })).toContainText(`₹${(savedRefund.refundDue - 25).toFixed(2)}`)
  }

  const returnRowAfterPartialRefund = page.locator(recordSelector).filter({ hasText: 'VT-2026-0118-RET-1' })
  await returnRowAfterPartialRefund.getByRole('button', { name: 'Record refund' }).click()
  const finalRefundDialog = page.getByRole('dialog')
  await expect(finalRefundDialog.getByLabel('Amount refunded')).toHaveValue((savedRefund.refundDue - 25).toFixed(2))
  await finalRefundDialog.getByRole('button', { name: 'Record refund payment' }).click()
  await expect(page.getByText('Refund recorded; historical bills preserved').last()).toBeVisible()
  const fullyRefunded = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      invoiceReturns: Array<{ refundDue: number; refundPaid: number; refunds: Array<{ amount: number }> }>
    }
    return data.invoiceReturns[0]
  })
  expect(fullyRefunded.refundPaid).toBe(fullyRefunded.refundDue)
  expect(fullyRefunded.refunds).toHaveLength(2)
  await expect(page.locator(recordSelector).filter({ hasText: 'VT-2026-0118-RET-1' }).getByRole('button', { name: 'Record refund' })).toHaveCount(0)

  const pdfDownloadEvent = page.waitForEvent('download')
  await page.locator(recordSelector).filter({ hasText: 'VT-2026-0118-RET-1' }).getByRole('button', { name: 'Before / after PDF' }).click()
  const pdfDownload = await pdfDownloadEvent
  await pdfDownload.saveAs(info.outputPath('return-before-after.pdf'))

  await page.locator(recordSelector).filter({ hasText: 'VT-2026-0118-RET-1' }).getByRole('button', { name: 'Open revised bill' }).click()
  await expect(page.getByRole('heading', { name: 'VT-2026-0118-R1' })).toBeVisible()
})
