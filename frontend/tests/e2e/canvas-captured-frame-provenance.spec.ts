import { expect, test } from '@playwright/test'
import { formatCapturedFrameTime, resolveCapturedFrameProvenance } from '../../src/modules/canvas/captured-frame-provenance'
import { resolveGenerationContext } from '../../src/modules/canvas/generation-context'
import { createSelectionGenerationCommand } from '../../src/modules/canvas/selection-generation'
import type { CanvasNode } from '../../src/types/canvas'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, FIRST_CANVAS_ID, openResourceWorkspace, PROJECT_ID } from './canvas-resource-generation-fixture'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-049-captured-frame-provenance')

function node(id: string, type: string, subtype: string, contentData: Record<string, unknown> = {}): CanvasNode {
  return {
    id, type, title: id, x: 0, y: 0, width: 320, height: 180,
    contentData: { subtype, serialization_version: 1, ...contentData },
  }
}

test('captured frame provenance resolves one exact existing video source and stable time', () => {
  const source = node('video-source', 'result', 'video', { asset_id: 'video-asset', url: 'https://media.test/video.mp4' })
  const frame = node('frame', 'asset', 'image', {
    asset_id: 'frame-asset', source_video_node_id: source.id, source_video_time_seconds: 65.2,
  })
  expect(resolveCapturedFrameProvenance(frame, [frame, source])).toEqual({
    captureTimeSeconds: 65.2,
    frameNodeId: 'frame',
    sourceNodeId: 'video-source',
    sourceTitle: 'video-source',
  })
  expect(formatCapturedFrameTime(65.2)).toBe('1:05.200')
  expect(formatCapturedFrameTime(0.375)).toBe('0:00.375')
})

test('captured frame provenance rejects malformed, deleted, self, and non-video sources', () => {
  const video = node('video', 'asset', 'video')
  const base = node('frame', 'asset', 'image', {
    asset_id: 'frame-asset', source_video_node_id: video.id, source_video_time_seconds: 0.5,
  })
  const invalidFrames = [
    node('ordinary', 'asset', 'image', { asset_id: 'ordinary' }),
    { ...base, type: 'result' },
    { ...base, contentData: { ...base.contentData, subtype: 'video' } },
    { ...base, contentData: { ...base.contentData, asset_id: '' } },
    { ...base, contentData: { ...base.contentData, source_video_node_id: '' } },
    { ...base, contentData: { ...base.contentData, source_video_node_id: base.id } },
    { ...base, contentData: { ...base.contentData, source_video_time_seconds: -1 } },
    { ...base, contentData: { ...base.contentData, source_video_time_seconds: Number.NaN } },
  ]
  for (const frame of invalidFrames) expect(resolveCapturedFrameProvenance(frame, [frame, video])).toBeNull()
  expect(resolveCapturedFrameProvenance(base, [base])).toBeNull()
  expect(resolveCapturedFrameProvenance(base, [base, node('video', 'asset', 'image')])).toBeNull()
})

function addCapturedFrame(state: ReturnType<typeof createMultiScenarioState>) {
  state.assets.unshift({
    id: 'asset-captured-existing', user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: null, type: 'image', url: 'https://media.revid.test/existing-frame.png', content_text: '已截取帧',
    source: 'upload', source_model: null, source_task_id: null, status: 'active', created_at: '', updated_at: '',
  })
  state.documents[FIRST_CANVAS_ID].nodes.push({
    id: 'frame-existing', project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID, node_type: 'asset',
    content: {
      title: '视频帧 0.20s', subtype: 'image', serialization_version: 1, asset_id: 'asset-captured-existing',
      source_video_node_id: 'result-video', source_video_time_seconds: 0.2, url: 'https://media.revid.test/existing-frame.png',
      aspect_ratio: 16 / 9,
    },
    position_x: 1900, position_y: 390, width: 320, height: 240, z_index: 0, parent_node_id: null,
    is_locked: false, is_collapsed: false, status: 'idle', created_at: '', updated_at: '',
  })
}

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

test('frame inspector exposes exact source and desktop locate loop without graph mutation', async ({ page }) => {
  const state = createMultiScenarioState()
  addCapturedFrame(state)
  await openResourceWorkspace(page, state)
  await selectNode(page, '视频帧 0.20s')
  const detail = page.getByRole('region', { name: '视频帧来源' })
  await expect(detail).toContainText('动态镜头结果')
  await expect(detail).toContainText('0:00.200')
  await expect(page.locator('.captured-frame-source-provenance')).toHaveCount(1)
  const patchCount = documentPatches(state).length
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'desktop-frame-source-1440x900.png'), fullPage: true })
  await detail.getByRole('button', { name: '定位到源视频：动态镜头结果' }).click()
  await expect(page.getByRole('complementary', { name: /节点详情 动态镜头结果/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '截取当前帧' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(patchCount)
})

for (const viewport of [{ width: 920, height: 760 }, { width: 375, height: 812 }]) {
  test(`${viewport.width}px frame source locate closes compact context and preserves review boundary`, async ({ page }) => {
    const state = createMultiScenarioState()
    addCapturedFrame(state)
    await openResourceWorkspace(page, state, viewport)
    await selectNode(page, '视频帧 0.20s')
    const detail = page.getByRole('region', { name: '视频帧来源' })
    await expect(detail).toContainText('0:00.200')
    await detail.getByRole('button', { name: '定位到源视频：动态镜头结果' }).click()
    await expect(page.locator('.n-drawer')).toHaveCount(0)
    await expect(page.locator('.captured-frame-source-provenance')).toHaveCount(0)
    if (viewport.width === 920) await expect(page.getByRole('button', { name: '截取当前帧' })).toBeVisible()
    else await expect(page.getByRole('button', { name: '截取当前帧' })).toHaveCount(0)
    expect(documentPatches(state)).toHaveLength(0)
    await mkdir(evidenceDirectory, { recursive: true })
    await page.screenshot({ path: resolve(evidenceDirectory, `${viewport.width === 920 ? 'compact' : 'readonly'}-source-located-${viewport.width}x${viewport.height}.png`), fullPage: true })
  })
}

test('returning to source captures two independent frames that compose in order', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '动态镜头结果')
  const video = page.locator('video[aria-label="视频结果"]')
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeGreaterThan(1)
  const seek = async (ratio: number) => video.evaluate(async (element: HTMLVideoElement, seekRatio) => {
    const target = Math.max(0, Math.min(element.duration * seekRatio, Math.max(0, element.duration - 0.001)))
    await new Promise<void>((resolveSeek) => {
      element.addEventListener('seeked', () => resolveSeek(), { once: true })
      element.currentTime = target
    })
    return element.currentTime
  }, ratio)
  const firstTime = await seek(0.1)
  await page.getByRole('button', { name: '截取当前帧' }).click()
  await expect.poll(() => state.uploads.length).toBe(1)
  await page.getByRole('region', { name: '视频帧来源' }).getByRole('button', { name: '定位到源视频：动态镜头结果' }).click()
  const secondTime = await seek(0.75)
  await page.getByRole('button', { name: '截取当前帧' }).click()
  await expect.poll(() => state.uploads.length).toBe(2)
  expect(secondTime).toBeGreaterThan(firstTime)
  expect(Object.keys(state.capturedFrames)).toEqual(['/captured-frame-1.png', '/captured-frame-2.png'])
  expect(state.capturedFrames['/captured-frame-1.png'].equals(state.capturedFrames['/captured-frame-2.png'])).toBe(false)
  const capturedFrameRecords = () => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => String((item.content as Record<string, unknown>)?.source_video_node_id) === 'result-video')
  await expect.poll(() => capturedFrameRecords().length).toBe(2)
  const frameRecords = capturedFrameRecords()
  expect(frameRecords).toHaveLength(2)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'repeat-capture-two-frames-1440x900.png'), fullPage: true })
  const frames = frameRecords.toSorted((left, right) => (
    Number((left.content as Record<string, unknown>).source_video_time_seconds) -
    Number((right.content as Record<string, unknown>).source_video_time_seconds)
  )).map((record): CanvasNode => ({
    id: String(record.id), type: 'asset', title: String((record.content as Record<string, unknown>).title),
    x: Number(record.position_x), y: Number(record.position_y), width: Number(record.width), height: Number(record.height),
    contentData: record.content as Record<string, unknown>,
  }))
  const prompt = node('prompt', 'script', 'script')
  prompt.content = '保持前后镜头动作连续'
  for (const mediaType of ['image', 'video'] as const) {
    const command = createSelectionGenerationCommand([prompt, ...frames], mediaType, () => `two-frame-${mediaType}`)!
    const context = resolveGenerationContext(command.nodes[0], [prompt, ...frames, ...command.nodes], command.connections)
    expect(context.imageIds).toEqual(['asset-captured-frame-1', 'asset-captured-frame-2'])
  }
})
