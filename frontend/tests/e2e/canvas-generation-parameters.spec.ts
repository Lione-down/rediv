import AxeBuilder from '@axe-core/playwright'
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
import { GENERATION_CAPABILITIES, GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

const evidenceRoot = process.env.REVID_PLAYWRIGHT_EVIDENCE_ROOT ??
  resolve(process.cwd(), '..', 'output', 'playwright')
const evidenceDirectory = resolve(evidenceRoot, 't5-075-generation-parameters')
const shotEvidenceDirectory = resolve(evidenceRoot, 't5-086-shot-controls')
const capabilities = parseGenerationCapabilities(GENERATION_CAPABILITIES)
const capabilitiesV6 = parseGenerationCapabilities(GENERATION_CAPABILITIES_V6)

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
  expect(capabilities.contract_version).toBe(3)
  expect(capabilities.image.shotControls?.provider_controls).toEqual(['angle', 'framing', 'focus', 'lighting'])
  expect(capabilities.video.shotControls?.supported_controls).toEqual(['angle', 'framing', 'focus', 'lighting', 'temporal'])
  expect(() => parseGenerationCapabilities({ ...GENERATION_CAPABILITIES, contract_version: 4 })).toThrow(
    'capability contract 无效',
  )

  const image = generationNode('image')
  expect(resolveGenerationRequestContext(image, 'image', [image], [], capabilities)).toMatchObject({
    aspectRatio: '1:1', parameterError: '',
    parameters: { schema_version: 1, image: { aspect_ratio: '1:1' } },
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

test('shot-control capabilities and node contracts reject drift and preserve exact compatible intent', () => {
  const staticControls = {
    contract_version: 1,
    angle: 'high-angle', framing: 'wide', focus: 'shallow', lighting: 'dramatic', temporal: 'hold',
  }
  const image = generationNode('image', {
    schema_version: 1,
    image: { aspect_ratio: '16:9', shot_controls: staticControls },
  })
  expect(resolveGenerationRequestContext(image, 'image', [image], [], capabilities)).toMatchObject({
    parameterError: '', shotControls: staticControls,
    parameters: { schema_version: 1, image: { aspect_ratio: '16:9', shot_controls: staticControls } },
  })
  const withdrawnImageCapabilities = parseGenerationCapabilities({
    ...GENERATION_CAPABILITIES,
    image: {
      ...GENERATION_CAPABILITIES.image,
      shot_controls: {
        ...GENERATION_CAPABILITIES.image.shot_controls,
        supported_controls: ['framing', 'focus', 'lighting'],
        provider_controls: ['framing', 'focus', 'lighting'],
      },
    },
  })
  expect(resolveGenerationRequestContext(image, 'image', [image], [], withdrawnImageCapabilities).parameterError)
    .toContain('不支持此镜头控制')

  const video = generationNode('video', {
    schema_version: 1,
    video: {
      duration_seconds: 5, reference_mode: 'image-to-video', primary_reference_node_id: 'reference-a',
      shot_controls: { ...staticControls, angle: 'low-angle', temporal: 'advance' },
    },
  })
  const reference = referenceNode('reference-a')
  expect(resolveGenerationRequestContext(video, 'video', [video, reference], [
    mediaConnection('shot-reference', reference.id, video.id, 1),
  ], capabilities)).toMatchObject({
    parameterError: '',
    shotControls: { ...staticControls, angle: 'low-angle', temporal: 'advance' },
  })

  const invalidTemporal = generationNode('video', {
    schema_version: 1,
    video: {
      duration_seconds: 5, reference_mode: 'text-to-video',
      shot_controls: { ...staticControls, temporal: 'rewind' },
    },
  })
  expect(resolveGenerationRequestContext(invalidTemporal, 'video', [invalidTemporal], [], capabilities).parameterError)
    .toContain('图生视频')

  for (const malformed of [
    { ...GENERATION_CAPABILITIES, image: { ...GENERATION_CAPABILITIES.image, shot_controls: { ...GENERATION_CAPABILITIES.image.shot_controls, supported_controls: ['angle', 'angle'] } } },
    { ...GENERATION_CAPABILITIES, video: { ...GENERATION_CAPABILITIES.video, shot_controls: { ...GENERATION_CAPABILITIES.video.shot_controls, provider_controls: ['angle'] } } },
    { ...GENERATION_CAPABILITIES, image: { ...GENERATION_CAPABILITIES.image, shot_controls: { ...GENERATION_CAPABILITIES.image.shot_controls, defaults: { ...GENERATION_CAPABILITIES.image.shot_controls.defaults, angle: 'low-angle' } } } },
  ]) expect(() => parseGenerationCapabilities(malformed)).toThrow('capability contract 无效')
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
        aspect_ratio: '16:9',
        duration_seconds: 5, reference_mode: 'image-to-video', primary_reference_node_id: 'result-a',
      },
    })
  const second = { ...result, id: 'result-b', contentData: { ...result.contentData, asset_id: 'asset-result-b' } }
  expect(createSelectionGenerationCommand([result, second], 'video', () => crypto.randomUUID())?.nodes[0]
    .contentData?.generation_parameters).toEqual({
      schema_version: 1,
      video: { aspect_ratio: '16:9', duration_seconds: 5, reference_mode: 'keyframes' },
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
  await expect(controls.getByRole('radio', { name: '1:1' })).toBeChecked()

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
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/v2/generation-jobs').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/v2/generation-jobs')?.body?.input).toEqual(expect.objectContaining({
    aspect_ratio: '16:9',
  }))
  await expect(page.locator('.run-history')).toHaveCount(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-ratio-preflight-1440x900.png'), fullPage: true })
})

test('shot controls persist as one reversible parameter command and reach the exact mock snapshot', async ({ page }) => {
  const state = createResourceMockState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await openResourceWorkspace(page, state)
  await selectNode(page, '封面生成')
  const controls = page.getByRole('region', { name: '生成参数' })
  await expect(controls.getByLabel('镜头角度')).toHaveValue('eye-level')
  await controls.getByLabel('镜头角度').selectOption('high-angle')
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const savedParameters = () => {
    const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
    return (generation.content as Record<string, unknown>).generation_parameters
  }
  const expectedControls = {
    contract_version: 1,
    angle: 'high-angle', framing: 'medium', focus: 'deep', lighting: 'natural', temporal: 'hold',
  }
  expect(savedParameters()).toEqual({
    schema_version: 1,
    image: { aspect_ratio: '1:1', shot_controls: expectedControls },
  })

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  expect(savedParameters()).toBeUndefined()
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  expect(savedParameters()).toEqual({
    schema_version: 1,
    image: { aspect_ratio: '1:1', shot_controls: expectedControls },
  })

  await page.reload()
  await selectNode(page, '封面生成')
  await expect(page.getByLabel('镜头角度', { exact: true })).toHaveValue('high-angle')
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/v2/generation-jobs').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/v2/generation-jobs')?.body?.input).toEqual(expect.objectContaining({
    shot_controls: expectedControls,
  }))
  const accessibility = await new AxeBuilder({ page }).include('.context-panel').analyze()
  expect(accessibility.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ))).toEqual([])
  await mkdir(shotEvidenceDirectory, { recursive: true })
  await page.locator('.context-panel').screenshot({ path: resolve(shotEvidenceDirectory, 'shot-controls-1440x900.png') })
})

test('v6 controls persist image count and allow one video source in distinct roles within one nine-entry budget', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  await openResourceWorkspace(page, state)
  await selectNode(page, '封面生成')
  const imageControls = page.getByRole('region', { name: '生成参数' })
  await imageControls.getByRole('radio', { name: '4 张' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const cover = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'generation-cover')!
  expect((cover.content as Record<string, unknown>).generation_parameters).toEqual({
    schema_version: 1,
    image: { aspect_ratio: '1:1', output_count: 4 },
  })

  const document = state.documents[FIRST_CANVAS_ID]
  const source = document.nodes.find((node) => node.id === 'result-existing')!
  const video = structuredClone(cover)
  video.id = 'generation-role-video'
  video.position_x = 980
  video.position_y = 480
  video.content = {
    title: '角色绑定视频', subtype: 'video', serialization_version: 1,
    text: '同一来源同时作为首帧与普通参考。', generation_status: 'idle',
  }
  document.nodes.push(video)
  document.connections.push({
    id: 'connection-role-video', project_id: 'project-resources', canvas_id: FIRST_CANVAS_ID,
    source_node_id: source.id, source_port: 'out', target_node_id: video.id,
    target_port: 'media', status: 'active', metadata: { input_order: 1 },
  })
  await page.reload()
  await selectNode(page, '角色绑定视频')
  const videoControls = page.getByRole('region', { name: '生成参数' })
  await expect(videoControls).toContainText('已用 1/9')
  await videoControls.getByRole('checkbox', { name: '历史图片生成结果 中间关键帧' }).check()
  await expect.poll(() => documentPatches(state).length).toBe(2)
  await expect(videoControls).toContainText('已用 2/9')
  const savedVideo = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === video.id)!
  const expectedBindings = [
    { node_id: source.id, asset_id: 'asset-generated', role: 'first-frame', order: 0 },
    { node_id: source.id, asset_id: 'asset-generated', role: 'reference', order: 1 },
  ]
  expect((savedVideo.content as Record<string, unknown>).generation_parameters).toEqual({
    schema_version: 1,
    video: {
      aspect_ratio: '16:9',
      duration_seconds: 5,
      reference_mode: 'keyframes',
      reference_bindings: expectedBindings,
    },
  })
  await page.getByRole('button', { name: '开始视频生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/v2/generation-jobs').length).toBe(1)
  const request = state.requests.find((item) => item.path === '/api/v2/generation-jobs')?.body?.input
  expect(request).toEqual(expect.objectContaining({ video_references: expectedBindings }))
  expect(request).not.toHaveProperty('image_ids')
  expect(request).not.toHaveProperty('reference_mode')
})

test('time advance is available only on a single-reference image-to-video branch and reaches its snapshot', async ({ page }) => {
  const state = createResourceMockState()
  const document = state.documents[FIRST_CANVAS_ID]
  const source = document.nodes.find((node) => node.id === 'result-existing')!
  const video = structuredClone(document.nodes.find((node) => node.id === 'generation-cover')!)
  video.id = 'generation-shot-video'
  video.position_x = 980
  video.position_y = 420
  video.content = {
    title: '时间镜头视频', subtype: 'video', serialization_version: 1, text: '从静帧前推到下一瞬间。', generation_status: 'idle',
  }
  document.nodes.push(video)
  document.connections.push({
    ...structuredClone(document.connections[0]),
    id: 'connection-shot-video-reference', source_node_id: source.id, target_node_id: video.id,
    source_port: 'out', target_port: 'media', metadata: { input_order: 1 },
  })

  await openResourceWorkspace(page, state)
  await selectNode(page, '时间镜头视频')
  const controls = page.getByRole('region', { name: '生成参数' })
  await expect(controls.getByLabel('时间方向')).toBeEnabled()
  await controls.getByLabel('时间方向').selectOption('advance')
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const expectedControls = {
    contract_version: 1,
    angle: 'eye-level', framing: 'medium', focus: 'deep', lighting: 'natural', temporal: 'advance',
  }
  const savedVideo = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === video.id)!
  expect((savedVideo.content as Record<string, unknown>).generation_parameters).toEqual({
    schema_version: 1,
    video: {
      aspect_ratio: '16:9',
      duration_seconds: 5, reference_mode: 'image-to-video', primary_reference_node_id: 'result-existing',
      shot_controls: expectedControls,
    },
  })
  await page.getByRole('button', { name: '开始视频生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/v2/generation-jobs').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/v2/generation-jobs')?.body?.input).toEqual(expect.objectContaining({
    reference_mode: 'image-to-video', image_ids: ['asset-generated'], shot_controls: expectedControls,
  }))
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
  expect(state.requests.filter((item) => item.path === '/api/v2/generation-jobs')).toHaveLength(0)

  const controls = page.getByRole('region', { name: '生成参数' })
  await controls.getByRole('radio', { name: '关键帧' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  await expect.poll(() => {
    const content = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'generation-two-origin-merge')?.content
    return (content as Record<string, unknown>).generation_parameters
  }).toEqual({
    schema_version: 1,
    video: { aspect_ratio: '16:9', duration_seconds: 5, reference_mode: 'keyframes' },
  })
  await controls.getByRole('radio', { name: '10s' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(2)
  await page.getByText('检查最终生成请求').click()
  await expect(page.getByRole('region', { name: '最终生成参数' })).toContainText('241 帧 @ 24fps')
  await expect(page.getByRole('region', { name: '有序媒体请求' })).toContainText('视频关键帧 R2')
  await page.getByRole('button', { name: '开始视频生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/v2/generation-jobs').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/v2/generation-jobs')?.body?.input).toEqual(expect.objectContaining({
    reference_mode: 'keyframes', duration_seconds: 10,
    image_ids: ['asset-generated', 'asset-second-origin'],
  }))
  await expect(page.locator('.run-history')).toHaveCount(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'video-keyframes-preflight-920x900.png'), fullPage: true })
})

test('readonly parameters remain reviewable and offline capability loading blocks requests', async ({ page }) => {
  const readonlyState = createResourceMockState()
  const generation = readonlyState.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    generation_parameters: {
      schema_version: 1,
      image: {
        aspect_ratio: '3:4',
        shot_controls: {
          contract_version: 1,
          angle: 'high-angle', framing: 'medium', focus: 'deep', lighting: 'natural', temporal: 'hold',
        },
      },
    },
  }
  await openResourceWorkspace(page, readonlyState, { width: 375, height: 812 })
  await selectNode(page, '封面生成')
  const controls = page.getByRole('region', { name: '生成参数' })
  await expect(controls).toContainText('比例 3:4')
  await expect(controls).toContainText('镜头角度 俯视')
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
  await expect(page.getByRole('alert').first()).toContainText('模型服务暂不可用，请重试。')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toBeDisabled()
  expect(offlineState.requests.filter((item) => item.path === '/api/v2/generation-jobs')).toHaveLength(0)
  expect(offlineState.quotas.image).toBe(4)
})
