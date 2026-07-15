import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-045-status-zoom')

async function setZoom(page: import('@playwright/test').Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

async function badgeMetrics(page: import('@playwright/test').Page) {
  return page.locator('.node-status-badge').evaluateAll((badges) => badges.map((badge) => {
    const rect = badge.getBoundingClientRect()
    const style = getComputedStyle(badge)
    const label = badge.querySelector('span')!
    const labelRect = label.getBoundingClientRect()
    return {
      height: rect.height,
      labelHeight: labelRect.height,
      labelWhiteSpace: getComputedStyle(label).whiteSpace,
      transform: style.transform,
      width: rect.width,
    }
  }))
}

test('running, success, and failure badges scale proportionally below 100% and cap above 120%', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  const metrics = new Map<number, Awaited<ReturnType<typeof badgeMetrics>>>()

  for (const percent of [100, 10, 50, 800]) {
    await setZoom(page, percent)
    metrics.set(percent, await badgeMetrics(page))
  }

  expect(metrics.get(100)).toHaveLength(6)
  for (const [index, normal] of metrics.get(100)!.entries()) {
    const tiny = metrics.get(10)![index]
    const overview = metrics.get(50)![index]
    const extreme = metrics.get(800)![index]
    expect(tiny.width).toBeCloseTo(normal.width * 0.1, 0)
    expect(tiny.height).toBeCloseTo(normal.height * 0.1, 0)
    expect(overview.width).toBeCloseTo(normal.width * 0.5, 0)
    expect(overview.height).toBeCloseTo(normal.height * 0.5, 0)
    expect(extreme.width).toBeCloseTo(normal.width * 1.2, 0)
    expect(extreme.height).toBeCloseTo(normal.height * 1.2, 0)
  }
})

test('dense full trace keeps every lifecycle label on one proportional line', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
  await page.getByRole('button', { name: '适配完整生成链路' }).click()

  const metrics = await badgeMetrics(page)
  expect(metrics).toHaveLength(6)
  for (const metric of metrics) {
    expect(metric.labelWhiteSpace).toBe('nowrap')
    expect(metric.labelHeight).toBeLessThanOrEqual(metric.height)
  }
  await expect(page.locator('.node-status-overlay.is-running')).toHaveCount(0)
  await expect(page.locator('.node-status-overlay.is-success')).toHaveCount(4)
  await expect(page.locator('.node-status-overlay.is-warning')).toHaveCount(2)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'desktop-full-trace-1440x900.png'), fullPage: true })
})

test('compact and mobile overview retain distinct lifecycle signals without editing mutation', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 920, height: 760 })
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await expect(page.locator('.node-status-badge')).toHaveCount(6)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-full-trace-920x760.png'), fullPage: true })

  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+0')
  await expect(page.locator('.node-status-badge')).toHaveCount(6)
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-overview-375x812.png'), fullPage: true })
})
