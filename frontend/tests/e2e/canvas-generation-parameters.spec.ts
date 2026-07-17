import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  formatGenerationRequestParameters,
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import { createResultGenerationBranchCommand } from '../../src/modules/canvas/resource-commands'
import { createSelectionGenerationCommand } from '../../src/modules/canvas/selection-generation'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import {
  addTwoOriginMerge,
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-075-generation-parameters')
const capabilities = parseGenerationCapabilities(GENERATION_CAPABILITIES)

function generationNode(mediaType: 'image' | 'video', parameters?: unknown): CanvasNode {
  return {
    id: `generation-${mediaType}`, type: 'generation', title: `${mediaType} generation`,
    x: 400, y: 100, width: 340, height: 220, content: 'cinematic prompt',
    contentData: {
      subtype: mediaType, serialization_version: 1,
      ...(parameters === undefined ? {} : { generation_parameters: parameters }),
    },
  }
}

function referenceNode(id: string, assetId = `asset-${id}`): CanvasNode {
  return {
    id, type: 'asset', title: id, x: 0, y: 0, width: 320, height: 200,
    contentData: { subtype: 'image', serialization_version: 1, asset_id: assetId },
  }
}

function mediaConnection(id: string, from: string, to: string, order: number): CanvasConnection {
  return {
    id, from, to, sourcePort: 'out', targetPort: 'media', status: 'active', active: true,
    metadata: { input_order: order },
  }
}

async function selectNode(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

test('capability parsing, legacy defaults, and stale values fail closed', () => {
  expect(capabilities.image.aspect_ratios).toEqual([
    '1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9',
  ])
  expect(capabilities.video.duration_presets.map((item) => [item.duration_seconds, item.num_frames, item.frame_rate]))
    .toEqual([[3, 81, 24], [5, 121, 24], [10, 241, 24], [18, 441, 24]])
  expect(() => parseGenerationCapabilities({ ...GENERATION_CAPABILITIES, contract_version: 3 })).toThrow(
    'capability contract 无效',
  )

  const image = generationNode('image')
  expect(resolveGenerationRequestContext(image, 'image', [image], [], capabilities)).toMatchObject({
    aspectRatio: '4:3', parameterError: '',
    parameters: { schema_version: 1, image: { aspect_ratio: '4:3' } },
  })
  const staleImage = generationNode('image', { schema_version: 1, image: { aspect_ratio: '5:4' } })
  expect(resolveGenerationRequestContext(staleImage, 'image', [staleImage], [], capabilities).parameterError)
    .toContain('不受当前 capability 支持')
  expect(resolveGenerationRequestContext(image, 'image', [image], [], null).parameterError)
    .toContain('尚未加载')

  const recipe = generationNode('image', { schema_version: 1, image: { aspect_ratio: '16:9' } })
  recipe.content = undefined
  recipe.contentData = {
    ...recipe.contentData,
    generation_recipe_id: 'character-sheet', generation_recipe_version: 2,
  }
  expect(resolveGenerationRequestContext(recipe, 'image', [recipe], [], capabilities)).toMatchObject({
    isRecipe: true, aspectRatio: '4:3', parameters: null, parameterSummary: ['配方固定 4:3', '输出 1024×768'],
  })
})

test('video resolver requires explicit multi-reference intent and preserves exact exclusions', () => {
  const video = generationNode('video')
  const first = referenceNode('reference-a')
  const second = referenceNode('reference-b')
  const connections = [
    mediaConnection('edge-a', first.id, video.id, 1),
    mediaConnection('edge-b', second.id, video.id, 2),
  ]
  const unresolved = resolveGenerationRequestContext(video, 'video', [video, first, second], connections, capabilities)
  expect(unresolved.parameterError).toContain('请先明确选择')

  const single = resolveGenerationRequestContext(video, 'video', [video, first], [connections[0]], capabilities)
  expect(single).toMatchObject({
    referenceMode: 'image-to-video', durationSeconds: 5,
    primaryReferenceNodeId: 'reference-a', imageIds: ['asset-reference-a'],
  })

  const imageToVideo = generationNode('video', {
    schema_version: 1,
    video: { duration_seconds: 10, reference_mode: 'image-to-video', primary_reference_node_id: 'reference-b' },
  })
  const selected = resolveGenerationRequestContext(
    imageToVideo, 'video', [imageToVideo, first, second],
    connections.map((connection) => ({ ...connection, to: imageToVideo.id })), capabilities,
  )
  expect(selected.imageIds).toEqual(['asset-reference-b'])
  expect(selected.mediaSources.map((source) => source.state)).toEqual([
    'reference-mode-excluded', 'included',
  ])
  expect(selected.parameterSummary).toContain('241 帧 @ 24fps')

  const disconnected = resolveGenerationRequestContext(
    imageToVideo, 'video', [imageToVideo, first],
    [{ ...connections[0], to: imageToVideo.id }], capabilities,
  )
  expect(disconnected.parameterError).toContain('仍然有效')

  const tooFewKeyframes = generationNode('video', {
    schema_version: 1,
    video: { duration_seconds: 5, reference_mode: 'keyframes' },
  })
  expect(resolveGenerationRequestContext(
    tooFewKeyframes, 'video', [tooFewKeyframes, first],
    [{ ...connections[0], to: tooFewKeyframes.id }], capabilities,
  ).parameterError).toContain('2–8 张')
})

test('new result and selection creation paths persist explicit video intent', () => {
  const result: CanvasNode = {
    id: 'result-a', type: 'result', title: 'result', x: 0, y: 0, width: 320, height: 180,
    contentData: { subtype: 'image', serialization_version: 1, asset_id: 'asset-result' },
  }
  expect(createResultGenerationBranchCommand(result, 'video')?.nodes[0].contentData?.generation_parameters)
    .toEqual({
      schema_version: 1,
      video: {
        duration_seconds: 5, reference_mode: 'image-to-video', primary_reference_node_id: 'result-a',
      },
    })
  const second = { ...result, id: 'result-b', contentData: { ...result.contentData, asset_id: 'asset-result-b' } }
  expect(createSelectionGenerationCommand([result, second], 'video', () => crypto.randomUUID())?.nodes[0]
    .contentData?.generation_parameters).toEqual({
      schema_version: 1,
      video: { duration_seconds: 5, reference_mode: 'keyframes' },
    })
  expect(formatGenerationRequestParameters({ media_type: 'image', aspect_ratio: '16:9', size: '1K' }))
    .toBe('16:9 · 1K')
  expect(formatGenerationRequestParameters({ media_type: 'video', reference_mode: 'keyframes', duration_seconds: 10 }))
    .toBe('关键帧 · 10 秒')
})

test('image ratio persists through one-command undo redo reload and matches request snapshot', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '封面生成')
  const controls = page.getByRole('region', { name: '生成参数' })
  await expect(controls.getByRole('radio')).toHaveCount(8)
  await expect(controls.getByRole('radio', { name: '4:3' })).toBeChecked()

  await controls.getByRole('radio', { name: '16:9' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const savedParameters = () => {
    const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
    return (generation.content as Record<string, unknown>).generation_parameters
  }
  expect(savedParameters()).toEqual({
    schema_version: 1, image: { aspect_ratio: '16:9' },
  })

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  expect(savedParameters()).toBeUndefined()
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  expect(savedParameters()).toEqual({
    schema_version: 1, image: { aspect_ratio: '16:9' },
  })

  await page.reload()
  await selectNode(page, '封面生成')
  await expect(page.getByRole('radio', { name: '16:9' })).toBeChecked()
  await page.getByText('检查最终生成请求').click()
  await expect(page.getByRole('region', { name: '最终生成参数' })).toContainText('比例 16:9')
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/image-generate')?.body).toEqual(expect.objectContaining({
    aspect_ratio: '16:9',
  }))
  await expect(page.locator('.run-history')).toContainText('16:9 · 1K')

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-ratio-preflight-1440x900.png'), fullPage: true })
})

test('multi-reference video stays blocked until keyframes and duration are explicitly selected', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-two-origin-merge')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    subtype: 'video', title: '双源参数视频', text: '从远景推进到人物近景。',
  }
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '双源参数视频')
  await expect(page.getByRole('alert')).toContainText('请先明确选择')
  await expect(page.getByRole('button', { name: '开始视频生成' })).toBeDisabled()
  expect(state.requests.filter((item) => item.path === '/api/video-generate')).toHaveLength(0)

  const controls = page.getByRole('region', { name: '生成参数' })
  await controls.getByRole('radio', { name: '关键帧' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  await controls.getByRole('radio', { name: '10s' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(2)
  await page.getByText('检查最终生成请求').click()
  await expect(page.getByRole('region', { name: '最终生成参数' })).toContainText('241 帧 @ 24fps')
  await expect(page.getByRole('region', { name: '有序媒体请求' })).toContainText('视频关键帧 R2')
  await page.getByRole('button', { name: '开始视频生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/video-generate')?.body).toEqual(expect.objectContaining({
    reference_mode: 'keyframes', duration_seconds: 10,
    image_ids: ['asset-generated', 'asset-second-origin'],
  }))
  await expect(page.locator('.run-history')).toContainText('关键帧 · 10 秒 · 241/24')

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'video-keyframes-preflight-920x900.png'), fullPage: true })
})

test('readonly parameters remain reviewable and offline capability loading blocks requests', async ({ page }) => {
  const readonlyState = createResourceMockState()
  const generation = readonlyState.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    generation_parameters: { schema_version: 1, image: { aspect_ratio: '3:4' } },
  }
  await openResourceWorkspace(page, readonlyState, { width: 375, height: 812 })
  await selectNode(page, '封面生成')
  const controls = page.getByRole('region', { name: '生成参数' })
  await expect(controls).toContainText('比例 3:4')
  await expect(controls.getByRole('radio')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '开始图片生成' })).toHaveCount(0)
  await expect.poll(async () => {
    const box = await page.locator('.n-drawer:visible').boundingBox()
    return Math.round((box?.x ?? 0) + (box?.width ?? 0))
  }).toBeLessThanOrEqual(375)
  const drawerBox = await page.locator('.n-drawer:visible').boundingBox()
  expect(drawerBox?.x).toBeGreaterThanOrEqual(0)
  expect(drawerBox?.width).toBeGreaterThanOrEqual(350)
  expect(documentPatches(readonlyState)).toHaveLength(0)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'readonly-image-parameters-375x812.png'), fullPage: true })

  const offlineState = createResourceMockState()
  offlineState.capabilitiesOutcome = 'failure'
  await openResourceWorkspace(page, offlineState)
  await selectNode(page, '封面生成')
  await expect(page.getByRole('alert').first()).toContainText('capability')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toBeDisabled()
  expect(offlineState.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)
  expect(offlineState.quotas.image).toBe(4)
})
