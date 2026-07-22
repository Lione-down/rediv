import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-046-media-fallback-zoom')

async function setZoom(page: import('@playwright/test').Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

async function fallbackMetrics(page: import('@playwright/test').Page) {
  return page.locator('.canvas-node-media__message').evaluateAll((messages) => messages.map((message) => {
    const rect = message.getBoundingClientRect()
    const style = getComputedStyle(message)
    const surfaceRect = message.closest('.canvas-node-surface')!.getBoundingClientRect()
    return {
      borderRadius: Number.parseFloat(style.borderRadius),
      contained: rect.left >= surfaceRect.left && rect.top >= surfaceRect.top &&
        rect.right <= surfaceRect.right && rect.bottom <= surfaceRect.bottom,
      fontSize: Number.parseFloat(style.fontSize),
      height: rect.height,
      paddingBlock: Number.parseFloat(style.paddingTop),
      paddingInline: Number.parseFloat(style.paddingLeft),
      text: message.textContent,
      width: rect.width,
    }
  }))
}

test('placeholder and error fallback typography scales from 10% through 800%', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  const metrics = new Map<number, Awaited<ReturnType<typeof fallbackMetrics>>>()

  for (const percent of [100, 10, 50, 800]) {
    await setZoom(page, percent)
    await expect(page.locator('.canvas-node-media__message')).toHaveCount(2)
    metrics.set(percent, await fallbackMetrics(page))
  }

  expect(metrics.get(100)!.map((item) => item.text)).toEqual([
    '图片结果暂未提供预览',
    '媒体不可用，可稍后重试',
  ])
  for (const percent of [10, 50, 100, 800]) {
    const scale = percent / 100
    for (const metric of metrics.get(percent)!) {
      expect(metric.fontSize).toBeCloseTo(12 * scale, 1)
      expect(metric.paddingBlock).toBeCloseTo(8 * scale, 1)
      expect(metric.paddingInline).toBeCloseTo(12 * scale, 1)
      expect(metric.borderRadius).toBeCloseTo(8 * scale, 1)
    }
  }
})

test('full trace and mobile overview keep fallback messages inside result surfaces', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  expect((await fallbackMetrics(page)).every((item) => item.contained)).toBe(true)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'desktop-full-trace-1440x900.png'), fullPage: true })

  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+0')
  const mobileMetrics = await fallbackMetrics(page)
  expect(mobileMetrics).toHaveLength(2)
  expect(mobileMetrics.every((item) => item.contained)).toBe(true)
  expect(mobileMetrics.every((item) => item.fontSize < 3)).toBe(true)
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-overview-375x812.png'), fullPage: true })
})

test('compact trace preserves fallback states beside playable native video', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 920, height: 760 })
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await expect(page.getByText('图片结果暂未提供预览')).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: '媒体不可用' }).first()).toBeVisible()
  const brokenImages = page.locator('img[src*="broken-result.png"]')
  await expect(brokenImages).toHaveCount(2)
  await expect(brokenImages.nth(0)).toBeHidden()
  await expect(brokenImages.nth(1)).toBeHidden()
  const video = page.locator('video[aria-label="视频结果"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-full-trace-920x760.png'), fullPage: true })
})
