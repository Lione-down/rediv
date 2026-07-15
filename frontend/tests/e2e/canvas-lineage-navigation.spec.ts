import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-042-lineage-navigation')

async function selectNode(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

function viewportPatches(state: ReturnType<typeof createMultiScenarioState>) {
  return state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith(`/canvases/${FIRST_CANVAS_ID}/viewport`)
  ))
}

async function expectSelectedNode(page: Page, title: string) {
  await expect(page.locator('.minimap-node.selected')).toHaveAttribute('aria-label', `定位到 ${title}`)
}

async function expectCameraOnlyNavigation(
  page: Page,
  state: ReturnType<typeof createMultiScenarioState>,
  initialViewportCount: number,
) {
  await page.waitForTimeout(350)
  expect(viewportPatches(state).length).toBeLessThanOrEqual(initialViewportCount + 1)
  expect(documentPatches(state)).toHaveLength(0)
}

test('desktop generation inspector locates exact T and R sources while staying synchronized', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '合并四路上下文生成')
  const viewportCount = viewportPatches(state).length

  await expect(page.getByRole('button', { name: '定位到画布：中文剧情约束' })).toBeVisible()
  await expect(page.getByRole('button', { name: '定位到画布：海岸环境参考' })).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'desktop-generation-source-actions-1440x900.png'), fullPage: true })

  await page.getByRole('button', { name: '定位到画布：中文剧情约束' }).focus()
  await page.keyboard.press('Enter')
  await expectSelectedNode(page, '中文剧情约束')
  await expect(page.getByRole('complementary', { name: /节点详情 中文剧情约束/ })).toBeVisible()
  await expectCameraOnlyNavigation(page, state, viewportCount)
})

test('desktop result inspector navigates to its canonical origin generation', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '损坏媒体结果')
  const viewportCount = viewportPatches(state).length

  await page.getByRole('button', { name: '定位到画布：合并四路上下文生成' }).click()
  await expectSelectedNode(page, '合并四路上下文生成')
  await expect(page.getByRole('complementary', { name: /节点详情 合并四路上下文生成/ })).toBeVisible()
  await expect(page.locator('.connection-line.provenance-selected-result')).toHaveCount(0)
  await expectCameraOnlyNavigation(page, state, viewportCount)
})

test('excluded media source remains directly locatable without becoming request input', async ({ page }) => {
  const state = createMultiScenarioState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'asset-portrait')!
  source.content = { ...source.content, subtype: 'video' }
  await openResourceWorkspace(page, state)
  await selectNode(page, '合并四路上下文生成')

  const link = page.getByRole('button', { name: '定位到画布：人物造型参考' })
  await expect(link).toBeVisible()
  await expect(link.locator('xpath=ancestor::li')).toContainText('仅支持图片，未使用')
  await link.click()
  await expectSelectedNode(page, '人物造型参考')
  expect(documentPatches(state)).toHaveLength(0)
})

test('920px locate closes the drawer once while ordinary selection still opens context', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 920, height: 760 })
  await selectNode(page, '合并四路上下文生成')
  const viewportCount = viewportPatches(state).length

  await page.getByRole('button', { name: '定位到画布：人物造型参考' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await expectSelectedNode(page, '人物造型参考')
  await expectCameraOnlyNavigation(page, state, viewportCount)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-located-reference-920x760.png'), fullPage: true })

  await selectNode(page, '动态镜头结果')
  await expect(page.locator('.n-drawer:visible')).toHaveCount(1)
})

test('readonly mobile result locates origin on Canvas without mutation or drawer reopen', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '宽银幕主镜头')
  const viewportCount = viewportPatches(state).length

  await page.getByRole('button', { name: '定位到画布：合并四路上下文生成' }).click()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await expectSelectedNode(page, '合并四路上下文生成')
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  await expectCameraOnlyNavigation(page, state, viewportCount)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-located-generation-375x812.png'), fullPage: true })
})
