import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-033-multi-result-remix')
const now = '2026-07-15T10:00:00Z'

function node(
  id: string,
  type: string,
  title: string,
  x: number,
  y: number,
  content: Record<string, unknown>,
) {
  return {
    id, project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID, node_type: type,
    content: { title, ...content }, position_x: x, position_y: y,
    width: type === 'generation' ? 340 : 320, height: type === 'result' ? 180 : 200,
    z_index: 0, parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
    created_at: now, updated_at: now,
  }
}

function configureRemixState(state: ResourceMockState) {
  const nodes = [
    node('script-remix', 'script', '镜头约束', 80, 160, {
      subtype: 'script', serialization_version: 1, text: '保持人物一致，镜头缓慢推进。',
    }),
    node('result-remix-a', 'result', '海岸结果 A', 460, 160, {
      subtype: 'image', serialization_version: 1, asset_id: 'asset-result-a',
      source_task_id: 'task-result-a', url: 'https://media.revid.test/result-a.png', width: 320, height: 180,
    }),
    node('result-remix-b', 'result', '海岸结果 B', 80, 430, {
      subtype: 'image', serialization_version: 1, asset_id: 'asset-result-b',
      source_task_id: 'task-result-b', url: 'https://media.revid.test/result-b.png', width: 320, height: 180,
    }),
    node('occupied-remix-slot', 'note', '右侧占位', 876, 285, {
      subtype: 'annotation', serialization_version: 1, text: '保留给既有分镜。',
    }),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes, connections: [] }
  const generated = state.assets.find((asset) => asset.id === 'asset-generated')!
  state.assets.push(
    { ...generated, id: 'asset-result-a', canvas_node_id: 'result-remix-a', source_task_id: 'task-result-a', url: 'https://media.revid.test/result-a.png' },
    { ...generated, id: 'asset-result-b', canvas_node_id: 'result-remix-b', source_task_id: 'task-result-b', url: 'https://media.revid.test/result-b.png' },
  )
}

async function selectRemixSources(page: Page) {
  const surface = page.locator('.canvas-surface')
  await surface.click({ position: { x: 180, y: 260 } })
  await surface.click({ position: { x: 560, y: 250 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 180, y: 520 }, modifiers: ['Control'] })
  const toolbar = page.getByRole('toolbar', { name: '3 个已选节点的操作' })
  await expect(toolbar).toBeVisible()
  await toolbar.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  const menu = page.getByRole('menu', { name: '选择生成任务类型' })
  await expect(menu.locator('p')).toHaveText('1 提示词 · 0 素材图 · 2 生成结果')
  await expect(menu.getByRole('menuitem', { name: '图片生成' })).toContainText('历史结果融合')
  await expect(menu.getByRole('menuitem', { name: '视频生成' })).toContainText('有序关键帧')
  return menu
}

async function createRemix(page: Page, state: ResourceMockState, mediaType: 'image' | 'video') {
  configureRemixState(state)
  await openResourceWorkspace(page, state)
  const menu = await selectRemixSources(page)
  if (mediaType === 'video') {
    await mkdir(evidenceDirectory, { recursive: true })
    await page.screenshot({ path: resolve(evidenceDirectory, 'multi-result-remix-menu-1440x900.png'), fullPage: true })
  }
  await menu.getByRole('menuitem', { name: mediaType === 'video' ? '视频生成' : '图片生成' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.node_type === 'generation')!
  expect(generation).toMatchObject({ position_x: 876, position_y: 519 })
  const inputs = state.documents[FIRST_CANVAS_ID].connections.filter((edge) => edge.target_node_id === generation.id)
  expect(inputs.filter((edge) => edge.target_port === 'prompt')
    .map((edge) => [edge.source_node_id, edge.metadata?.input_order])).toEqual([['script-remix', 1]])
  expect(inputs.filter((edge) => edge.target_port === 'media')
    .sort((left, right) => Number(left.metadata?.input_order) - Number(right.metadata?.input_order))
    .map((edge) => [edge.source_node_id, edge.metadata?.input_order])).toEqual([
      ['result-remix-a', 1], ['result-remix-b', 2],
    ])
  return generation
}

test('two generated results remix into ordered playable video keyframes', async ({ page }) => {
  const state = createResourceMockState()
  const generation = await createRemix(page, state, 'video')
  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(false)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(true)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 视频生成' }).click()
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/video-generate').length).toBe(1)
  expect(state.requests.find((request) => request.path === '/api/video-generate')?.body).toEqual({
    project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: generation.id,
    prompt: '【镜头约束】\n保持人物一致，镜头缓慢推进。', image_ids: ['asset-result-a', 'asset-result-b'],
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))!
  expect(result.content).toEqual(expect.objectContaining({ subtype: 'video', url: 'https://media.revid.test/success.mp4' }))
  await page.locator('.view-controls > button').first().click()
  const video = page.locator('.asset-card video[src$="success.mp4"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  await page.screenshot({ path: resolve(evidenceDirectory, 'multi-result-video-1440x900.png'), fullPage: true })
  await page.reload()
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(true)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === result.id)).toBe(true)
})

test('two generated results remix into an image with exact reference identity', async ({ page }) => {
  const state = createResourceMockState()
  const generation = await createRemix(page, state, 'image')
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((request) => request.path === '/api/image-generate')?.body).toEqual({
    project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: generation.id,
    prompt: '【镜头约束】\n保持人物一致，镜头缓慢推进。', image_ids: ['asset-result-a', 'asset-result-b'],
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))).toBe(true)
})

test('compact remix intent stays bounded and readonly review exposes no mutation', async ({ page }) => {
  const state = createResourceMockState()
  configureRemixState(state)
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  const surface = page.locator('.canvas-surface')
  const surfaceBox = await surface.boundingBox()
  expect(surfaceBox).not.toBeNull()
  await page.mouse.move(surfaceBox!.x + 40, surfaceBox!.y + 130)
  await page.mouse.down()
  await page.mouse.move(surfaceBox!.x + 830, surfaceBox!.y + 700, { steps: 4 })
  await page.mouse.up()
  const toolbar = page.getByRole('toolbar', { name: '3 个已选节点的操作' })
  await toolbar.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  const menu = page.getByRole('menu', { name: '选择生成任务类型' })
  await expect(menu.locator('p')).toHaveText('1 提示词 · 0 素材图 · 2 生成结果')
  const menuBox = await menu.boundingBox()
  expect(menuBox).not.toBeNull()
  expect(menuBox!.x).toBeGreaterThanOrEqual(0)
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(920)

  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
})
