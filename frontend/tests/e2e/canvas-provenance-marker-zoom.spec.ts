import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-047-provenance-marker-zoom')

async function setZoom(page: import('@playwright/test').Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
}

async function markerMetrics(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).evaluateAll((overlays) => overlays.map((overlay) => {
    const overlayRect = overlay.getBoundingClientRect()
    const markerRect = overlay.querySelector('span')!.getBoundingClientRect()
    return {
      height: markerRect.height,
      markerCenterX: markerRect.left + markerRect.width / 2,
      markerCenterY: markerRect.top + markerRect.height / 2,
      overlayLeft: overlayRect.left,
      overlayRight: overlayRect.right,
      overlayTop: overlayRect.top,
      text: overlay.textContent?.trim(),
      width: markerRect.width,
    }
  }))
}

test('T R and V marker pills scale proportionally and remain corner anchored', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await selectGeneration(page)
  const metrics = new Map<number, {
    results: Awaited<ReturnType<typeof markerMetrics>>
    sources: Awaited<ReturnType<typeof markerMetrics>>
  }>()

  for (const percent of [100, 10, 50, 800]) {
    await setZoom(page, percent)
    metrics.set(percent, {
      sources: await markerMetrics(page, '.generation-source-provenance'),
      results: await markerMetrics(page, '.result-lineage-node'),
    })
  }

  expect(metrics.get(100)!.sources.map((item) => item.text)).toEqual(['T1', 'T2', 'R1', 'R2'])
  expect(metrics.get(100)!.results.map((item) => item.text)).toEqual(['V1', 'V2', 'V3', 'V4', 'V5', 'V6'])
  for (const percent of [10, 50, 100, 800]) {
    const expectedScale = Math.min(percent / 100, 1.2)
    for (const [kind, items] of Object.entries(metrics.get(percent)!)) {
      const baseline = metrics.get(100)![kind as 'sources' | 'results']
      items.forEach((item, index) => {
        expect(item.width, `${kind} ${item.text} width at ${percent}%`).toBeCloseTo(baseline[index].width * expectedScale, 0)
        expect(item.height, `${kind} ${item.text} height at ${percent}%`).toBeCloseTo(baseline[index].height * expectedScale, 0)
        expect(item.markerCenterY, `${kind} ${item.text} top anchor at ${percent}%`).toBeCloseTo(item.overlayTop, 0)
        const expectedX = kind === 'sources' ? item.overlayLeft : item.overlayRight
        expect(item.markerCenterX, `${kind} ${item.text} side anchor at ${percent}%`).toBeCloseTo(expectedX, 0)
      })
    }
  }
})

test('trace fit keeps proportional markers quiet across desktop and compact layouts', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await selectGeneration(page)
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'desktop-full-trace-1440x900.png'), fullPage: true })

  await openResourceWorkspace(page, createMultiScenarioState(), { width: 920, height: 760 })
  await selectGeneration(page)
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-full-trace-920x760.png'), fullPage: true })
})

test('mobile readonly trace overview retains lineage without oversized pills', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  await selectGeneration(page)
  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  const sourceMetrics = await markerMetrics(page, '.generation-source-provenance')
  const resultMetrics = await markerMetrics(page, '.result-lineage-node')
  expect([...sourceMetrics, ...resultMetrics].every((item) => item.height < 6)).toBe(true)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-full-trace-375x812.png'), fullPage: true })
})
