import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveGenerationContext } from '../../src/modules/canvas/generation-context'
import { createSelectionGenerationCommand } from '../../src/modules/canvas/selection-generation'
import { createVideoFrameAssetInsertCommand } from '../../src/modules/canvas/resource-commands'
import { resolveKeyframeRailPlacement } from '../../src/components/canvas/canvas-keyframe-placement'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, openResourceWorkspace, PROJECT_ID, SECOND_CANVAS_ID } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-062-video-keyframes')

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

function boxesOverlap(left: { x: number; y: number; width: number; height: number }, right: { x: number; y: number; width: number; height: number }) {
  return left.x < right.x + right.width && left.x + left.width > right.x &&
    left.y < right.y + right.height && left.y + left.height > right.y
}

function boxDistance(left: { x: number; y: number; width: number; height: number }, right: { x: number; y: number; width: number; height: number }) {
  const horizontal = Math.max(0, left.x - (right.x + right.width), right.x - (left.x + left.width))
  const vertical = Math.max(0, left.y - (right.y + right.height), right.y - (left.y + left.height))
  return Math.hypot(horizontal, vertical)
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

test('keyframe rail and toolbar share one deterministic open-side decision', () => {
  const video = sourceVideo()
  const above: CanvasNode = { ...video, id: 'above', type: 'note', y: -100, height: 180 }
  const below: CanvasNode = { ...video, id: 'below', type: 'note', y: 270, height: 180 }
  expect(resolveKeyframeRailPlacement(video, [video, below])).toBe('above')
  expect(resolveKeyframeRailPlacement(video, [video, above])).toBe('below')
})

test('selected playable video captures one PNG and inserts one durable image node', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  const video = page.locator('video[aria-label="视频结果"]')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2)
  const rail = page.getByRole('region', { name: '视频关键帧' })
  const frames = rail.getByRole('button', { name: /定位到视频/ })
  await expect(frames).toHaveCount(5)
  for (const thumbnail of await frames.locator('img').all()) {
    await expect.poll(() => thumbnail.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([160, 90])
  }
  const toolbarRect = await page.locator('.selection-toolbar').boundingBox()
  const videoRect = await video.boundingBox()
  const railRect = await rail.boundingBox()
  const resolutionRect = await video.locator('xpath=ancestor::div[contains(@class,"canvas-node-media")]').getByLabel('媒体分辨率').boundingBox()
  const inspectorRect = await page.locator('.context-panel-shell').boundingBox()
  expect(toolbarRect).not.toBeNull()
  expect(videoRect).not.toBeNull()
  expect(railRect).not.toBeNull()
  expect(resolutionRect).not.toBeNull()
  expect(inspectorRect).not.toBeNull()
  expect(boxesOverlap(toolbarRect!, videoRect!), JSON.stringify({
    toolbarRect, toolbarStyle: await page.locator('.selection-toolbar').getAttribute('style'), videoRect,
  })).toBe(false)
  expect(boxesOverlap(toolbarRect!, railRect!)).toBe(false)
  expect(boxesOverlap(resolutionRect!, railRect!)).toBe(false)
  expect(boxesOverlap(resolutionRect!, videoRect!)).toBe(false)
  expect(boxDistance(toolbarRect!, videoRect!), JSON.stringify({
    inspectorRect, railRect, toolbarRect, toolbarStyle: await page.locator('.selection-toolbar').getAttribute('style'), videoRect,
  })).toBeLessThanOrEqual(72)
  expect(toolbarRect!.x + toolbarRect!.width).toBeLessThanOrEqual(inspectorRect!.x - 12)
  const targetFrame = frames.nth(3)
  const targetTime = Number(await targetFrame.getAttribute('data-time'))
  const patchCountBeforeSeek = documentPatches(state).length
  await targetFrame.click()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(targetTime, 2)
  await expect(targetFrame).toHaveAttribute('aria-current', 'true')
  expect(documentPatches(state)).toHaveLength(patchCountBeforeSeek)
  await expect(page.getByRole('button', { name: '截取当前帧' })).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-keyframe-rail-1440x900.png'), fullPage: true })
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
  expect(inserted?.content).toMatchObject({ subtype: 'image', asset_id: 'asset-captured-frame-1', source_video_node_id: 'result-video', source_video_time_seconds: targetTime })

  await page.screenshot({ path: resolve(evidenceDirectory, 'captured-from-keyframe-1440x900.png'), fullPage: true })
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
  await expect(page.getByRole('region', { name: '视频关键帧' })).toHaveCount(0)
})

test('locked desktop video exposes no frame mutation action', async ({ page }) => {
  const state = createMultiScenarioState()
  const videoNode = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-video')
  if (videoNode) videoNode.is_locked = true
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  await expect(page.getByRole('button', { name: '截取当前帧' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '视频关键帧' })).toHaveCount(0)
})

test('leaving a playable video removes its keyframe sampler without graph mutation', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  await expect(page.getByRole('region', { name: '视频关键帧' }).getByRole('button', { name: /定位到视频/ })).toHaveCount(5)
  const patchCount = documentPatches(state).length
  await selectNode(page, '损坏媒体结果')
  await expect(page.getByRole('region', { name: '视频关键帧' })).toHaveCount(0)
  await expect(page.getByRole('alert').filter({ hasText: '媒体不可用' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(patchCount)
})

test('keyframe extraction failure stays local while native video remains playable', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeToDataUrl = HTMLCanvasElement.prototype.toDataURL
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      if (this.width === 160 && this.height === 90) throw new DOMException('mock keyframe export rejected', 'SecurityError')
      return nativeToDataUrl.apply(this, args as Parameters<typeof nativeToDataUrl>)
    }
  })
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  const video = page.locator('video[aria-label="视频结果"]')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2)
  const rail = page.getByRole('region', { name: '视频关键帧' })
  await expect(rail.getByRole('alert')).toHaveText('无法预览')
  await expect(rail.getByRole('button', { name: /定位到视频/ })).toHaveCount(0)
  await expect(video).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
})

test('compact selected video keeps capture action clear of playback controls', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 920, height: 760 })
  await selectNode(page, '动态镜头结果')
  const action = page.getByRole('button', { name: '截取当前帧' })
  const video = page.locator('video[aria-label="视频结果"]')
  const rail = page.getByRole('region', { name: '视频关键帧' })
  await expect(action).toBeVisible()
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  await expect(rail.getByRole('button', { name: /定位到视频/ })).toHaveCount(5)
  const actionRect = await action.boundingBox()
  const videoRect = await video.boundingBox()
  const railRect = await rail.boundingBox()
  const mediaLayout = await video.evaluate((element) => {
    const viewport = element.closest<HTMLElement>('.canvas-node-media__viewport')
    const media = element.closest<HTMLElement>('.canvas-node-media')
    const body = element.closest<HTMLElement>('.canvas-runtime-card__body')
    const describe = (target: HTMLElement | null) => target
      ? {
          rect: target.getBoundingClientRect().toJSON(),
          display: getComputedStyle(target).display,
          width: getComputedStyle(target).width,
          height: getComputedStyle(target).height,
          minHeight: getComputedStyle(target).minHeight,
          overflow: getComputedStyle(target).overflow,
        }
      : null
    return {
      video: describe(element),
      viewport: describe(viewport),
      media: describe(media),
      body: describe(body),
    }
  })
  expect(actionRect).not.toBeNull()
  expect(videoRect).not.toBeNull()
  expect(railRect).not.toBeNull()
  expect(actionRect!.y + actionRect!.height).toBeLessThan(videoRect!.y + videoRect!.height - 24)
  expect(railRect!.width).toBeLessThanOrEqual(videoRect!.width)
  expect(
    railRect!.y >= videoRect!.y + videoRect!.height ||
      railRect!.y + railRect!.height <= videoRect!.y,
    JSON.stringify({ railRect, videoRect, mediaLayout }),
  ).toBe(true)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-drawer-owns-toolbar-920x760.png'), fullPage: true })
  const patchCount = documentPatches(state).length
  await page.keyboard.press('Escape')
  await expect(page.locator('.n-drawer:visible')).toHaveCount(0)
  await expect(page.locator('.selection-toolbar')).toBeVisible()
  await expect(rail).toBeVisible()
  await expect(action).toBeVisible()
  expect(documentPatches(state)).toHaveLength(patchCount)
  await page.screenshot({ path: resolve(evidenceDirectory, 'compact-drawer-dismissed-920x760.png'), fullPage: true })
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
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}\\?canvas_runtime=legacy$`))
  releaseUpload()
  await expect(page.getByRole('alert').filter({ hasText: 'Canvas 操作上下文已变化' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
  expect(documentPatches(state, SECOND_CANVAS_ID)).toHaveLength(0)
  expect(Object.values(state.documents).flatMap((document) => document.nodes).some((node) => String((node.content as Record<string, unknown>)?.title).startsWith('视频帧'))).toBe(false)
})
