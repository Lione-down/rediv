import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-044-composer-zoom')

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
}

async function setZoom(page: import('@playwright/test').Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

async function composerMetrics(page: import('@playwright/test').Page) {
  return page.locator('.canvas-node-surface.is-composer').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      height: rect.height,
      left: rect.left,
      top: rect.top,
      transform: style.transform,
      transformOrigin: style.transformOrigin,
      width: rect.width,
    }
  })
}

test('generation composer scales as one world-space surface from 10% through 800%', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await selectGeneration(page)
  const metrics = new Map<number, Awaited<ReturnType<typeof composerMetrics>>>()

  for (const percent of [100, 10, 50, 800]) {
    await setZoom(page, percent)
    metrics.set(percent, await composerMetrics(page))
  }

  const normal = metrics.get(100)!
  expect(normal.width).toBeCloseTo(340, 0)
  expect(normal.height).toBeCloseTo(76, 0)
  for (const percent of [10, 50, 800]) {
    const current = metrics.get(percent)!
    expect(current.width).toBeCloseTo(normal.width * percent / 100, 0)
    expect(current.height).toBeCloseTo(normal.height * percent / 100, 0)
    expect(current.transform).not.toBe('none')
    expect(current.transformOrigin).toMatch(/^0px 0px/)
  }
})

test('full trace fit keeps low-zoom composer content proportional and aligned', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await selectGeneration(page)
  await page.getByRole('button', { name: '适配完整生成链路' }).click()

  const zoom = Number(await page.getByLabel('缩放百分比').inputValue())
  expect(zoom).toBeLessThan(70)
  const surface = page.locator('.canvas-node-surface.is-composer')
  const editor = page.getByRole('textbox', { name: '编辑合并四路上下文生成内容' })
  await expect(surface).toBeVisible()
  await expect(editor).toBeVisible()
  const metrics = await composerMetrics(page)
  expect(Math.abs(metrics.width - 340 * zoom / 100)).toBeLessThanOrEqual(2)
  expect(Math.abs(metrics.height - 76 * zoom / 100)).toBeLessThanOrEqual(1)
  expect(metrics.transform).not.toBe('none')

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'desktop-full-trace-1440x900.png'), fullPage: true })
})

test('compact keeps the scaled composer editable while mobile retains review-only boundary', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 920, height: 760 })
  await selectGeneration(page)
  await expect(page.getByRole('textbox', { name: '编辑合并四路上下文生成内容' })).toBeVisible()
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await expect(page.locator('.canvas-node-surface.is-composer')).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-full-trace-920x760.png'), fullPage: true })

  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  await selectGeneration(page)
  await expect(page.locator('.canvas-node-surface.is-composer')).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: /编辑.*内容/ })).toHaveCount(0)
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-trace-375x812.png'), fullPage: true })
})
