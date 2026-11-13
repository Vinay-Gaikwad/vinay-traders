import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fixture => {
    if (!localStorage.getItem('vinay-traders-client-data-v2')) {
      localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(fixture))
    }
  }, initialData)
})

test('product entry saves category, supplier, and discounted margin', async ({ page }) => {
  await page.goto('/inventory')
  await page.getByRole('button', { name: 'Add product' }).click()
  const form = page.getByRole('dialog')

  await form.getByLabel('Product name').fill('Regression Valve')
  await form.getByLabel('Brand').fill('Vinay Test Brand')
  await form.getByLabel('Category').selectOption({ label: 'Fasteners' })
  await form.getByLabel('Supplier').selectOption('s-finolex-maharashtra')
  await form.getByLabel('Size / variant').fill('25 mm')
  await form.getByLabel('Selling unit').selectOption('Piece')
  await form.getByLabel('Purchase rate').fill('100')
  await form.getByLabel('Selling rate').fill('150')
  await form.getByLabel('Default discount %').fill('20')
  await form.getByLabel('Opening stock').fill('0')
  await expect(form.getByText('Margin after 20% discount: ₹20.00')).toBeVisible()
  const saveProduct = form.getByRole('button', { name: 'Save product' })
  await page.getByRole('dialog').locator('.modal-body').evaluate(element => { element.scrollTop = element.scrollHeight })
  await saveProduct.scrollIntoViewIfNeeded()
  if (test.info().project.name === 'mobile-chromium') {
    const bounds = await saveProduct.boundingBox()
    if (!bounds) throw new Error('Save product action is not on screen')
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  } else await saveProduct.click()

  const product = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      products: Array<{ id: string; name: string; category: string; supplierId: string; purchaseRate: number; sellingRate: number; defaultDiscount: number }>
    }
    return data.products.find(row => row.name === 'Regression Valve') ?? null
  })
  expect(product).toMatchObject({
    name: 'Regression Valve',
    category: 'Fasteners',
    supplierId: 's-finolex-maharashtra',
    purchaseRate: 100,
    sellingRate: 150,
    defaultDiscount: 20,
  })
  if (!product) throw new Error('New product was not saved')

  await page.goto(`/inventory/products/${product.id}`)
  await expect(page.getByRole('heading', { name: 'Regression Valve' })).toBeVisible()
  await expect(page.locator('.stat-card').filter({ hasText: 'Margin after discount' }).locator('.stat-value')).toHaveText('₹20.00')
  await expect(page.locator('.detail-list').filter({ hasText: 'Supplier' })).toContainText('Finolex Maharashtra')
  await expect(page.locator('.detail-list').filter({ hasText: 'Supplier' })).toContainText('9822011144')

  await page.getByRole('button', { name: 'Edit product' }).click()
  const editForm = page.getByRole('dialog')
  await editForm.getByLabel('Category').selectOption({ label: 'Electrical' })
  await editForm.getByLabel('Supplier').selectOption('s-astral-pipes')
  await editForm.getByLabel('Default discount %').fill('10')
  await expect(editForm.getByText('Margin after 10% discount: ₹35.00')).toBeVisible()
  const updateProduct = editForm.getByRole('button', { name: 'Save product' })
  await editForm.locator('.modal-body').evaluate(element => { element.scrollTop = element.scrollHeight })
  await updateProduct.scrollIntoViewIfNeeded()
  if (test.info().project.name === 'mobile-chromium') {
    const bounds = await updateProduct.boundingBox()
    if (!bounds) throw new Error('Save product action is not on screen')
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  } else await updateProduct.click()
  await expect(page.getByText('Product updated')).toBeVisible()
  await expect(page.locator('.stat-card').filter({ hasText: 'Margin after discount' }).locator('.stat-value')).toHaveText('₹35.00')
  await expect(page.locator('.detail-list').filter({ hasText: 'Category' })).toContainText('Electrical')
  await expect(page.locator('.detail-list').filter({ hasText: 'Supplier' })).toContainText('Astral Pipes')
  await expect(page.locator('.detail-list').filter({ hasText: 'Supplier' })).toContainText('9822011177')

  await page.goto('/inventory')
  await page.getByLabel('Filter by supplier').selectOption('s-astral-pipes')
  if (test.info().project.name === 'mobile-chromium') {
    await expect(page.locator('.mobile-record').filter({ hasText: 'Regression Valve' })).toBeVisible()
  } else {
    await expect(page.getByRole('row').filter({ hasText: 'Regression Valve' })).toBeVisible()
  }
})
