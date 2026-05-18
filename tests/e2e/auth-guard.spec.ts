import { expect, test } from '@playwright/test'
import { expectUrlPath, fillAuthForm } from './helpers'

test.describe('Auth and Router Guards', () => {
  test('guest is redirected to /auth from private routes', async ({ page }) => {
    await page.goto('/')
    await expectUrlPath(page, '/auth')

    await page.goto('/preview')
    await expectUrlPath(page, '/auth')
  })

  test('auth form client-side validation works', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: /Войти/ }).click()
    await expect(page.getByText('Введите email')).toBeVisible()

    await fillAuthForm(page, 'invalid-email', '123456')
    await page.getByRole('button', { name: /Войти/ }).click()
    await expect(page.getByText('Некорректный формат email')).toBeVisible()

    await fillAuthForm(page, 'qa@example.com', '123')
    await page.getByRole('button', { name: /Войти/ }).click()
    await expect(page.getByText('Пароль должен содержать минимум 6 символов')).toBeVisible()
  })

  test('register mode validates password confirmation', async ({ page }) => {
    await page.goto('/auth')
    await page.getByText('Зарегистрироваться').click()

    await page.getByPlaceholder('you@example.com').fill('qa-register@example.com')
    await page.locator('input[placeholder="••••••••"]').first().fill('Test123!')
    await page.locator('input[placeholder="••••••••"]').nth(1).fill('Test1234!')
    await page.getByRole('button', { name: /Создать аккаунт/ }).click()

    await expect(page.getByText('✕ Пароли не совпадают')).toBeVisible()
  })
})
