import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-032-result-branch')

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

test('image result branches into a request-ready video workflow and playable result', async ({ page }) => {
  const state = createResourceMockState()
  const initialVideoQuota = state.quotas.video
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  const review = page.locator('.node-review')
  const branch = review.locator('.result-branch')
  await expect(branch).toBeVisible()
  await branch.locator('summary').click()
  await expect(branch).toContainText('作为参考图')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-branch-menu-1440x900.png'), fullPage: true })
  await branch.getByRole('button', { name: /视频生成/ }).click()

  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generationNode = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    item.node_type === 'generation' && item.id !== 'generation-cover'
  ))!
  expect(generationNode).toBeTruthy()
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({
    source_node_id: 'result-existing', target_node_id: generationNode.id,
    source_port: 'out', target_port: 'media', metadata: { input_order: 1 },
  }))
  const editor = page.locator('.generation-editor')
  await expect(editor).toBeVisible()
  await expect(editor.locator('.connected-context')).toContainText('历史图片生成结果')

  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generationNode.id)).toBe(false)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generationNode.id)).toBe(true)
  await selectNode(page, '视频生成')

  const restoredEditor = page.locator('.generation-editor')
  await restoredEditor.getByRole('textbox').fill('Animate the coastal still with a slow push-in')
  await restoredEditor.locator('.generate-button').click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  const request = state.requests.find((item) => item.path === '/api/video-generate')!.body
  expect(request).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: generationNode.id,
    prompt: 'Animate the coastal still with a slow push-in',
    image_ids: ['asset-generated'],
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  expect(state.quotas.video).toBe(initialVideoQuota - 1)
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))!
  expect(result.content).toEqual(expect.objectContaining({ subtype: 'video', url: 'https://media.revid.test/success.mp4' }))
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({
    source_node_id: generationNode.id, target_node_id: result.id,
  }))

  await page.locator('.view-controls > button').first().click()
  const video = page.locator('.asset-card video[src$="success.mp4"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-video-result-1440x900.png'), fullPage: true })

  await page.reload()
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generationNode.id)).toBe(true)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === result.id)).toBe(true)
  await selectNode(page, String((result.content as Record<string, unknown>).title))
  await expect(page.locator('.result-lineage-detail')).toContainText('task-success')
})

test('video, missing-asset, and readonly image results expose no branch mutation', async ({ page }) => {
  const state = createResourceMockState()
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-existing')!
  ;(result.content as Record<string, unknown>).subtype = 'video'
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  await expect(page.locator('.result-branch')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  ;(result.content as Record<string, unknown>).subtype = 'image'
  delete (result.content as Record<string, unknown>).asset_id
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  await expect(page.locator('.result-branch')).toHaveCount(0)

  ;(result.content as Record<string, unknown>).asset_id = 'asset-generated'
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '历史图片生成结果')
  await expect(page.locator('.result-branch')).toHaveCount(0)
})

test('920px result branch disclosure and generation drawer stay in bounds', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '历史图片生成结果')
  const branch = page.locator('.result-branch')
  await branch.locator('summary').click()
  const box = await branch.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(920)
  await branch.getByRole('button', { name: /图片生成/ }).click()
  await expect(page.locator('.generation-editor')).toBeVisible()
  const drawerBox = await page.locator('.n-drawer:visible').boundingBox()
  expect(drawerBox?.width).toBeLessThanOrEqual(360)
})
