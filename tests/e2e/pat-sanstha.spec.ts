import { expect, test } from '@playwright/test'
import { initialData } from '../../src/mock-data'

test.beforeEach(async ({ page }) => {
  const fixture = structuredClone(initialData)
  fixture.deposits = []
  fixture.settings.depositPlans = []
  await page.addInitScript(data => {
    if (!localStorage.getItem('vinay-traders-client-data-v2')) {
      localStorage.setItem('vinay-traders-client-data-v2', JSON.stringify(data))
    }
  }, fixture)
})

test('Pat Sanstha plans keep separate same-day deposits and period reports', async ({ page }, info) => {
  test.setTimeout(90_000)
  await page.clock.install({ time: new Date('2026-11-13T12:00:00') })
  await page.goto('/patsanstha')

  await page.getByRole('button', { name: 'Manage plans' }).click()
  const addPlan = async (name: string, amount: string) => {
    await page.getByLabel('Pat Sanstha name').fill(name)
    await page.getByLabel('Expected amount per day').fill(amount)
    await page.getByRole('button', { name: 'Add Pat Sanstha' }).click()
    await expect(page.getByText('Pat Sanstha deposit plan added')).toBeVisible()
    await page.locator('[data-sonner-toast]').filter({ hasText: 'Pat Sanstha deposit plan added' }).waitFor({ state: 'hidden' })
  }
  await addPlan('Daily Savings A', '500')
  await addPlan('Cooperative Savings B', '350')

  const planIds = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      settings: { depositPlans: Array<{ id: string; name: string }> }
    }
    return Object.fromEntries(data.settings.depositPlans.map(plan => [plan.name, plan.id]))
  }) as Record<string, string>
  await page.getByRole('button', { name: 'Close dialog' }).click()

  const addDeposit = async (planName: string, date: string, amount: string) => {
    await page.getByRole('button', { name: 'Add deposit' }).click()
    await page.locator('.modal select').first().selectOption(planIds[planName]!)
    await expect(page.getByLabel('Expected amount')).toHaveValue(planName === 'Daily Savings A' ? '₹500.00' : '₹350.00')
    await page.getByLabel('Deposit date').fill(date)
    await page.getByLabel('Amount paid').fill(amount)
    await page.getByRole('button', { name: 'Save deposit' }).click()
    await expect(page.getByText('Deposit saved')).toBeVisible()
    await page.locator('[data-sonner-toast]').filter({ hasText: 'Deposit saved' }).waitFor({ state: 'hidden' })
  }
  await addDeposit('Daily Savings A', '2026-11-09', '500')
  await addDeposit('Cooperative Savings B', '2026-10-31', '350')
  await addDeposit('Daily Savings A', '2026-11-13', '500')
  await addDeposit('Cooperative Savings B', '2026-11-13', '350')

  await page.getByRole('button', { name: 'Manage plans' }).click()
  const planRow = page.locator('.deposit-plan-row').filter({ hasText: 'Daily Savings A' })
  await planRow.getByLabel('Daily amount for Daily Savings A').fill('550')
  await planRow.getByRole('button', { name: 'Save amount' }).click()
  await expect(page.getByText('New daily deposit amount saved. Older deposit history is unchanged.')).toBeVisible()
  await page.locator('[data-sonner-toast]').filter({ hasText: 'New daily deposit amount saved.' }).waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Close dialog' }).click()

  const ledger = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('vinay-traders-client-data-v2') ?? '{}') as {
      deposits: Array<{ date: string; planId: string; expected: number; paid: number }>
      settings: { depositPlans: Array<{ id: string; dailyAmount: number }> }
    }
    return { deposits: data.deposits, plans: data.settings.depositPlans }
  })
  expect(ledger.deposits).toHaveLength(4)
  expect(ledger.plans.find(plan => plan.id === planIds['Daily Savings A'])?.dailyAmount).toBe(550)
  expect(ledger.deposits.find(row => row.planId === planIds['Daily Savings A'] && row.date === '2026-11-09')).toMatchObject({ expected: 500, paid: 500 })
  expect(ledger.deposits.filter(row => row.date === '2026-11-13')).toEqual(expect.arrayContaining([
    expect.objectContaining({ planId: planIds['Daily Savings A'], expected: 500, paid: 500 }),
    expect.objectContaining({ planId: planIds['Cooperative Savings B'], expected: 350, paid: 350 }),
  ]))

  for (const period of ['Daily', 'Weekly', 'Monthly'] as const) {
    await page.getByRole('button', { name: period, exact: true }).click()
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export report' }).click()
    const report = await downloadEvent
    await report.saveAs(info.outputPath(`pat-sanstha-${period.toLowerCase()}-a4.pdf`))
  }
})
