import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fixture => {
    if (localStorage.getItem('vinay-traders-client-data-v2')) return
    const data = structuredClone(fixture)
    data.quotations = [{
      id: 'quote-history-fixture',
      number: 'QUO-0001',
      date: '2026-11-10',
      validUntil: '2026-11-17',
      customerId: 'c-001',
      customerName: 'Historic Search Customer',
      items: [{ id: 'quote-history-line', productId: 'p-cpvc-1', name: 'CPVC Pipe', variant: '1 inch - 3 Meter', hsn: '', quantity: 1, unit: 'Meter', rate: 92, discount: 0, gst: 0 }],
      totals: { subtotal: 92, discount: 0, taxable: 92, gst: 0, cgst: 0, sgst: 0, igst: 0, roundOff: 0, grandTotal: 92, previousBalance: 0, paid: 0, due: 92, change: 0, totalDue: 92 },
      status: 'Draft', notes: '', createdBy: 'Isolated quotation test',
    }]
    localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(data))
  }, initialData)
})

test('quotation date search, edit, A4 PDF, and conversion to a tax-free bill work end to end', async ({ page }, info) => {
  test.setTimeout(120_000)
  await page.clock.install({ time: new Date('2026-11-13T12:00:00') })
  await page.goto('/quotations')
  const tableRows = page.locator('.data-table tbody tr')
  await expect(tableRows).toHaveCount(1)
  await expect(tableRows.first()).toContainText('QUO-0001')

  await page.getByRole('button', { name: 'New quotation' }).click()
  await page.locator('.quotation-editor select').selectOption('c-001')
  await page.locator('.quotation-editor .form-grid input').first().fill('Patil Constructions')
  await page.locator('.quotation-editor .form-grid input[type="date"]').fill('2026-11-20')
  await page.getByLabel('Search products or scan barcode').fill('CPVC Pipe')
  await page.locator('.pos-search-item').filter({ hasText: 'CPVC Pipe' }).first().click()
  const discountLabel = page.viewportSize()!.width <= 600
    ? 'CPVC Pipe mobile discount percent'
    : 'CPVC Pipe discount percent'
  await page.getByLabel(discountLabel).fill('10')
  await page.locator('.quotation-editor textarea').fill('Delivery by agreement; quotation only.')
  await page.getByRole('button', { name: 'Save and mark sent' }).click()
  await expect(page.getByText('Quotation marked as sent')).toBeVisible()
  await expect(tableRows).toHaveCount(2)
  const newQuoteRow = tableRows.filter({ hasText: 'QUO-0002' })
  await expect(newQuoteRow).toContainText('Patil Constructions')
  await expect(newQuoteRow).toContainText('Sent')

  await page.getByLabel('Quotation from date').fill('2026-11-13')
  await page.getByLabel('Quotation to date').fill('2026-11-13')
  await expect(tableRows).toHaveCount(1)
  await expect(tableRows.first()).toContainText('QUO-0002')
  await page.getByLabel('Quotation from date').fill('2026-11-10')
  await page.getByLabel('Quotation to date').fill('2026-11-10')
  await expect(tableRows).toHaveCount(1)
  await expect(tableRows.first()).toContainText('QUO-0001')

  await page.getByLabel('Quotation from date').fill('')
  await page.getByLabel('Quotation to date').fill('')
  await page.getByLabel('Search quotations by customer or number').fill('Patil Constructions')
  await expect(tableRows).toHaveCount(1)
  await expect(tableRows.first()).toContainText('QUO-0002')
  await page.getByLabel('Search quotations by customer or number').fill('')

  await page.getByRole('button', { name: 'Open QUO-0002' }).click()
  await expect(page.getByRole('heading', { name: 'QUO-0002 · quotation' })).toBeVisible()
  await expect(page.getByText('Delivery by agreement; quotation only.')).toBeVisible()
  const pdfDownloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF' }).click()
  const pdfDownload = await pdfDownloadEvent
  await pdfDownload.saveAs(info.outputPath('quotation-a4.pdf'))
  await page.locator('[data-sonner-toast]').filter({ hasText: 'Quotation PDF downloaded' }).waitFor({ state: 'hidden' })

  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Edit QUO-0002' })).toBeVisible()
  await page.locator('.quotation-editor textarea').fill('Updated terms - deliver by agreement.')
  await page.getByRole('button', { name: 'Save and mark sent' }).click()
  await expect(page.getByText('Quotation marked as sent').last()).toBeVisible()

  const persistedQuote = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      quotations: Array<{ id: string; number: string; status: string; notes: string; items: Array<{ discount: number }>; totals: { grandTotal: number; gst: number } }>
    }
    return data.quotations.find(row => row.number === 'QUO-0002')
  })
  expect(persistedQuote).toMatchObject({ number: 'QUO-0002', status: 'Sent', notes: 'Updated terms - deliver by agreement.', totals: { grandTotal: 83, gst: 0 } })
  expect(persistedQuote?.items[0]?.discount).toBe(10)

  await page.getByRole('button', { name: 'Open QUO-0002' }).click()
  await page.getByRole('button', { name: 'Convert to bill' }).click()
  await expect(page).toHaveURL(/\/billing\?quote=/)
  await expect(page.getByRole('heading', { name: /New bill/ })).toBeVisible()
  if (page.viewportSize()!.width <= 600) {
    await expect(page.locator('.pos-mobile-footer')).toContainText('1 items in bill')
    await page.getByRole('button', { name: 'Reference', exact: true }).click()
    await page.getByRole('button', { name: 'Add products', exact: true }).click()
    await expect(page.locator('.pos-line-mobile')).toContainText('CPVC Pipe')
    await page.getByRole('button', { name: 'Review bill', exact: true }).click()
    await page.getByRole('button', { name: 'Payment', exact: true }).click()
  } else {
    await expect(page.getByText('CPVC Pipe', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Proceed to payment' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Complete payment' })).toBeVisible()
  await page.getByRole('button', { name: 'Full paid' }).click()
  await page.getByRole('button', { name: 'Generate invoice' }).click()
  await expect(page.getByRole('heading', { name: 'Invoice created successfully' })).toBeVisible()

  const converted = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      quotations: Array<{ id: string; status: string; convertedInvoiceId?: string }>
      invoices: Array<{ id: string; number: string; status: string; totals: { grandTotal: number; gst: number } }>
    }
    const quotation = data.quotations.find(row => row.number === 'QUO-0002')
    const invoice = data.invoices.find(row => row.id === quotation?.convertedInvoiceId)
    return { quotation, invoice }
  })
  expect(converted.quotation).toMatchObject({ status: 'Converted' })
  expect(converted.invoice).toMatchObject({ status: 'Completed', totals: { gst: 0 } })
  expect(converted.invoice?.totals.grandTotal).toBe(83)
})
