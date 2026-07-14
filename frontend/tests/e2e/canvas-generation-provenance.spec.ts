import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-022-generation-provenance')

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
  await expect(page.locator('.connection-line.provenance')).toHaveCount(4)
  await expect(page.locator('.connection-line.provenance-excluded')).toHaveCount(0)

  const context = page.getByRole('region', { name: '已连接生成上下文' })
  await expect(context).toContainText('提示词 1 · 中文剧情约束')
  await expect(context).toContainText('提示词 2 · Cinematic direction with deliberately long English content')
  await expect(context).toContainText('参考图 1 · 海岸环境参考')
  await expect(context).toContainText('参考图 2 · 人物造型参考')

  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  const request = state.requests.find((candidate) => candidate.path === '/api/image-generate')
  expect(request?.body?.image_ids).toEqual(['asset-reference', 'asset-character'])

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'ordered-four-inputs-1440x900.png'), fullPage: true })

  await selectNode(page, '宽银幕主镜头')
  await expect(markers).toHaveCount(4)
  await expect(page.locator('.result-lineage-node')).toHaveCount(8)
  await selectNode(page, '中文剧情约束')
  await expect(markers).toHaveCount(0)
  await expect(page.locator('.result-lineage-node')).toHaveCount(0)
  await expect(page.locator('.connection-line.provenance')).toHaveCount(0)
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
  await expect(page.locator('.connection-line.provenance')).toHaveCount(4)
  await expect(page.getByRole('region', { name: '已连接生成上下文' })).toContainText('4 项已使用')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toHaveCount(0)
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-provenance-375x812.png'), fullPage: true })
})
