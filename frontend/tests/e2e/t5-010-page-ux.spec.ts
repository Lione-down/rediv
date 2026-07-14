import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const ADMIN_USER = {
  id: 'admin-e2e',
  username: 'admin',
  email: 'admin@example.com',
  nickname: 'Admin Operator',
  avatar_url: '',
  role: 'admin',
  status: 'active',
  generation_status: 'enabled',
  created_at: '2026-07-14T08:00:00Z',
  updated_at: '2026-07-14T08:00:00Z',
  last_login_at: '2026-07-14T08:00:00Z',
}

async function installAdminApi(page: Page) {
  await page.route(`${API_ORIGIN}/**`, async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': 'http://127.0.0.1:9099' } })
      return
    }

    if (request.method() === 'GET' && url.pathname === '/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: ADMIN_USER, quotas: { text: 20, image: 8, video: 2 }, quota_revision: 1 }) })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, page: 1, page_size: 20 }) })
  })
}

test('T5-010 admin pages retain V2 surfaces across desktop and mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installAdminApi(page)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'admin-e2e-token'))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Admin Operator 的创作工作台' })).toBeVisible()
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Revid Admin' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /把注册、额度、任务和资产状态/ })).toBeVisible()
  await expect(page.locator('.admin-layout')).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await page.screenshot({ path: testInfo.outputPath('admin-desktop.png'), fullPage: true })

  for (const item of [
    { label: '用户', heading: /先搭出账户状态/ },
    { label: '邀请码', heading: /把注册准入/ },
    { label: '额度', heading: /先把额度类型/ },
    { label: '资产', heading: /让上传资产/ },
    { label: '任务', heading: /先把多模型任务队列/ },
  ]) {
    await page.getByRole('link', { name: new RegExp(`^${item.label}`) }).click()
    await expect(page.getByRole('heading', { name: item.heading })).toBeVisible()
  }

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/admin')
  await expect(page.getByRole('navigation', { name: 'Admin 导航' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('admin-mobile.png'), fullPage: true })
})
