import { expect, test } from '@playwright/test'
import { canvas, createState, getCanvasDocument, openShell, visualViewports } from './canvas-shell-navigation-fixture'

test('Tab opens the canonical node menu and creates a registry-backed Script node', async ({ page }) => {
  const state = createState()
  await openShell(page, state)

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  const addNodeButton = page.getByRole('button', { name: '添加节点' })
  await expect(addNodeButton).toHaveAttribute('title', '添加节点 (Tab)')
  await expect(addNodeButton).toHaveAttribute('aria-haspopup', 'menu')
  await stage.focus()
  await page.keyboard.press('Tab')

  const menu = page.getByRole('menu', { name: '添加节点' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(9)
  await expect(menu.getByRole('menuitem', { name: '添加脚本卡片' })).toBeVisible()
  await page.screenshot({ path: '../output/playwright/t5-007-unit-a-node-menu-1440x900.png' })

  await menu.getByRole('menuitem', { name: '添加脚本卡片' }).click()
  await expect.poll(() => state.requests.find((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document') &&
    ((request.body as Record<string, unknown>).node_upserts as Array<Record<string, unknown>>)
      .some((item) => item.node_type === 'script')
  ))).toBeTruthy()
  const created = getCanvasDocument(state, 'canvas-first').nodes.find((item) => (
    item.node_type === 'script' && item.content.subtype === 'script'
  ))
  expect(created).toEqual(expect.objectContaining({ width: 320, height: 200 }))
  expect(created?.content).toEqual(expect.objectContaining({ subtype: 'script', serialization_version: 1 }))

  await expect(menu).toHaveCount(0)
  await expect(addNodeButton).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(menu).toHaveCount(0)
  await expect(page.getByRole('button', { name: '打开项目资源' })).toBeFocused()
})

test('normal Canvas switches preserve independent undo stacks without cross-Canvas replay', async ({ page }) => {
  const state = createState()
  await openShell(page, state)
  const workspace = page.getByRole('region', { name: 'Revid 无限画布工作区' })

  await page.locator('.canvas-surface').click({ position: { x: 260, y: 200 } })
  await page.keyboard.press('Control+d')
  await expect.poll(() => getCanvasDocument(state, 'canvas-first').nodes.length).toBe(3)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second(?:\?canvas_runtime=legacy)?$/)
  await workspace.focus()
  await page.keyboard.press('Control+z')
  await page.waitForTimeout(650)
  expect(getCanvasDocument(state, 'canvas-second').nodes).toHaveLength(2)
  expect(getCanvasDocument(state, 'canvas-first').nodes).toHaveLength(3)

  await page.locator('.canvas-surface').click({ position: { x: 260, y: 200 } })
  await page.keyboard.press('Control+d')
  await expect.poll(() => getCanvasDocument(state, 'canvas-second').nodes.length).toBe(3)

  await page.getByRole('button', { name: '分镜' }).click()
  await page.getByRole('option', { name: /画布 1/ }).click()
  await workspace.focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => getCanvasDocument(state, 'canvas-first').nodes.length).toBe(2)
  expect(getCanvasDocument(state, 'canvas-second').nodes).toHaveLength(3)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await workspace.focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => getCanvasDocument(state, 'canvas-second').nodes.length).toBe(2)
})

test('Canvas shell completes metadata navigation through server-confirmed items', async ({ page }) => {
  const state = createState()
  await openShell(page, state)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('button', { name: '新建画布' }).click()
  await page.getByLabel('画布名称').fill('视觉设计')
  await page.getByRole('button', { name: '创建并打开' }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-created(?:\?canvas_runtime=legacy)?$/)

  await page.getByRole('button', { name: '视觉设计' }).click()
  await page.getByRole('button', { name: '重命名当前画布' }).click()
  await page.getByLabel('画布名称').fill('视觉锁定')
  await page.getByRole('button', { name: '保存名称' }).click()
  await expect(page.getByRole('button', { name: '视觉锁定' })).toBeVisible()

  await page.getByRole('button', { name: '视觉锁定' }).click()
  await page.getByRole('button', { name: '向前移动当前画布' }).click()
  await expect.poll(() => state.canvases.map((item) => item.id)).toEqual([
    'canvas-first', 'canvas-created', 'canvas-second',
  ])

  await page.getByRole('button', { name: '复制当前画布' }).click()
  await page.getByLabel('画布名称').fill('视觉备份')
  await page.getByRole('button', { name: '复制并打开' }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-copy(?:\?canvas_runtime=legacy)?$/)

  await page.getByRole('button', { name: '视觉备份' }).click()
  await page.getByRole('button', { name: '归档当前画布' }).click()
  await page.getByRole('button', { name: '确认归档' }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-first(?:\?canvas_runtime=legacy)?$/)
  expect(state.canvases.some((item) => item.id === 'canvas-copy')).toBe(false)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second(?:\?canvas_runtime=legacy)?$/)
})

test('stale reorder reloads recovery state and succeeds on explicit retry', async ({ page }) => {
  const state = createState()
  state.rejectNextReorder = true
  await openShell(page, state)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('button', { name: '向后移动当前画布' }).click()
  await expect(page.locator('.navigation-error')).toContainText('画布排序保存失败，请重试。')
  expect(state.requests.filter((request) => request.path.endsWith('/canvases')).length).toBeGreaterThan(1)

  await page.getByRole('button', { name: '向后移动当前画布' }).click()
  await expect.poll(() => state.canvases.map((item) => item.id)).toEqual(['canvas-second', 'canvas-first'])
})

test('the last active Canvas cannot expose an enabled archive action', async ({ page }) => {
  const state = createState()
  state.canvases = [canvas('canvas-first', '画布 1', 0)]
  await openShell(page, state)

  await page.getByRole('button', { name: '画布 1' }).click()
  await expect(page.getByRole('button', { name: '归档当前画布' })).toBeDisabled()
})

test('mobile shell is rendered read-only and keeps accessible route controls', async ({ page }) => {
  const state = createState()
  await openShell(page, state, { width: 375, height: 812 })

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await expect(stage).toHaveAttribute('aria-description', '只读审阅模式')
  await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加节点' })).toHaveCount(0)
  await page.getByRole('button', { name: '画布 1' }).click()
  await expect(page.getByRole('button', { name: '新建画布' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '归档当前画布' })).toHaveCount(0)

  const backButton = page.getByRole('link', { name: '返回项目首页' })
  const accountButton = page.getByRole('button', { name: /账户菜单/ })
  for (const control of [backButton, accountButton]) {
    const box = await control.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(40)
    expect(box?.height).toBeGreaterThanOrEqual(40)
  }

  await page.keyboard.press('Escape')
  await page.locator('.skip-link').focus()
  await expect(page.locator('.skip-link')).toBeVisible()
  await expect(page.locator('.canvas-workspace')).toHaveCSS('--v2-press-scale', '1')
  expect(state.requests.some((request) => ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method))).toBe(false)
})

test('Canvas accessibility closure preserves language, focus, contrast, and reduced motion', async ({ page }) => {
  const state = createState()
  await openShell(page, state)

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await expect(page.locator('.skip-link')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('#canvas-main')).toBeFocused()

  const switcher = page.getByRole('button', { name: '画布 1' })
  await switcher.focus()
  const contrast = await page.evaluate(() => {
    type Rgba = [number, number, number, number]

    function parseColor(value: string): Rgba {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Canvas color parser is unavailable')
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = value
      context.fillRect(0, 0, 1, 1)
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
      return [red, green, blue, alpha / 255]
    }

    function composite(foreground: Rgba, background: Rgba): Rgba {
      const alpha = foreground[3] + background[3] * (1 - foreground[3])
      if (alpha === 0) return [0, 0, 0, 0]
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha,
      ]
    }

    function luminance(color: Rgba) {
      const linear = color.slice(0, 3).map((channel) => {
        const normalized = channel / 255
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
    }

    function ratio(foregroundValue: string, backgroundValue: string) {
      const background = parseColor(backgroundValue)
      const foreground = composite(parseColor(foregroundValue), background)
      const lighter = Math.max(luminance(foreground), luminance(background))
      const darker = Math.min(luminance(foreground), luminance(background))
      return (lighter + 0.05) / (darker + 0.05)
    }

    const identity = document.querySelector<HTMLElement>('.identity-cluster')
    const project = document.querySelector<HTMLElement>('.project-name b')
    const switcher = document.querySelector<HTMLElement>('.canvas-switcher')
    if (!identity || !project || !switcher) throw new Error('Canvas identity controls are unavailable')
    const background = getComputedStyle(identity).backgroundColor
    return {
      secondaryText: ratio(getComputedStyle(project).color, background),
      primaryText: ratio(getComputedStyle(switcher).color, background),
      focusRing: ratio(getComputedStyle(switcher).outlineColor, background),
    }
  })
  expect(contrast.secondaryText).toBeGreaterThanOrEqual(4.5)
  expect(contrast.primaryText).toBeGreaterThanOrEqual(4.5)
  expect(contrast.focusRing).toBeGreaterThanOrEqual(3)

  const shell = page.locator('.canvas-workspace')
  await expect(shell).toHaveCSS('--v2-press-scale', '1')
  const reducedMotionDuration = await shell.evaluate((element) => (
    getComputedStyle(element).getPropertyValue('--v2-duration-fast').trim()
  ))
  expect(reducedMotionDuration).toMatch(/^0(?:s|ms)$/)
  await expect(page.locator('.node-status-overlay.is-running')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.node-status-overlay.is-running .status-icon')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.connection-line.active')).toHaveCSS('animation-name', 'none')
  await expect(page.getByText('浏览审阅模式', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toContainText('短片工作室')
})

test('Canvas route controls retain 40px targets across the required viewport matrix', async ({ page }) => {
  const state = createState()
  await openShell(page, state)

  for (const viewport of visualViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const controls = page.locator('.route-chrome a:visible, .route-chrome button:visible')
    const count = await controls.count()
    expect(count, `${viewport.name} should expose route controls`).toBeGreaterThan(0)
    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index)
      const box = await control.boundingBox()
      expect(box?.width, `${viewport.name} control ${index} width`).toBeGreaterThanOrEqual(40)
      expect(box?.height, `${viewport.name} control ${index} height`).toBeGreaterThanOrEqual(40)
    }
  }
})
