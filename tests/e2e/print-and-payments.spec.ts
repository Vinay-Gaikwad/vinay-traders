import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  // Browser tests use seeded mock records in an isolated client-only workspace;
  // never connect to the real shop Supabase project.
  await page.addInitScript((fixture) => {
    if (!localStorage.getItem('vinay-traders-client-data-v2')) {
      localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(fixture))
    }
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

test('barcode labels save unit settings, print on A4, and can be found by scanning', async ({ page }, info) => {
  await page.goto('/inventory/barcodes')
  await page.getByLabel('Label text').fill('Rack A-04')
  await page.getByLabel('Label quantity').fill('18')
  await page.getByLabel('Label template').selectOption('With Price')
  await page.getByRole('button', { name: 'Generate & save label' }).click()
  await expect(page.getByText('Saved to inventory', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Print labels' }).first()).toBeEnabled()
  await expect(page.locator('.barcode-screen-sheet .barcode-label-card')).toHaveCount(16)
  await expect(page.locator('.barcode-more-labels')).toContainText('print includes all 18 copies')
  const saved = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      products: Array<{ name: string; barcodes?: Array<{ value: string; unit: string; quantity?: number; template?: string; includePrice?: boolean; label?: string }> }>
    }
    return data.products.find(product => product.name === 'CPVC Pipe')?.barcodes?.find(item => item.label === 'Rack A-04')
  })
  expect(saved).toMatchObject({ unit: 'Meter', quantity: 18, template: 'With Price', includePrice: true, label: 'Rack A-04' })
  expect(saved?.value).toContain('MTR')
  const sameCodeOtherProducts = await page.evaluate(value => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      products: Array<{ name: string; barcode?: string; barcodes?: Array<{ value: string }> }>
    }
    return data.products.filter(product => product.name !== 'CPVC Pipe' &&
      (product.barcode === value || product.barcodes?.some(item => item.value === value))).length
  }, saved!.value)
  expect(sameCodeOtherProducts).toBe(0)
  const svgDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download SVG' }).click()
  expect((await svgDownload).suggestedFilename()).toMatch(/\.svg$/i)
  await page.screenshot({ path: info.outputPath('barcode-label-builder.png'), animations: 'disabled' })
  await page.emulateMedia({ media: 'print' })
  const label = page.locator('.barcode-print-document')
  await expect(label).toBeVisible()
  await expect(label.locator('.barcode-label-card')).toHaveCount(18)
  await expect(label.locator('svg').first()).toBeVisible()
  const dimensions = await label.locator('.barcode-label-card').first().evaluate(element => {
    const rect = element.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  })
  expect(dimensions.width).toBeGreaterThan(180)
  expect(dimensions.width).toBeLessThan(230)
  expect(dimensions.height).toBeGreaterThan(80)
  const output = await page.pdf({ path: info.outputPath('barcode-labels-a4.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
  expect(output.subarray(0, 5).toString()).toBe('%PDF-')
  expect(output.length).toBeGreaterThan(9000)
  expect(output.toString('latin1').match(/\/Type\s*\/Page\b/gu) ?? []).toHaveLength(2)
  await page.screenshot({ path: info.outputPath('barcode-label-print-preview.png'), animations: 'disabled' })

  await page.emulateMedia({ media: 'screen' })
  await page.goto('/billing')
  // The mobile POS exposes product search on its Products step; F4 selects it on both layouts.
  await page.keyboard.press('F4')
  const barcodeSearch = page.getByLabel('Search products or scan barcode')
  await expect(barcodeSearch).toBeVisible()
  await barcodeSearch.fill(saved!.value)
  await expect(page.locator('.pos-search-item').filter({ hasText: 'CPVC Pipe' })).toBeVisible()
})
