import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fixture => {
    if (!localStorage.getItem('vinay-traders-client-data-v2')) {
      localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(fixture))
    }
  }, initialData)
})

test('marking a worker paid clears remaining pay and keeps the salary payment history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-27T12:00:00') })
  await page.goto('/workers/w-001')

  const basicPayRemaining = page.locator('.stat-card').filter({ hasText: 'Basic pay remaining' }).locator('.stat-value')
  const balance = page.locator('.stat-card').filter({ hasText: 'Balance' }).locator('.stat-value')
  await expect(basicPayRemaining).not.toHaveText('₹0.00')
  await expect(balance).not.toHaveText('₹0.00')

  await page.getByRole('button', { name: 'Mark paid' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm payment' }).click()
  await expect(page.getByText('Salary payment recorded')).toBeVisible()
  await expect(basicPayRemaining).toHaveText('₹0.00')
  await expect(balance).toHaveText('₹0.00')

  await page.getByRole('button', { name: 'Payments', exact: true }).click()
  const paymentTable = page.locator('.data-table')
  await expect(paymentTable.locator('tbody tr')).toHaveCount(1)
  await expect(paymentTable.locator('tbody tr')).toContainText('SAL-2026-09')

  await page.reload()
  await page.getByRole('button', { name: 'Payments', exact: true }).click()
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1)
  await expect(page.locator('.data-table tbody tr')).toContainText('SAL-2026-09')
  await expect(basicPayRemaining).toHaveText('₹0.00')
  await expect(balance).toHaveText('₹0.00')
})

test('worker bonus periods are saved with their daily amount and date range', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-27T12:00:00') })
  await page.goto('/workers/w-001')

  await page.getByRole('button', { name: 'Add bonus period' }).click()
  await page.getByLabel('Bonus per day').fill('125')
  await page.getByLabel('From date').fill('2026-09-24')
  await page.getByLabel('To date').fill('2026-09-27')
  await page.getByRole('dialog').getByRole('button', { name: 'Save bonus period' }).click()
  await expect(page.getByText('Bonus period added')).toBeVisible()
  await expect(page.locator('.worker-payroll-lines').locator('div').filter({ hasText: /^Bonus/ }).locator('strong')).toHaveText('₹500.00')

  await page.getByRole('button', { name: 'Salary', exact: true }).click()
  const bonusTable = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Scheduled bonus periods' }) }).locator('.data-table')
  await expect(bonusTable.locator('tbody tr')).toHaveCount(1)
  await expect(bonusTable.locator('tbody tr')).toContainText('24 Sept 2026')
  await expect(bonusTable.locator('tbody tr')).toContainText('27 Sept 2026')
  await expect(bonusTable.locator('tbody tr')).toContainText('₹125.00')
})
