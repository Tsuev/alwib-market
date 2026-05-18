import { expect, test } from '@playwright/test'
import { ensureDomainAvailable, expectToast, expectUrlPath, fillAuthForm, uniqueId } from './helpers'

const loginEmail = process.env.E2E_USER_EMAIL
const loginPassword = process.env.E2E_USER_PASSWORD

test.describe('Full Store Builder Flow', () => {
  test.skip(
    !loginEmail || !loginPassword,
    'Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.e2e (or shell env)',
  )

  test('login -> publish store -> add product -> preview -> public storefront', async ({ page }) => {
    if (process.env.E2E_MOCK_CHECK_SLUG === '1') {
      await page.route('**/functions/v1/check-slug', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ available: true }),
        })
      })
    }

    const storeName = `E2E Store ${uniqueId('name')}`
    const productName = `E2E Product ${uniqueId('product')}`

    await page.goto('/auth')
    await fillAuthForm(page, loginEmail!, loginPassword!)
    await page.getByRole('button', { name: /Войти/ }).click()
    await expectUrlPath(page, '/')

    const storeNameInput = page.getByPlaceholder('Например: Мастерская Берёзка')
    await storeNameInput.fill(storeName)

    const domainInput = page.getByPlaceholder('Название магазина на Английском языке')
    const slug = await ensureDomainAvailable(page, domainInput)

    const whatsappInput = page.getByPlaceholder('+7 (999) 999-99-99')
    await whatsappInput.fill('+79991234567')

    await page.getByRole('button', { name: 'Опубликовать' }).click()
    await expectToast(page, 'Магазин успешно сохранён!')

    await page.getByRole('button', { name: 'Добавить товар' }).click()
    await expect(page.getByText('Новый товар')).toBeVisible()

    await page.getByPlaceholder('Например: Керамическая кружка').fill(productName)
    await page.getByPlaceholder('Расскажите о товаре…').fill('Тестовое описание товара для e2e')
    await page.getByPlaceholder('2 400').fill('2400')
    await page.getByPlaceholder('1 800').fill('2100')

    const tagsInput = page.getByPlaceholder('Добавить тег…')
    await tagsInput.fill('e2e')
    await tagsInput.press('Enter')

    await page.getByRole('button', { name: 'Сохранить товар' }).click()
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Превью' }).click()
    await expectUrlPath(page, '/preview')
    await expect(page.getByText(storeName)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Посмотреть' }).first().click()
    await expect(page.getByText('Связаться')).toBeVisible()
    await expect(page.getByRole('link', { name: /WhatsApp/i })).toBeVisible()

    await page.goto(`/${slug}`)
    await expect(page.getByText(storeName)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10_000 })

    await page.getByPlaceholder('Найти товар…').fill('несуществующий-товар-e2e')
    await expect(page.getByText('Ничего не найдено')).toBeVisible()

    await page.getByPlaceholder('Найти товар…').fill('e2e product')
    await expect(page.getByText(productName)).toBeVisible()
  })
})
