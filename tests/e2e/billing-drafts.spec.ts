import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fixture => {
    if (!localStorage.getItem('vinay-traders-client-data-v2')) {
      const data = structuredClone(fixture)
      data.quotations = [{
        id: 'unrelated-quote', number: 'QU-UNRELATED', date: '2026-11-13', validUntil: '2026-11-20',
        customerName: 'Unrelated quotation', items: [fixture.invoices[0].items[0]],
        totals: fixture.invoices[0].totals, status: 'Draft', notes: '', createdBy: 'Isolated billing test',
      }]
      localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(data))
    }
  }, initialData)
})

test('resuming a saved bill draft preserves it and completes under the same bill number', async ({ page, isMobile }, info) => {
  const product = initialData.products.find(item => item.name === 'CPVC Pipe')
  if (!product) throw new Error('CPVC Pipe fixture is missing')
  const openingStock = product.stock

  await page.goto('/billing')
  await page.keyboard.press('F4')
  const search = page.getByLabel('Search products or scan barcode')
  await search.fill('CPVC Pipe')
  await page.locator('.pos-search-item').filter({ hasText: 'CPVC Pipe' }).first().click()

  if (isMobile) await page.locator('.pos-mobile-steps button').filter({ hasText: 'Review' }).click()
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('Invoice saved as a draft')).toBeVisible()

  const draft = await page.evaluate(productId => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      invoices: Array<{ id: string; number: string; status: string; items: Array<{ productId: string; quantity: number }> }>
    }
    return data.invoices.find(invoice => invoice.status === 'Draft' && invoice.items.some(item => item.productId === productId))
  }, product.id)
  expect(draft).toBeTruthy()
  if (!draft) throw new Error('Draft was not saved')
  expect(draft.items[0]?.quantity).toBe(1)

  // Load a different quotation first: resuming the saved draft must replace its cart metadata.
  await page.goto('/billing?quote=unrelated-quote')
  await expect(page.getByLabel('Name (optional)')).toHaveValue('Unrelated quotation')
  await page.getByRole('button', { name: 'Recent bills' }).click()
  const draftRow = page.locator(isMobile ? '.mobile-record' : 'tbody tr').filter({ hasText: draft.number })
  await expect(draftRow).toBeVisible()
  await draftRow.getByRole('button', { name: 'Resume' }).click()

  const retainedDraft = await page.evaluate(id => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      invoices: Array<{ id: string; number: string; status: string }>
    }
    return data.invoices.find(invoice => invoice.id === id)
  }, draft.id)
  expect(retainedDraft).toMatchObject({ id: draft.id, number: draft.number, status: 'Draft' })
  await page.screenshot({ path: info.outputPath('billing-resumed-draft.png'), animations: 'disabled', fullPage: true })

  if (isMobile) await page.locator('.pos-mobile-steps button').filter({ hasText: 'Payment' }).click()
  else await page.getByRole('button', { name: /Proceed to payment/ }).click()
  await page.getByRole('button', { name: /Generate invoice/ }).click()
  await expect(page.getByText('Invoice created successfully')).toBeVisible()

  const completed = await page.evaluate(({ id, productId }) => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      invoices: Array<{ id: string; number: string; status: string; totals: { grandTotal: number; paid: number; due: number }; items: Array<{ productId: string; quantity: number }> }>
      products: Array<{ id: string; stock: number }>
      stockTransactions: Array<{ type: string; reference: string }>
      quotations: Array<{ id: string; status: string; convertedInvoiceId?: string }>
    }
    const invoice = data.invoices.find(item => item.id === id)
    const product = data.products.find(item => item.id === productId)
    const sales = data.stockTransactions.filter(item => item.type === 'Sale' && item.reference === invoice?.number)
    return invoice && product ? { invoice, stock: product.stock, saleCount: sales.length, quote: data.quotations[0] } : null
  }, { id: draft.id, productId: product.id })
  expect(completed).toMatchObject({
    invoice: { id: draft.id, number: draft.number, status: 'Completed', totals: { due: 0 } },
    stock: openingStock - 1,
    saleCount: 1,
    quote: { id: 'unrelated-quote', status: 'Draft' },
  })
  expect(completed?.invoice.totals.paid).toBe(completed?.invoice.totals.grandTotal)
  expect(completed?.quote.convertedInvoiceId).toBeUndefined()
  await page.getByRole('button', { name: 'New bill', exact: true }).last().click()
  await page.keyboard.press('F4')
  await expect(page.locator('.commerce-empty').getByRole('heading', { name: 'Your bill starts here' })).toBeVisible()
})

test('discounted partial bill settles without charging stock twice', async ({ page, isMobile }, info) => {
  const product = initialData.products[0]
  const customer = initialData.customers[2]
  await page.goto('/billing')
  await page.getByRole('combobox', { name: 'Customer', exact: true }).selectOption(customer.id)
  await page.keyboard.press('F4')
  await page.getByLabel('Search products or scan barcode').fill(product.name)
  await page.locator('.pos-search-item').filter({ hasText: product.name }).first().click()
  const lines = page.locator(isMobile ? '.pos-line-mobile' : '.pos-lines')
  await lines.getByLabel(`${product.name} quantity`, { exact: true }).fill('2')
  await lines.getByLabel(`${product.name}${isMobile ? ' mobile' : ''} discount percent`, { exact: true }).fill('10')
  if (isMobile) await page.locator('.pos-mobile-steps button').filter({ hasText: 'Payment' }).click()
  else await page.getByRole('button', { name: /Proceed to payment/ }).click()
  await page.getByLabel('Amount received ₹').fill('20')
  await page.getByLabel('Due date').fill('2026-11-27')
  await page.getByRole('button', { name: /Generate invoice/ }).click()
  await expect(page.getByText('Invoice created successfully')).toBeVisible()
  const created = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}')
    return data.invoices[0] as { id: string; number: string; dueDate: string; totals: { subtotal: number; discount: number; grandTotal: number; paid: number; due: number } }
  })
  expect(created).toMatchObject({ dueDate: '2026-11-27', totals: { subtotal: 184, discount: 18.4, grandTotal: 166, paid: 20, due: 146 } })

  await page.goto(`/billing/invoices/${created.id}`)
  await expect(page.locator('.invoice-title')).toContainText('Partial')
  await expect(page.locator('.invoice-paper .commerce-summary')).toContainText('Round off')
  await page.emulateMedia({ media: 'print' })
  const billPdf = await page.pdf({ path: info.outputPath('partial-bill-a4.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
  expect(billPdf.toString('latin1').match(/\/Type\s*\/Page\b/gu) ?? []).toHaveLength(1)
  await page.emulateMedia({ media: 'screen' })
  await page.goto(`/billing?edit=${created.id}`)
  if (isMobile) await page.locator('.pos-mobile-steps button').filter({ hasText: 'Review' }).click()
  await expect(page.getByRole('button', { name: 'Save draft' })).toBeDisabled()

  await page.goto('/billing/bills')
  await page.getByLabel('Search bills by customer').fill(customer.name)
  const billRow = page.locator(isMobile ? '.mobile-record' : 'tbody tr').filter({ hasText: created.number })
  await billRow.getByRole('button', { name: 'Mark paid' }).click()
  await expect(page.getByText('Bill marked paid')).toBeVisible()
  await expect(billRow.getByRole('button', { name: 'Mark paid' })).toBeDisabled()
  const settled = await page.evaluate(({ invoiceId, customerId, productId }) => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}')
    return {
      invoice: data.invoices.find((row: { id: string }) => row.id === invoiceId),
      customer: data.customers.find((row: { id: string }) => row.id === customerId),
      product: data.products.find((row: { id: string }) => row.id === productId),
      payments: data.payments.filter((row: { invoiceId?: string }) => row.invoiceId === invoiceId),
    }
  }, { invoiceId: created.id, customerId: customer.id, productId: product.id })
  expect(settled.invoice).toMatchObject({ initialPaid: 20, paymentStatus: 'Paid', totals: { paid: 166, due: 0 } })
  expect(settled.customer.balance).toBe(customer.balance)
  expect(settled.product.stock).toBe(product.stock - 2)
  expect(settled.payments).toHaveLength(1)
  expect(settled.payments[0].amount).toBe(146)
  await page.screenshot({ path: info.outputPath('billing-settled-history.png'), animations: 'disabled', fullPage: true })
})
