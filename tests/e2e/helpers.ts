import { expect, type Locator, type Page } from '@playwright/test'

export function uniqueId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export async function fillAuthForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByPlaceholder('you@example.com').fill(email)
  const passwordInput = page
    .locator('input[placeholder="••••••••"]')
    .filter({ visible: true })
    .first()
  await passwordInput.fill(password)
}

export async function clickVisibleButtonByText(page: Page, text: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(text) }).first().click()
}

export async function expectUrlPath(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}(\\?.*)?$`))
}

export async function expectToast(page: Page, text: string): Promise<void> {
  await expect(
    page.locator('.p-toast-message-text').getByText(text, { exact: false }),
  ).toBeVisible({ timeout: 15_000 })
}

export async function ensureDomainAvailable(page: Page, input: Locator): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const slug = uniqueId('e2e').replace(/[^a-z0-9-]/g, '').slice(0, 28)
    await input.fill(slug)
    await page.waitForTimeout(1_300)

    const taken = page.getByText('Занят, попробуйте другой')
    if (await taken.isVisible().catch(() => false)) continue

    const freeText = page.getByText('Домен свободен')
    if (await freeText.isVisible().catch(() => false)) return slug

    const checkError = page.getByText('Не удалось проверить домен, попробуйте снова')
    if (await checkError.isVisible().catch(() => false)) continue
  }

  throw new Error(
    'Не удалось подтвердить свободный slug через check-slug (домен занят или edge function недоступна)',
  )
}
