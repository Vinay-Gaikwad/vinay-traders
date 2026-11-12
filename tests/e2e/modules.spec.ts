import { expect, test } from '@playwright/test'

const modules = [
  { name: 'dashboard', path: '/' },
  { name: 'purchase', path: '/purchase' },
  { name: 'inventory', path: '/inventory' },
  { name: 'quotations', path: '/quotations' },
  { name: 'barcodes', path: '/inventory/barcodes' },
  { name: 'billing', path: '/billing' },
  { name: 'bill-history', path: '/billing/bills' },
  { name: 'customers', path: '/customers' },
  { name: 'suppliers', path: '/suppliers' },
  { name: 'plumbers', path: '/plumbers' },
  { name: 'workers', path: '/workers' },
  { name: 'attendance', path: '/attendance' },
  { name: 'patsanstha', path: '/patsanstha' },
  { name: 'returns', path: '/returns' },
  { name: 'expenses', path: '/expenses' },
  { name: 'settings', path: '/settings' },
  { name: 'notifications', path: '/notifications' },
] as const

test('Vinay Traders core routes render without a blank page', async ({ page }, info) => {
  for (const item of modules) {
    await test.step(item.name, async () => {
      await page.goto(item.path)
      await expect(page.locator('main.main-content')).toBeVisible()
      await expect(page.locator('main.main-content h1').first()).toBeVisible()
      await expect(page.locator('main.main-content')).not.toContainText('Page not found')
      await page.screenshot({ path: info.outputPath(item.name + '.png'), animations: 'disabled' })
    })
  }
})

test('purchase numeric input ignores mouse wheel changes', async ({ page }) => {
  await page.goto('/purchase/new')
  const field = page.getByRole('spinbutton', { name: 'Purchase quantity' }).first()
  await field.scrollIntoViewIfNeeded()
  await field.focus()
  const oldValue = await field.inputValue()
  const rect = await field.boundingBox()
  expect(rect).not.toBeNull()
  if (!rect) return
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.wheel(0, 250)
  await expect(field).toHaveValue(oldValue)
})
