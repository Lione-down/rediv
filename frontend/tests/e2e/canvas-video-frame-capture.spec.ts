import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveGenerationContext } from '../../src/modules/canvas/generation-context'
import { createSelectionGenerationCommand } from '../../src/modules/canvas/selection-generation'
import { createVideoFrameAssetInsertCommand } from '../../src/modules/canvas/resource-commands'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, openResourceWorkspace, PROJECT_ID, SECOND_CANVAS_ID } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-048-video-frame-capture')

function frameAsset(): Asset {
  return {
    id: 'asset-frame', user_id: 'user', project_id: PROJECT_ID, origin_canvas_id: 'canvas-first', canvas_node_id: null,
    type: 'image', url: 'https://media.revid.test/frame.png', content_text: 'Captured frame', source: 'upload',
    source_model: null, source_task_id: null, status: 'active', created_at: '', updated_at: '',
  }
}

function sourceVideo(): CanvasNode {
  return {
    id: 'video-source', type: 'result', title: '视频结果', x: 100, y: 80, width: 320, height: 180,
    contentData: { subtype: 'video', serialization_version: 1, asset_id: 'video-asset', url: 'https://media.revid.test/video.mp4' },
  }
}

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

test('frame asset command preserves capture provenance, avoids collisions, and composes as image input', () => {
  const source = sourceVideo()
  const blocker: CanvasNode = { ...source, id: 'blocker', type: 'note', title: 'blocker', x: 516, y: 80, width: 320, height: 200 }
  const command = createVideoFrameAssetInsertCommand(source, frameAsset(), 0.375, 16 / 9, [source, blocker])
  expect(command.connections).toEqual([])
  expect(command.nodes[0]).toMatchObject({
    type: 'asset', title: '视频帧 0.38s', x: 516, y: 344,
    contentData: {
      subtype: 'image', asset_id: 'asset-frame', source_video_node_id: 'video-source',
      source_video_time_seconds: 0.375, aspect_ratio: 16 / 9,
    },
  })
  const prompt: CanvasNode = { id: 'prompt', type: 'script', title: '镜头要求', x: 0, y: 0, width: 320, height: 120, content: '保持人物动作连续', contentData: { subtype: 'script', serialization_version: 1 } }
  for (const mediaType of ['image', 'video'] as const) {
    const generation = createSelectionGenerationCommand([prompt, command.nodes[0]], mediaType, () => `generation-${mediaType}`)!
    const context = resolveGenerationContext(generation.nodes[0], [prompt, command.nodes[0], ...generation.nodes], generation.connections)
    expect(context.mediaSources.map((item) => item.assetId)).toEqual(['asset-frame'])
    expect(context.textSources.map((item) => item.content)).toEqual(['保持人物动作连续'])
  }
})

test('selected playable video captures one PNG and inserts one durable image node', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  const video = page.locator('video[aria-label="视频结果"]')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2)
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.currentTime = Math.min(0.2, element.duration / 2)
    await new Promise<void>((resolveSeek) => element.addEventListener('seeked', () => resolveSeek(), { once: true }))
  })
  await expect(page.getByRole('button', { name: '截取当前帧' })).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-video-capture-action-1440x900.png'), fullPage: true })
  const patchCount = documentPatches(state).length
  await page.getByRole('button', { name: '截取当前帧' }).click()

  await expect.poll(() => state.uploads.length).toBe(1)
  expect(state.uploads[0].contentType).toContain('multipart/form-data')
  expect(state.uploads[0].byteLength).toBeGreaterThan(100)
  expect(state.uploads[0].payload).toContain('video-frame-')
  expect(state.uploads[0].payload).toContain('image/png')
  await expect.poll(() => documentPatches(state).length).toBe(patchCount + 1)
  await expect(page.getByRole('complementary', { name: /节点详情 视频帧/ })).toBeVisible()
  const capturedImage = page.locator('img[src*="captured-frame-1.png"]')
  await expect(capturedImage).toBeVisible()
  await expect.poll(() => capturedImage.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([160, 90])
  expect(state.capturedFrames['/captured-frame-1.png']?.byteLength).toBeGreaterThan(100)
  const inserted = state.documents['canvas-first'].nodes.find((node) => String((node.content as Record<string, unknown>)?.title).startsWith('视频帧'))
  expect(inserted).toMatchObject({ node_type: 'asset' })
  expect(inserted?.content).toMatchObject({ subtype: 'image', asset_id: 'asset-captured-frame-1', source_video_node_id: 'result-video' })

  await page.screenshot({ path: resolve(evidenceDirectory, 'captured-frame-selected-1440x900.png'), fullPage: true })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect(page.getByRole('complementary', { name: /节点详情 视频帧/ })).toHaveCount(0)
  await page.keyboard.press('Control+Shift+z')
  await selectNode(page, String((inserted?.content as Record<string, unknown>).title))
  await expect(page.getByRole('complementary', { name: /节点详情 视频帧/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
  await selectNode(page, String((inserted?.content as Record<string, unknown>).title))
  await expect(page.locator('img[src*="captured-frame-1.png"]')).toBeVisible()
})

test('readonly mobile video review exposes no frame mutation action', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  await selectNode(page, '动态镜头结果')
  await expect(page.getByRole('button', { name: '截取当前帧' })).toHaveCount(0)
})

test('locked desktop video exposes no frame mutation action', async ({ page }) => {
  const state = createMultiScenarioState()
  const videoNode = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-video')
  if (videoNode) videoNode.is_locked = true
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  await expect(page.getByRole('button', { name: '截取当前帧' })).toHaveCount(0)
})

test('compact selected video keeps capture action clear of playback controls', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 920, height: 760 })
  await selectNode(page, '动态镜头结果')
  const action = page.getByRole('button', { name: '截取当前帧' })
  const video = page.locator('video[aria-label="视频结果"]')
  await expect(action).toBeVisible()
  const actionRect = await action.boundingBox()
  const videoRect = await video.boundingBox()
  expect(actionRect).not.toBeNull()
  expect(videoRect).not.toBeNull()
  expect(actionRect!.y + actionRect!.height).toBeLessThan(videoRect!.y + videoRect!.height - 24)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-selected-video-920x760.png'), fullPage: true })
})

test('failed frame upload reports an accessible error and inserts no node', async ({ page }) => {
  const state = createMultiScenarioState()
  state.uploadOutcome = 'failure'
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  await expect(page.getByRole('button', { name: '截取当前帧' })).toBeVisible()
  const patchCount = documentPatches(state).length
  await page.getByRole('button', { name: '截取当前帧' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'mock frame upload rejected' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(patchCount)
  expect(state.documents['canvas-first'].nodes.some((node) => String((node.content as Record<string, unknown>)?.title).startsWith('视频帧'))).toBe(false)
})

test('Canvas switch during frame upload never inserts into either document', async ({ page }) => {
  const state = createMultiScenarioState()
  let releaseUpload = () => undefined
  state.uploadGate = new Promise<void>((resolveUpload) => { releaseUpload = resolveUpload })
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  await page.getByRole('button', { name: '截取当前帧' }).click()
  await expect.poll(() => state.uploads.length).toBe(1)
  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}$`))
  releaseUpload()
  await expect(page.getByRole('alert').filter({ hasText: 'Canvas 操作上下文已变化' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
  expect(documentPatches(state, SECOND_CANVAS_ID)).toHaveLength(0)
  expect(Object.values(state.documents).flatMap((document) => document.nodes).some((node) => String((node.content as Record<string, unknown>)?.title).startsWith('视频帧'))).toBe(false)
})
