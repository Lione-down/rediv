import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-025-generation-preflight')

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
}

test('image request preflight exactly matches the generated prompt and ordered references', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectGeneration(page)

  await page.getByText('检查最终生成请求').click()
  const promptRegion = page.getByRole('region', { name: '最终合并提示词' })
  const mediaRegion = page.getByRole('region', { name: '有序媒体请求' })
  await expect(promptRegion).toBeVisible()
  await expect(promptRegion).toContainText('中文剧情约束')
  await expect(promptRegion).toContainText('Cinematic direction with deliberately long English content')
  await expect(mediaRegion).toContainText('参考图 R1')
  await expect(mediaRegion).toContainText('海岸环境参考')
  await expect(mediaRegion).toContainText('参考图 R2')
  await expect(mediaRegion).toContainText('人物造型参考')
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.requests.filter((request) => request.path.includes('generate'))).toHaveLength(0)

  const previewPrompt = await promptRegion.locator('pre').innerText()
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((request) => request.path === '/api/image-generate')?.body?.prompt).toBe(previewPrompt)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-four-input-preflight-1440x900.png'), fullPage: true })
})

test('video request preflight distinguishes multiple keyframes from one image reference', async ({ page }) => {
  const state = createMultiScenarioState()
  const document = state.documents[FIRST_CANVAS_ID]
  const generation = document.nodes.find((node) => node.id === 'generation-compose')!
  generation.content.subtype = 'video'

  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  await page.getByText('检查最终生成请求').click()
  let mediaRegion = page.getByRole('region', { name: '有序媒体请求' })
  await expect(mediaRegion).toContainText('视频关键帧 R1')
  await expect(mediaRegion).toContainText('视频关键帧 R2')

  document.connections = document.connections.filter((connection) => connection.id !== 'edge-portrait-media')
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  await page.getByText('检查最终生成请求').click()
  mediaRegion = page.getByRole('region', { name: '有序媒体请求' })
  await expect(mediaRegion).toContainText('图生视频参考 R1')
  await expect(mediaRegion).not.toContainText('视频关键帧')
})

test('readonly mobile preflight remains bounded and opening it never mutates', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectGeneration(page)
  await page.getByText('检查最终生成请求').click()

  const promptRegion = page.getByRole('region', { name: '最终合并提示词' })
  await expect(promptRegion).toBeVisible()
  await expect(page.getByRole('button', { name: /开始.*生成/ })).toHaveCount(0)
  const box = await promptRegion.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.requests.filter((request) => request.path.includes('generate'))).toHaveLength(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-preflight-375x812.png'), fullPage: true })
})
