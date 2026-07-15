import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-039-end-to-end-provenance')
const traceFitEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-040-full-trace-fit')
const resultTraceFitEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-041-result-origin-trace-fit')

function viewportPatches(state: ReturnType<typeof createMultiScenarioState>) {
  return state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith(`/canvases/${FIRST_CANVAS_ID}/viewport`)
  ))
}

async function expectTraceInsideSurface(page: import('@playwright/test').Page, resultOrigin = false) {
  const surface = await page.locator('.canvas-surface').boundingBox()
  expect(surface).not.toBeNull()
  const titles = [
    '中文剧情约束', 'Cinematic direction with deliberately long English content',
    '海岸环境参考', '人物造型参考', '合并四路上下文生成', '宽银幕主镜头',
    '方形社交版本', '竖屏人物版本', '动态镜头结果', '上游返回空结果', '损坏媒体结果',
  ]
  const sourceMarkers = page.locator('.generation-source-provenance')
  const resultMarkers = page.locator('.result-lineage-node')
  const generationMarker = page.locator('.node-status-overlay').first()
  await expect(sourceMarkers).toHaveCount(4)
  await expect(resultMarkers).toHaveCount(resultOrigin ? 7 : 6)
  if (!resultOrigin) await expect(generationMarker).toBeVisible()
  const nodes = resultOrigin
    ? [...Array.from({ length: 4 }, (_, index) => sourceMarkers.nth(index)), ...Array.from({ length: 7 }, (_, index) => resultMarkers.nth(index))]
    : [...Array.from({ length: 4 }, (_, index) => sourceMarkers.nth(index)), generationMarker, ...Array.from({ length: 6 }, (_, index) => resultMarkers.nth(index))]
  for (const [index, title] of titles.entries()) {
    const rect = await nodes[index].boundingBox()
    expect(rect, title).not.toBeNull()
    expect(rect!.x, title).toBeGreaterThanOrEqual(surface!.x + 14)
    expect(rect!.y, title).toBeGreaterThanOrEqual(surface!.y + 90)
    expect(rect!.x + rect!.width, title).toBeLessThanOrEqual(surface!.x + surface!.width - 14)
    expect(rect!.y + rect!.height, title).toBeLessThanOrEqual(surface!.y + surface!.height - 90)
  }
}

async function expectToolbarClearOfTrace(page: import('@playwright/test').Page) {
  const toolbar = await page.locator('.selection-toolbar').boundingBox()
  expect(toolbar).not.toBeNull()
  const markers = page.locator('.generation-source-provenance, .result-lineage-node')
  await expect(markers).toHaveCount(11)
  for (let index = 0; index < await markers.count(); index += 1) {
    const rect = await markers.nth(index).boundingBox()
    expect(rect).not.toBeNull()
    const overlaps = toolbar!.x < rect!.x + rect!.width && toolbar!.x + toolbar!.width > rect!.x &&
      toolbar!.y < rect!.y + rect!.height && toolbar!.y + toolbar!.height > rect!.y
    expect(overlaps, `toolbar overlaps lineage marker ${index}`).toBe(false)
  }
}

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

test('selected multi-input generation shows ordered source and edge provenance', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '合并四路上下文生成')

  const markers = page.locator('.generation-source-provenance')
  await expect(markers).toHaveCount(4)
  await expect(markers.filter({ hasText: 'T1' })).toHaveCount(1)
  await expect(markers.filter({ hasText: 'T2' })).toHaveCount(1)
  await expect(markers.filter({ hasText: 'R1' })).toHaveCount(1)
  await expect(markers.filter({ hasText: 'R2' })).toHaveCount(1)
  await expect(page.locator('.connection-line.provenance')).toHaveCount(10)
  await expect(page.locator('.connection-line.provenance-excluded')).toHaveCount(0)
  await expect(page.locator('.connection-line.provenance-result')).toHaveCount(6)
  await expect(page.locator('.connection-line.provenance-selected-result')).toHaveCount(0)
  await expect(page.locator('.result-lineage-node')).toHaveCount(6)
  await expect(page.getByRole('button', {
    name: '选择连线：合并四路上下文生成 到 宽银幕主镜头，结果变体 1，生成结果',
  })).toHaveCount(1)

  const context = page.getByRole('region', { name: '已连接生成上下文' })
  await expect(context).toContainText('提示词 1 · 中文剧情约束')
  await expect(context).toContainText('提示词 2 · Cinematic direction with deliberately long English content')
  await expect(context).toContainText('参考图 1 · 海岸环境参考')
  await expect(context).toContainText('参考图 2 · 人物造型参考')

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'full-input-output-trace-1440x900.png'), fullPage: true })

  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  const request = state.requests.find((candidate) => candidate.path === '/api/image-generate')
  expect(request?.body?.image_ids).toEqual(['asset-reference', 'asset-character'])

  await page.screenshot({ path: resolve(evidenceDirectory, 'ordered-four-inputs-1440x900.png'), fullPage: true })

  await selectNode(page, '宽银幕主镜头')
  await expect(markers).toHaveCount(4)
  await expect(page.locator('.result-lineage-node')).toHaveCount(8)
  await selectNode(page, '中文剧情约束')
  await expect(markers).toHaveCount(0)
  await expect(page.locator('.result-lineage-node')).toHaveCount(0)
  await expect(page.locator('.connection-line.provenance')).toHaveCount(0)
})

test('explicit trace fit keeps the selected generation and mutates only one desktop viewport', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '合并四路上下文生成')
  const viewportCount = viewportPatches(state).length

  await page.getByRole('button', { name: '适配完整生成链路' }).click()
  await expect.poll(() => viewportPatches(state).length).toBe(viewportCount + 1)
  expect(documentPatches(state)).toHaveLength(0)
  await expect(page.getByRole('complementary', { name: /节点详情 合并四路上下文生成/ })).toBeVisible()
  await expectTraceInsideSurface(page)

  await mkdir(traceFitEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(traceFitEvidenceDirectory, 'desktop-full-trace-1440x900.png'), fullPage: true })
})

for (const viewport of [{ width: 920, height: 760 }, { width: 375, height: 812 }]) {
  test(`compact ${viewport.width}px closes the drawer before fitting the full trace`, async ({ page }) => {
    const state = createMultiScenarioState()
    await openResourceWorkspace(page, state, viewport)
    await selectNode(page, '合并四路上下文生成')
    const viewportCount = viewportPatches(state).length

    await page.getByRole('button', { name: '适配完整生成链路' }).click()
    await expect(page.locator('.n-drawer')).toHaveCount(0)
    await expect.poll(() => viewportPatches(state).length).toBe(viewportCount + 1)
    expect(documentPatches(state)).toHaveLength(0)
    await expectTraceInsideSurface(page)

    await mkdir(traceFitEvidenceDirectory, { recursive: true })
    await page.screenshot({
      path: resolve(traceFitEvidenceDirectory, `${viewport.width === 375 ? 'readonly' : 'compact'}-full-trace-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    })
  })
}

for (const scenario of [
  { name: 'desktop-broken', title: '损坏媒体结果', viewport: { width: 1440, height: 900 } },
  { name: 'compact-video', title: '动态镜头结果', viewport: { width: 920, height: 760 } },
  { name: 'readonly-image', title: '宽银幕主镜头', viewport: { width: 375, height: 812 } },
]) {
  test(`${scenario.name} result fits its complete lineage without losing V selection`, async ({ page }) => {
    const state = createMultiScenarioState()
    await openResourceWorkspace(page, state, scenario.viewport)
    await selectNode(page, scenario.title)
    const viewportCount = viewportPatches(state).length

    await expect(page.locator('.connection-line.provenance-selected-result')).toHaveCount(1)
    await page.getByRole('button', { name: '适配完整生成链路' }).click()
    if (scenario.viewport.width < 1024) await expect(page.locator('.n-drawer')).toHaveCount(0)
    await expect.poll(() => viewportPatches(state).length).toBe(viewportCount + 1)
    expect(documentPatches(state)).toHaveLength(0)
    await expect(page.locator('.connection-line.provenance-selected-result')).toHaveCount(1)
    await expect(page.locator('.result-lineage-node.is-selected-variant')).toHaveCount(1)
    await expectTraceInsideSurface(page, true)
    if (scenario.viewport.width > 767) await expectToolbarClearOfTrace(page)

    await mkdir(resultTraceFitEvidenceDirectory, { recursive: true })
    await page.screenshot({ path: resolve(resultTraceFitEvidenceDirectory, `result-origin-${scenario.name}-${scenario.viewport.width}x${scenario.viewport.height}.png`), fullPage: true })
  })
}

test('lineage-free result does not expose a misleading full-trace fit action', async ({ page }) => {
  const state = createMultiScenarioState()
  const resultEdge = state.documents[FIRST_CANVAS_ID].connections.find((connection) => connection.target_node_id === 'result-landscape')!
  resultEdge.status = 'inactive'
  await openResourceWorkspace(page, state)
  await selectNode(page, '宽银幕主镜头')

  await expect(page.getByRole('button', { name: '适配完整生成链路' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
})

test('excluded duplicate and missing media stay visible without entering request order', async ({ page }) => {
  const state = createMultiScenarioState()
  const document = state.documents[FIRST_CANVAS_ID]
  const source = document.nodes.find((node) => node.id === 'asset-landscape')!
  document.nodes.push(
    {
      ...source,
      id: 'asset-duplicate',
      content: { ...source.content, title: '重复海岸参考' },
      position_x: 420,
      position_y: 520,
    },
    {
      ...source,
      id: 'asset-missing',
      content: { subtype: 'image', serialization_version: 1, title: '缺失资源参考' },
      position_x: 420,
      position_y: 760,
    },
  )
  const edge = document.connections[0]
  document.connections.push(
    { ...edge, id: 'edge-duplicate-media', source_node_id: 'asset-duplicate', target_node_id: 'generation-compose', target_port: 'media' },
    { ...edge, id: 'edge-missing-media', source_node_id: 'asset-missing', target_node_id: 'generation-compose', target_port: 'media' },
  )

  await openResourceWorkspace(page, state)
  await selectNode(page, '合并四路上下文生成')

  await expect(page.locator('.generation-source-provenance.is-included')).toHaveCount(4)
  await expect(page.locator('.generation-source-provenance.is-excluded')).toHaveCount(2)
  await expect(page.locator('.generation-source-provenance.is-excluded').filter({ hasText: 'R×' })).toHaveCount(2)
  await expect(page.locator('.connection-line.provenance-excluded')).toHaveCount(2)
  await expect(page.locator('.connection-line.provenance-result')).toHaveCount(6)
  const context = page.getByRole('region', { name: '已连接生成上下文' })
  await expect(context).toContainText('参考图 3 · 重复海岸参考')
  await expect(context).toContainText('重复资源，已合并')
  await expect(context).toContainText('参考图 4 · 缺失资源参考')
  await expect(context).toContainText('缺少资源，未使用')

  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((request) => request.path === '/api/image-generate')?.body?.image_ids)
    .toEqual(['asset-reference', 'asset-character'])
})

test('readonly compact review exposes provenance without mutation controls', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  await selectNode(page, '合并四路上下文生成')

  await expect(page.locator('.generation-source-provenance')).toHaveCount(4)
  await expect(page.locator('.connection-line.provenance')).toHaveCount(10)
  await expect(page.locator('.connection-line.provenance-result')).toHaveCount(6)
  await expect(page.getByRole('region', { name: '已连接生成上下文' })).toContainText('4 项已使用')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toHaveCount(0)
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-provenance-375x812.png'), fullPage: true })
})
