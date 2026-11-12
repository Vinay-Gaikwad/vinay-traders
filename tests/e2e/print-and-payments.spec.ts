import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  // Browser tests use seeded mock records in an isolated client-only workspace;
  // never connect to the real shop Supabase project.
  await page.addInitScript((fixture) => {
    localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(fixture))
  }, initialData)
})

test('customer bill uses Bill wording and prints on A4', async ({ page }, info) => {
  const bill = initialData.invoices[0]
  await page.goto(`/billing/invoices/${bill.id}`)
  const paper = page.locator('article.invoice-paper')
  await expect(paper).toBeVisible()
  await expect(paper.locator('.invoice-title h3')).toHaveText('BILL')
  await expect(paper.getByText(bill.number, { exact: true })).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(paper).toBeVisible()
  const output = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
  expect(output.subarray(0, 5).toString()).toBe('%PDF-')
  expect(output.length).toBeGreaterThan(9000)
  await page.screenshot({ path: info.outputPath('bill-a4-print-preview.png'), animations: 'disabled' })
})

test('barcode labels have a visible isolated print surface rather than a blank page', async ({ page }, info) => {
  await page.goto('/inventory/barcodes')
  await page.getByRole('button', { name: 'Generate and add to inventory' }).click()
  await expect(page.getByRole('button', { name: 'Print label' })).toBeEnabled()
  await page.emulateMedia({ media: 'print' })
  const label = page.locator('.barcode-print-sheet')
  await expect(label).toBeVisible()
  await expect(label.locator('svg')).toBeVisible()
  const dimensions = await label.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  })
  expect(dimensions.width).toBeGreaterThan(150)
  expect(dimensions.height).toBeGreaterThan(90)
  await page.screenshot({ path: info.outputPath('barcode-label-print-preview.png'), animations: 'disabled' })
})
