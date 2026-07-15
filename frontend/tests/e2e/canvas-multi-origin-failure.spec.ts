import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  addTwoOriginMerge,
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-060-multi-origin-video-recovery')

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

function addTwoOriginVideo(state: ReturnType<typeof createResourceMockState>) {
  addTwoOriginMerge(state)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-two-origin-merge')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    subtype: 'video', title: '双源恢复视频', text: '从远景推进到人物海岸镜头。',
  }
}

test('failed two-origin video preserves inputs and recovers through one explicit retry', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginVideo(state)
  state.generationOutcome = 'failure'
  const document = state.documents[FIRST_CANVAS_ID]
  const initialQuota = state.quotas.video
  const initialNodeCount = document.nodes.length
  const initialConnectionCount = document.connections.length
  const initialAssetCount = state.assets.length
  const prompt = '从远景海岸推进到人物近景，失败后保持同一关键帧顺序。'

  await openResourceWorkspace(page, state)
  await selectNode(page, '双源恢复视频')
  const editor = page.locator('.generation-editor')
  const context = editor.getByRole('region', { name: '已连接生成上下文' })
  await context.getByRole('button', { name: '下移参考图 历史图片生成结果' }).click()
  await editor.getByRole('textbox').fill(prompt)
  await editor.getByRole('button', { name: '开始视频生成' }).click()

  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  const failedRequest = state.requests.find((item) => item.path === '/api/video-generate')!.body
  expect(failedRequest).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: 'generation-two-origin-merge',
    prompt,
    image_ids: ['asset-second-origin', 'asset-generated'],
  })
  await expect(editor.getByRole('alert')).toContainText('mock provider unavailable')
  await expect(editor.getByRole('alert')).toContainText('结果未扣费')
  await expect(editor.locator('.run-history')).toContainText('失败')
  expect(state.tasks[0]).toEqual(expect.objectContaining({
    id: 'task-failure', status: 'failed', canvas_node_id: 'generation-two-origin-merge', result_asset_id: null,
  }))
  expect(state.quotas.video).toBe(initialQuota)
  expect(document.nodes).toHaveLength(initialNodeCount)
  expect(document.connections).toHaveLength(initialConnectionCount)
  expect(state.assets).toHaveLength(initialAssetCount)
  expect(document.nodes.some((item) => (item.content as Record<string, unknown>).source_task_id === 'task-failure')).toBe(false)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V1' })).toHaveCount(1)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V2' })).toHaveCount(1)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'failed-no-charge-1440x900.png'), fullPage: true })

  const patchesBeforeReadonly = documentPatches(state).length
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '双源恢复视频')
  const readonlyDrawer = page.locator('.n-drawer:visible')
  await expect(readonlyDrawer.getByRole('alert')).toContainText('mock provider unavailable')
  await expect(readonlyDrawer).toContainText('来自 第二镜头生成 · V1')
  await expect(readonlyDrawer).toContainText('来自 封面生成 · V2')
  await expect(readonlyDrawer.getByRole('button', { name: '开始视频生成' })).toHaveCount(0)
  await expect.poll(async () => {
    const box = await readonlyDrawer.boundingBox()
    return box ? Math.round(box.x + box.width) : Number.POSITIVE_INFINITY
  }).toBeLessThanOrEqual(375)
  expect(documentPatches(state)).toHaveLength(patchesBeforeReadonly)
  await page.screenshot({ path: resolve(evidenceDirectory, 'failed-readonly-375x812.png'), fullPage: true })

  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '双源恢复视频')
  const retryDrawer = page.locator('.n-drawer:visible')
  await expect(retryDrawer.getByRole('textbox')).toHaveValue(prompt)
  await expect(retryDrawer.getByRole('alert')).toContainText('mock provider unavailable')
  state.generationOutcome = 'success'
  await retryDrawer.getByRole('button', { name: '开始视频生成' }).click()

  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(2)
  const retriedRequest = state.requests.filter((item) => item.path === '/api/video-generate')[1].body
  expect(retriedRequest).toEqual(failedRequest)
  await expect.poll(() => document.nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  expect(state.quotas.video).toBe(initialQuota - 1)
  expect(state.assets).toHaveLength(initialAssetCount + 1)
  const result = document.nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))!
  expect(result.content).toEqual(expect.objectContaining({ subtype: 'video', url: 'https://media.revid.test/success.mp4' }))
  expect(document.connections.filter((item) => item.source_node_id === 'generation-two-origin-merge' && item.target_node_id === result.id)).toHaveLength(1)
  await expect(retryDrawer.getByText('视频生成已完成，结果已写入项目资源。')).toBeVisible()
  await page.screenshot({ path: resolve(evidenceDirectory, 'retry-success-compact-920x900.png'), fullPage: true })
})
