import { expect, test } from '@playwright/test'
import {
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import { createVisualState, installMockApi } from './authenticated-workflow-fixture'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'

function officialCapabilityV7() {
  const capability = structuredClone(GENERATION_CAPABILITIES_V6) as Record<string, any>
  capability.contract_version = 7
  capability.image.default_aspect_ratio = '1:1'
  capability.image.sizes = ['1K', '2K', '3K', '4K']
  capability.image.default_size = '1K'
  capability.image.size_dimensions = {
    '1K': {
      '1:1': { width: 1024, height: 1024 },
      '3:4': { width: 864, height: 1152 },
      '4:3': { width: 1152, height: 864 },
      '16:9': { width: 1312, height: 736 },
      '9:16': { width: 736, height: 1312 },
      '2:3': { width: 832, height: 1248 },
      '3:2': { width: 1248, height: 832 },
      '21:9': { width: 1568, height: 672 },
    },
    '2K': {
      '1:1': { width: 2048, height: 2048 },
      '3:4': { width: 1728, height: 2304 },
      '4:3': { width: 2304, height: 1728 },
      '16:9': { width: 2624, height: 1472 },
      '9:16': { width: 1472, height: 2624 },
      '2:3': { width: 1664, height: 2496 },
      '3:2': { width: 2496, height: 1664 },
      '21:9': { width: 3136, height: 1344 },
    },
    '3K': {
      '1:1': { width: 3072, height: 3072 },
      '3:4': { width: 2592, height: 3456 },
      '4:3': { width: 3456, height: 2592 },
      '16:9': { width: 3936, height: 2208 },
      '9:16': { width: 2208, height: 3936 },
      '2:3': { width: 2496, height: 3744 },
      '3:2': { width: 3744, height: 2496 },
      '21:9': { width: 4704, height: 2016 },
    },
    '4K': {
      '1:1': { width: 4096, height: 4096 },
      '3:4': { width: 3456, height: 4608 },
      '4:3': { width: 4608, height: 3456 },
      '16:9': { width: 5248, height: 2944 },
      '9:16': { width: 2944, height: 5248 },
      '2:3': { width: 3328, height: 4992 },
      '3:2': { width: 4992, height: 3328 },
      '21:9': { width: 6272, height: 2688 },
    },
  }
  capability.video.negative_prompt_max_length = 2000
  capability.video.supports_semantic_multi_reference = false
  capability.video.max_references = 8
  return capability
}

test('Agnes capability v7 preserves official Image size and Video input boundaries', () => {
  const capability = parseGenerationCapabilities(officialCapabilityV7())

  expect(capability.contract_version).toBe(7)
  expect(capability.image.sizes).toEqual(['1K', '2K', '3K', '4K'])
  expect(capability.image.default_size).toBe('1K')
  expect(capability.image.default_aspect_ratio).toBe('1:1')
  expect(capability.image.size_dimensions['1K']['16:9']).toEqual({
    width: 1312,
    height: 736,
  })
  expect(capability.video.negative_prompt_max_length).toBe(2000)
  expect(capability.video.supports_semantic_multi_reference).toBe(false)
})

test('persisted Image size and Video negative prompt remain part of stable-node parameters', () => {
  const capability = parseGenerationCapabilities(officialCapabilityV7())
  const imageNode: any = {
    id: 'image-node',
    type: 'generation',
    content: '',
    contentData: {
      subtype: 'image',
      generation_parameters: {
        schema_version: 1,
        image: { size: '2K', aspect_ratio: '16:9', output_count: 1 },
      },
    },
    x: 0,
    y: 0,
    width: 340,
    height: 220,
    status: 'idle',
  }
  const videoNode: any = {
    ...imageNode,
    id: 'video-node',
    contentData: {
      subtype: 'video',
      generation_parameters: {
        schema_version: 1,
        video: {
          aspect_ratio: '16:9',
          duration_seconds: 5,
          reference_mode: 'text-to-video',
          negative_prompt: 'watermark',
        },
      },
    },
  }

  const image = resolveGenerationRequestContext(imageNode, 'image', [imageNode], [], capability)
  const video = resolveGenerationRequestContext(videoNode, 'video', [videoNode], [], capability)

  expect(image.imageSize).toBe('2K')
  expect(image.parameterSummary).toContain('目标 2624×1472（实际以结果为准）')
  expect(video.negativePrompt).toBe('watermark')
  expect(video.parameterSummary).toContain('反向提示 已设置')
})

test('Video negative prompt persists through typed history and reload on one stable node', async ({ page }) => {
  const state = createVisualState()
  const videoNode = state.canvasNodes.find((node) => node.id === 'node-image')!
  videoNode.content = {
    title: '视频生成',
    subtype: 'video',
    serialization_version: 1,
    text: 'Animate the frame.',
    generation_parameters: {
      schema_version: 1,
      video: {
        aspect_ratio: '16:9',
        duration_seconds: 5,
        reference_mode: 'text-to-video',
      },
    },
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state, officialCapabilityV7())
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  await runtime.getByRole('button', { name: '打开参数' }).click()
  const negativePrompt = runtime.getByRole('textbox', { name: '视频反向提示词' })
  await negativePrompt.fill('watermark, distorted hands')
  await negativePrompt.blur()
  await expect.poll(() => {
    const content = state.canvasNodes.find((node) => node.id === 'node-image')?.content as any
    return content.generation_parameters?.video?.negative_prompt
  }).toBe('watermark, distorted hands')

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect(negativePrompt).toHaveValue('')
  await runtime.getByRole('button', { name: '重做' }).click()
  await expect(negativePrompt).toHaveValue('watermark, distorted hands')
  await expect.poll(() => {
    const content = state.canvasNodes.find((node) => node.id === 'node-image')?.content as any
    return content.generation_parameters?.video?.negative_prompt
  }).toBe('watermark, distorted hands')

  await page.reload()
  const reloadedRuntime = page.locator('[data-canvas-runtime="replacement"]')
  await reloadedRuntime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  await reloadedRuntime.getByRole('button', { name: '打开参数' }).click()
  await expect(reloadedRuntime.getByRole('textbox', { name: '视频反向提示词' })).toHaveValue(
    'watermark, distorted hands',
  )
})

test('Script generation brief persists per stable node before node switching', async ({ page }) => {
  const state = createVisualState()
  const base = state.canvasNodes[0]
  state.canvasNodes.push(
    {
      ...structuredClone(base),
      id: 'script-brief-a',
      node_type: 'script',
      content: {
        title: '脚本 A',
        subtype: 'script',
        serialization_version: 1,
        text: 'A 的 canonical story text',
      },
      position_x: 560,
      position_y: 120,
      width: 340,
      height: 220,
    },
    {
      ...structuredClone(base),
      id: 'script-brief-b',
      node_type: 'script',
      content: {
        title: '脚本 B',
        subtype: 'script',
        serialization_version: 1,
        text: 'B 的 canonical story text',
      },
      position_x: 940,
      position_y: 120,
      width: 340,
      height: 220,
    },
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="script-brief-a"] [data-node-body]').click()
  const brief = runtime.getByRole('textbox', { name: '分镜生成要求' })
  await brief.fill('A 节点的持久化分镜要求')
  await expect(runtime.getByRole('button', { name: '生成分镜' })).toBeEnabled()
  await runtime.locator('[data-runtime-node="script-brief-b"] [data-node-body]').click()
  await expect.poll(() => {
    const content = state.canvasNodes.find((node) => node.id === 'script-brief-a')?.content as any
    return content.card_configuration?.prompt_document?.segments
  }).toEqual([{ kind: 'text', text: 'A 节点的持久化分镜要求' }])
  await runtime.locator('[data-runtime-node="script-brief-a"] [data-node-body]').click()

  await expect(runtime.getByRole('textbox', { name: '分镜生成要求' })).toHaveValue(
    'A 节点的持久化分镜要求',
  )
  const persisted = state.canvasNodes.find((node) => node.id === 'script-brief-a')?.content as any
  expect(persisted.text).toBe('A 的 canonical story text')
  expect(persisted.story_production).toBeUndefined()
  expect(persisted.card_configuration.prompt_document.segments).toEqual([
    { kind: 'text', text: 'A 节点的持久化分镜要求' },
  ])

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect(runtime.getByRole('textbox', { name: '分镜生成要求' })).toHaveValue('')
  await runtime.getByRole('button', { name: '重做' }).click()
  await expect(runtime.getByRole('textbox', { name: '分镜生成要求' })).toHaveValue(
    'A 节点的持久化分镜要求',
  )
  await expect.poll(() => {
    const content = state.canvasNodes.find((node) => node.id === 'script-brief-a')?.content as any
    return content.card_configuration?.prompt_document?.segments
  }).toEqual([{ kind: 'text', text: 'A 节点的持久化分镜要求' }])

  await page.reload()
  const reloadedRuntime = page.locator('[data-canvas-runtime="replacement"]')
  await reloadedRuntime.locator('[data-runtime-node="script-brief-a"] [data-node-body]').click()
  await expect(reloadedRuntime.getByRole('textbox', { name: '分镜生成要求' })).toHaveValue(
    'A 节点的持久化分镜要求',
  )
})

test('active Script generation lights only the owning stable node from left to right', async ({
  page,
}, testInfo) => {
  const state = createVisualState()
  const base = state.canvasNodes[0]
  state.canvasNodes.push(
    {
      ...structuredClone(base),
      id: 'script-light-owner',
      node_type: 'script',
      content: {
        title: '执行中的脚本',
        subtype: 'script',
        serialization_version: 1,
        text: '一个可生成分镜的故事。',
      },
      position_x: 560,
      position_y: 120,
      width: 340,
      height: 220,
    },
    {
      ...structuredClone(base),
      id: 'script-light-neighbor',
      node_type: 'script',
      content: {
        title: '未执行的脚本',
        subtype: 'script',
        serialization_version: 1,
        text: '另一个故事。',
      },
      position_x: 940,
      position_y: 120,
      width: 340,
      height: 220,
    },
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  let releaseRequest!: () => void
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve
  })
  await page.route('http://localhost:8000/api/text-generate', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-headers': 'Authorization, Content-Type',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-origin': 'http://127.0.0.1:9099',
        },
      })
      return
    }
    await requestGate
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': 'http://127.0.0.1:9099' },
      body: JSON.stringify({ detail: { message: 'controlled Script completion' } }),
    })
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const owner = runtime.locator('[data-runtime-node="script-light-owner"]')
  const neighbor = runtime.locator('[data-runtime-node="script-light-neighbor"]')
  await owner.locator('[data-node-body]').click()
  await runtime.getByRole('textbox', { name: '分镜生成要求' }).fill('生成完整分镜')
  await runtime.getByRole('button', { name: '生成分镜' }).click()

  await expect(owner).toHaveAttribute('data-script-loading', 'true')
  await expect(neighbor).not.toHaveAttribute('data-script-loading')
  const sweep = owner.locator('[data-script-loading-sweep]')
  await expect(sweep).toBeVisible()
  const firstX = await sweep.evaluate((element) => (
    new DOMMatrix(getComputedStyle(element).transform).m41
  ))
  await page.waitForTimeout(240)
  const secondX = await sweep.evaluate((element) => (
    new DOMMatrix(getComputedStyle(element).transform).m41
  ))
  expect(secondX).toBeGreaterThan(firstX)
  await testInfo.attach('script-loading-motion.json', {
    body: JSON.stringify({ firstX, secondX }),
    contentType: 'application/json',
  })
  await page.screenshot({
    path: testInfo.outputPath('script-left-to-right-loading.png'),
    fullPage: true,
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(sweep).toBeVisible()
  await expect.poll(() => sweep.evaluate((element) => getComputedStyle(element).animationName))
    .toBe('none')
  await page.screenshot({
    path: testInfo.outputPath('script-loading-reduced-motion.png'),
    fullPage: true,
  })

  releaseRequest()
  await expect(owner).not.toHaveAttribute('data-script-loading', { timeout: 5_000 })
  await expect(sweep).toHaveCount(0)
})

test('selected media cards keep attached tools close to the visible card geometry', async ({ page }) => {
  const state = createVisualState()
  const imageNode = state.canvasNodes.find((node) => node.id === 'node-image')!
  imageNode.width = 340
  imageNode.height = 360
  imageNode.content = {
    ...(imageNode.content as Record<string, unknown>),
    generation_parameters: {
      schema_version: 1,
      image: { aspect_ratio: '16:9', output_count: 1 },
    },
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const card = runtime.locator('[data-runtime-node="node-image"]')
  await card.locator('[data-node-body]').click()
  const toolbar = runtime.locator('[data-node-toolbar]')
  const composer = runtime.locator('[data-node-composer]')
  const [cardBox, toolbarBox, composerBox] = await Promise.all([
    card.boundingBox(),
    toolbar.boundingBox(),
    composer.boundingBox(),
  ])
  expect(cardBox).not.toBeNull()
  expect(toolbarBox).not.toBeNull()
  expect(composerBox).not.toBeNull()
  const toolbarGap = toolbarBox!.x - (cardBox!.x + cardBox!.width)
  const composerGap = composerBox!.y - (cardBox!.y + cardBox!.height)
  expect(toolbarGap).toBeGreaterThanOrEqual(12)
  expect(toolbarGap).toBeLessThanOrEqual(24)
  expect(composerGap).toBeGreaterThanOrEqual(8)
  expect(composerGap).toBeLessThanOrEqual(20)
})

test('connected reference chips use resolved media thumbnails and never broken internal URLs', async ({ page }) => {
  const state = createVisualState()
  state.canvasNodes.push({
    id: 'reference-image',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'asset',
    content: {
      title: 'Reference image',
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'asset-reference-image',
      url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    },
    position_x: 40,
    position_y: 520,
    width: 240,
    height: 160,
    status: 'idle',
  })
  state.canvasConnections.push({
    id: 'reference-to-image-generation',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    source_node_id: 'reference-image',
    source_port: 'out',
    target_node_id: 'node-image',
    target_port: 'media',
    status: 'active',
    metadata: {},
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  await runtime.locator('.runtime-node-composer__references button').click()
  await runtime.getByRole('option', { name: /Reference image/ }).click()

  const images = runtime.locator('[data-node-composer] [data-reference-token] img, [data-node-composer] [data-structured-reference-token] img')
  await expect(images).toHaveCount(2)
  const imageStates = await images.evaluateAll((elements) => elements.map((element) => {
    const image = element as HTMLImageElement
    return {
      isLoaded: image.complete && image.naturalWidth > 0,
      source: image.getAttribute('src'),
    }
  }))
  expect(imageStates).toEqual([
    { isLoaded: true, source: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' },
    { isLoaded: true, source: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' },
  ])
})

test('persisted internal reference tokens resolve through the authoritative project asset URL', async ({
  page,
}, testInfo) => {
  const state = createVisualState()
  const thumbnail =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%238b5cf6%22/%3E%3Cstop offset=%221%22 stop-color=%22%23f472b6%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22url(%23g)%22/%3E%3Ccircle cx=%2232%22 cy=%2226%22 r=%2211%22 fill=%22white%22 fill-opacity=%22.9%22/%3E%3Cpath d=%22M13 56c3-12 11-18 19-18s16 6 19 18%22 fill=%22white%22 fill-opacity=%22.75%22/%3E%3C/svg%3E'
  const target = state.canvasNodes.find((node) => node.id === 'node-image')!
  target.content = {
    ...(target.content as Record<string, unknown>),
    card_configuration: {
      schema_version: 1,
      generation_mode: 'text-to-image',
      model_id: 'agnes-image-2.1-flash',
      prompt_document: {
        schema_version: 1,
        segments: [{
          kind: 'reference',
          stable_id: 'reference-generation',
          asset_id: 'asset-reference-result',
        }],
      },
      references: [{
        stable_id: 'reference-generation',
        asset_id: 'asset-reference-result',
        display_name: '真实生成参考图',
        thumbnail_url: 'canvas-asset://asset-reference-result',
        source_revision: 0,
        role: 'reference',
        order: 0,
      }],
    },
  }
  state.assets.push({
    id: 'asset-reference-result',
    user_id: 'user-e2e',
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: 'reference-result',
    type: 'image',
    url: thumbnail,
    content_text: null,
    source: 'generation',
    source_model: 'mock-image-model',
    source_task_id: 'task-reference',
    status: 'active',
    created_at: '2026-07-27T08:00:00Z',
    updated_at: '2026-07-27T08:00:00Z',
  })
  state.canvasNodes.push(
    {
      id: 'reference-generation',
      project_id: 'project-e2e',
      canvas_id: 'canvas-first',
      node_type: 'generation',
      content: {
        title: '真实生成参考图',
        subtype: 'image',
        serialization_version: 1,
        result_materialized_task_id: 'task-reference',
      },
      position_x: 40,
      position_y: 520,
      width: 240,
      height: 160,
      status: 'idle',
    },
    {
      id: 'reference-result',
      project_id: 'project-e2e',
      canvas_id: 'canvas-first',
      node_type: 'result',
      content: {
        title: '真实生成参考图结果',
        subtype: 'image',
        serialization_version: 1,
        asset_id: 'asset-reference-result',
        source_task_id: 'task-reference',
        url: thumbnail,
      },
      position_x: 320,
      position_y: 520,
      width: 240,
      height: 160,
      status: 'idle',
    },
  )
  state.canvasConnections.push(
    {
      id: 'reference-generation-result',
      project_id: 'project-e2e',
      canvas_id: 'canvas-first',
      source_node_id: 'reference-generation',
      source_port: 'out',
      target_node_id: 'reference-result',
      target_port: 'in',
      status: 'active',
      metadata: {},
    },
    {
      id: 'reference-generation-target',
      project_id: 'project-e2e',
      canvas_id: 'canvas-first',
      source_node_id: 'reference-generation',
      source_port: 'out',
      target_node_id: 'node-image',
      target_port: 'media',
      status: 'active',
      metadata: {},
    },
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  const referenceImages = runtime.locator(
    '[data-node-composer] [data-reference-token] img, [data-node-composer] [data-structured-reference-token] img',
  )
  await expect(referenceImages).toHaveCount(2)
  await expect.poll(() => referenceImages.evaluateAll((images, expectedSource) => images.every((element) => {
    const image = element as HTMLImageElement
    return image.complete && image.naturalWidth > 0 && image.getAttribute('src') === expectedSource
  }), thumbnail)).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('materialized-reference-thumbnails.png'),
    fullPage: true,
  })
})

test('replacement runtime exposes the existing typed rename path for every stable node family', async ({
  page,
}, testInfo) => {
  const state = createVisualState()
  state.canvasNodes.push(
    {
      id: 'rename-script', project_id: 'project-e2e', canvas_id: 'canvas-first',
      node_type: 'script', content: {
        title: '脚本节点', subtype: 'script', serialization_version: 1, text: '',
      },
      position_x: 560, position_y: 140, width: 320, height: 200, status: 'idle',
    },
    {
      id: 'rename-video', project_id: 'project-e2e', canvas_id: 'canvas-first',
      node_type: 'generation', content: {
        title: '视频节点', subtype: 'video', serialization_version: 1, text: '',
      },
      position_x: 920, position_y: 140, width: 340, height: 220, status: 'idle',
    },
    {
      id: 'rename-asset', project_id: 'project-e2e', canvas_id: 'canvas-first',
      node_type: 'asset', content: {
        title: '素材节点', subtype: 'image', serialization_version: 1,
        asset_id: 'asset-rename', url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      },
      position_x: 180, position_y: 500, width: 240, height: 160, status: 'idle',
    },
    {
      id: 'rename-group', project_id: 'project-e2e', canvas_id: 'canvas-first',
      node_type: 'group', content: {
        title: '分组节点', subtype: 'group', serialization_version: 1,
      },
      position_x: 560, position_y: 500, width: 320, height: 180, status: 'idle',
    },
    {
      id: 'rename-locked', project_id: 'project-e2e', canvas_id: 'canvas-first',
      node_type: 'text', content: {
        title: '锁定节点', subtype: 'text', serialization_version: 1, text: '',
      },
      position_x: 920, position_y: 500, width: 240, height: 160, status: 'idle',
      is_locked: true,
    },
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const renameCases = [
    ['node-image', '生成封面', '主视觉节点'],
    ['rename-script', '脚本节点', '主脚本节点'],
    ['rename-video', '视频节点', '主视频节点'],
    ['rename-asset', '素材节点', '主素材节点'],
    ['rename-group', '分组节点', '主分组节点'],
  ] as const
  for (const [nodeId, oldTitle, nextTitle] of renameCases) {
    const node = runtime.locator(`[data-runtime-node="${nodeId}"]`)
    const renameControl = node.locator('[data-node-rename-control]')
    await expect(renameControl).toBeVisible()
    await expect(renameControl).toHaveAttribute('aria-label', `重命名 ${oldTitle}`)
    await renameControl.click()
    const renameInput = node.locator('[data-node-title-editor]')
    await expect(renameInput).toBeFocused()
    await renameInput.fill(nextTitle)
    await renameInput.press('Enter')
    await expect(node.locator('[data-node-identity] strong')).toHaveText(nextTitle)
  }
  const lockedNode = runtime.locator('[data-runtime-node="rename-locked"]')
  await expect(lockedNode.locator('[data-node-rename-control]')).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await lockedNode.locator('[data-node-identity]').dblclick()
  await expect(lockedNode.locator('[data-node-title-editor]')).toHaveCount(0)

  await expect.poll(() => {
    const content = state.canvasNodes.find((candidate) => candidate.id === 'node-image')
      ?.content as Record<string, unknown> | undefined
    return content?.title
  }).toBe('主视觉节点')

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect(runtime.locator('[data-runtime-node="rename-group"] [data-node-identity] strong'))
    .toHaveText('分组节点')
  await runtime.getByRole('button', { name: '重做' }).click()
  await expect(runtime.locator('[data-runtime-node="rename-group"] [data-node-identity] strong'))
    .toHaveText('主分组节点')

  await page.reload()
  for (const [nodeId, , nextTitle] of renameCases) {
    await expect(runtime.locator(`[data-runtime-node="${nodeId}"] [data-node-identity] strong`))
      .toHaveText(nextTitle)
  }
  await page.screenshot({
    path: testInfo.outputPath('replacement-node-renames-after-reload.png'),
    fullPage: true,
  })
})

test('replacement rename keeps the local command visible when autosave fails instead of claiming persistence', async ({
  page,
}, testInfo) => {
  const state = createVisualState()
  await installMockApi(page, state)
  await page.route(
    'http://localhost:8000/api/projects/project-e2e/canvases/canvas-first/document',
    async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback()
        return
      }
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'controlled autosave failure' }),
      })
    },
  )
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const node = runtime.locator('[data-runtime-node="node-image"]')
  await node.locator('[data-node-rename-control]').click()
  await node.locator('[data-node-title-editor]').fill('未同步但未丢失')
  await node.locator('[data-node-title-editor]').press('Enter')

  await expect(node.locator('[data-node-identity] strong')).toHaveText('未同步但未丢失')
  await expect(runtime.locator('.replacement-runtime__sync')).toContainText('画布未保存')
  expect(
    (state.canvasNodes.find((candidate) => candidate.id === 'node-image')?.content as
      Record<string, unknown>).title,
  ).toBe('生成封面')
  await page.screenshot({
    path: testInfo.outputPath('rename-autosave-failure-visible.png'),
    fullPage: true,
  })
})
