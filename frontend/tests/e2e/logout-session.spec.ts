import { expect, test, type Page, type Route } from '@playwright/test'
import { createVisualState, installMockApi } from './authenticated-workflow-fixture'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function installAuthenticatedSession(page: Page) {
  const state = createVisualState()
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  return state
}

async function openAccountMenu(page: Page) {
  const trigger = page.getByRole('button', { name: /账户菜单/ })
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const menu = page.getByRole('menu', { name: /账户操作/ })
  const logoutOption = page.getByRole('menuitem', { name: '退出登录' })
  await expect(menu).toBeVisible()
  await expect(logoutOption).toBeVisible()

  const menuBox = await menu.boundingBox()
  const viewport = page.viewportSize()
  expect(menuBox?.x).toBeGreaterThanOrEqual(0)
  expect(menuBox?.y).toBeGreaterThanOrEqual(0)
  expect((menuBox?.x ?? 0) + (menuBox?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0)
  expect((menuBox?.y ?? 0) + (menuBox?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0)
}

async function fulfillLogout(route: Route, status: number) {
  await route.fulfill({
    status,
    headers: corsHeaders(),
    body: JSON.stringify(
      status === 200
        ? { ok: true, detail: 'Bearer session acknowledged for client logout' }
        : { detail: 'Logout service unavailable' },
    ),
  })
}

test('authenticated shells expose one responsive account session menu', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installAuthenticatedSession(page)

  for (const path of [
    '/',
    '/app/space',
    '/app/projects/project-e2e/canvases/canvas-first',
    '/admin',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('button', { name: /账户菜单/ })).toBeVisible()
  }

  await page.goto('/')
  const keyboardTrigger = page.getByRole('button', { name: /账户菜单/ })
  await keyboardTrigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: '退出登录' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menuitem', { name: '退出登录' })).toBeHidden()

  await openAccountMenu(page)
  await page.waitForTimeout(180)
  await page.screenshot({ path: testInfo.outputPath('logout-menu-desktop.png') })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await openAccountMenu(page)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1)
  await page.waitForTimeout(180)
  await page.screenshot({ path: testInfo.outputPath('logout-menu-home-mobile.png') })

  await page.goto('/app/projects/project-e2e/canvases/canvas-first')
  await openAccountMenu(page)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1)
  await page.waitForTimeout(180)
  await page.screenshot({ path: testInfo.outputPath('logout-menu-mobile.png') })
})

test('logout sends the bearer token once before clearing state and replacing the route', async ({ page }) => {
  await installAuthenticatedSession(page)
  let logoutCalls = 0
  let authorization = ''
  let releaseLogout: () => void = () => undefined
  let markRequestReached: () => void = () => undefined
  let markRequestCompleted: () => void = () => undefined
  const requestReached = new Promise<void>((resolve) => {
    markRequestReached = resolve
  })
  const requestCompleted = new Promise<void>((resolve) => {
    markRequestCompleted = resolve
  })
  await page.route(`${API_ORIGIN}/auth/logout`, async (route) => {
    logoutCalls += 1
    authorization = route.request().headers().authorization || ''
    markRequestReached()
    await new Promise<void>((resolve) => {
      releaseLogout = resolve
    })
    await fulfillLogout(route, 200)
    markRequestCompleted()
  })

  await page.goto('/app/space')
  await openAccountMenu(page)
  await page.getByRole('menuitem', { name: '退出登录' }).click()

  await requestReached
  try {
    await expect(page).toHaveURL('/login')
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('revid_token'))).toBeNull()
    expect(authorization).toBe('Bearer mock-session-token')
    expect(logoutCalls).toBe(1)
  } finally {
    releaseLogout()
  }
  await requestCompleted
})

test('logout clears local state and leaves protected content when the backend fails', async ({ page }) => {
  await installAuthenticatedSession(page)
  let logoutCalls = 0
  await page.route(`${API_ORIGIN}/auth/logout`, async (route) => {
    logoutCalls += 1
    await fulfillLogout(route, 503)
  })

  await page.goto('/admin')
  await openAccountMenu(page)
  await page.getByRole('menuitem', { name: '退出登录' }).click()

  await expect(page).toHaveURL('/login')
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('revid_token'))).toBeNull()
  expect(logoutCalls).toBe(1)
})
