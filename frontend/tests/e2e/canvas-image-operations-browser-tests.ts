import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  IMAGE_OPERATIONS,
  createDefaultImageOperationContract,
  parseImageOperationContract,
  resolveImageOperationSources,
  type ImageOperationCapabilities,
  type ImageOperationId,
} from '../../src/modules/canvas/image-operations'
import {
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import { createImageOperationBranchCommand } from '../../src/modules/canvas/image-operation-commands'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'
import {
  resolveProfessionalCanvasActions,
  type ProfessionalCanvasActionContext,
} from '../../src/modules/canvas/professional-action-registry'
import {
  addTwoOriginMerge,
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID as RESOURCE_PROJECT_ID,
} from './canvas-resource-generation-fixture'

const PROJECT_ID = 'project-image-operation'
const USER_ID = 'user-image-operation'
const EVIDENCE_DIRECTORY = resolve(process.cwd(), '..', 'output', 'playwright', 't5-085')

function operationCapabilities(overrides: Partial<ImageOperationCapabilities> = {}): ImageOperationCapabilities {
  return {
    contract_version: 1,
    supported_operations: ['expand', 'inpaint', 'erase', 'cutout', 'upscale', 'region', 'fusion'],
    provider_operations: ['expand', 'inpaint', 'erase', 'cutout', 'upscale', 'fusion'],
    region_coordinate_space: 'source-normalized',
    max_fusion_images: 8,
    upscale_factors: [2, 4],
    ...overrides,
  }
}

function capabilityDocument(version: 1 | 2 = 2) {
  return {
    contract_version: version,
    image: {
      model: 'agnes-image-2.1-flash', size: '1K', aspect_ratios: ['1:1', '4:3'], default_aspect_ratio: '4:3',
      ...(version === 2 ? { operations: operationCapabilities() } : {}),
    },
    video: {
      model: 'agnes-video-v2.0', width: 1152, height: 768,
      reference_modes: ['text-to-video', 'image-to-video', 'keyframes'],
      default_duration_seconds: 5, min_keyframes: 2, max_keyframes: 8,
      duration_presets: [{ duration_seconds: 5, num_frames: 121, frame_rate: 24 }],
    },
  }
}

function imageAsset(id: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id,
    user_id: USER_ID,
    project_id: PROJECT_ID,
    origin_canvas_id: 'source-canvas',
    canvas_node_id: null,
    type: 'image',
    url: `https://media.revid.test/${id}.png`,
    content_text: null,
    source: 'generation',
    source_model: 'mock-image-model',
    source_task_id: `task-${id}`,
    status: 'active',
    created_at: '2026-07-17T00:00:00Z',
    updated_at: '2026-07-17T00:00:00Z',
    ...overrides,
  }
}

function imageResult(id: string, overrides: Partial<CanvasNode> = {}): CanvasNode {
  const assetId = `asset-${id}`
  return {
    id,
    type: 'result',
    title: `结果 ${id}`,
    x: 160,
    y: 140,
    width: 320,
    height: 240,
    status: 'success',
    contentData: {
      subtype: 'image', serialization_version: 1, asset_id: assetId,
      project_id: PROJECT_ID, origin_canvas_id: 'source-canvas',
      source_task_id: `task-${assetId}`, source_model: 'mock-image-model',
      url: `https://media.revid.test/${assetId}.png`,
    },
    ...overrides,
  }
}

function sourceContext(selectedNodes: CanvasNode[], overrides: Partial<Parameters<typeof resolveImageOperationSources>[1]> = {}) {
  return {
    assets: selectedNodes.map((node) => imageAsset(String(node.contentData?.asset_id))),
    capabilities: operationCapabilities(),
    projectId: PROJECT_ID,
    selectedNodes,
    userId: USER_ID,
    ...overrides,
  }
}

async function selectCanvasNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

test('local region action creates one downstream branch and never starts generation', async ({ page }) => {
  const state = createResourceMockState()
  const sourceBefore = JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing'))
  await openResourceWorkspace(page, state)
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/generation-capabilities').length).toBe(1)
  await expect.poll(() => state.requests.filter((request) => request.path === '/assets').length).toBe(1)
  await selectCanvasNode(page, '历史图片生成结果')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')

  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette.getByRole('option', { name: /标记区域/ })).toBeVisible()
  await palette.getByRole('option', { name: /标记区域/ }).click()

  await expect.poll(() => documentPatches(state).length).toBe(1)
  const branch = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    (node.content as Record<string, unknown>).title === '区域标记'
  ))
  expect(branch).toBeTruthy()
  expect((branch!.content as Record<string, unknown>).generation_parameters).toEqual({
    schema_version: 1,
    image: {
      aspect_ratio: '4:3',
      operation: createDefaultImageOperationContract('region', operationCapabilities()),
    },
  })
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({
    source_node_id: 'result-existing', target_node_id: branch!.id, target_port: 'media',
    metadata: { input_order: 1 },
  }))
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing'))).toBe(sourceBefore)
  expect(state.requests.filter((request) => request.path === '/api/image-generate')).toHaveLength(0)
})

test('region controls persist a strict normalized rectangle through one reversible document command', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/generation-capabilities').length).toBe(1)
  await expect.poll(() => state.requests.filter((request) => request.path === '/assets').length).toBe(1)
  await selectCanvasNode(page, '历史图片生成结果')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('option', { name: /标记区域/ }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)

  const controls = page.getByRole('region', { name: '图片操作参数' })
  await expect(controls.getByRole('spinbutton', { name: '区域 X' })).toHaveValue('0.25')
  await expect(controls.getByText('本地区域标记，不会调用生成服务。')).toBeVisible()
  await expect(page.getByRole('button', { name: '开始图片生成' })).toHaveCount(0)
  await controls.getByRole('spinbutton', { name: '区域 X' }).fill('0.1')
  await controls.getByRole('spinbutton', { name: '区域 X' }).blur()
  await expect.poll(() => documentPatches(state).length).toBe(2)

  const branch = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    (node.content as Record<string, unknown>).title === '区域标记'
  ))!
  const operation = (((branch.content as Record<string, unknown>).generation_parameters as Record<string, unknown>)
    .image as Record<string, unknown>).operation
  expect(operation).toEqual({
    contract_version: 1,
    id: 'region',
    region: { contract_version: 1, coordinate_space: 'source-normalized', x: 0.1, y: 0.25, width: 0.5, height: 0.5 },
  })

  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => documentPatches(state).length).toBe(4)
  await page.reload()
  await selectCanvasNode(page, '区域标记')
  await expect(page.getByRole('spinbutton', { name: '区域 X' })).toHaveValue('0.1')
  expect(state.requests.filter((request) => request.path === '/api/image-generate')).toHaveLength(0)
})

test('provider operation controls preserve exact prompt rules and operation-specific parameters', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/generation-capabilities').length).toBe(1)
  await expect.poll(() => state.requests.filter((request) => request.path === '/assets').length).toBe(1)

  async function createBranch(actionName: RegExp, title: string) {
    await selectCanvasNode(page, '历史图片生成结果')
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    await stage.focus()
    await page.keyboard.press('/')
    await page.getByRole('dialog', { name: '专业操作' }).getByRole('option', { name: actionName }).click()
    await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => (
      (node.content as Record<string, unknown>).title === title
    ))).toBe(true)
    return state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
      (node.content as Record<string, unknown>).title === title
    ))!
  }

  const expand = await createBranch(/扩展画面/, '画面扩展')
  const controls = page.getByRole('region', { name: '图片操作参数' })
  await controls.getByRole('spinbutton', { name: '上扩展边距' }).fill('0.4')
  await controls.getByRole('spinbutton', { name: '上扩展边距' }).blur()
  await page.getByRole('textbox', { name: '生成提示词' }).fill('补齐上方云层')
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  let latestImageRequest = state.requests.filter((request) => request.path === '/api/image-generate').at(-1)!
  expect(latestImageRequest.body).toEqual(expect.objectContaining({
    canvas_node_id: expand.id,
    prompt: '补齐上方云层',
    image_operation: {
      ...createDefaultImageOperationContract('expand', operationCapabilities()),
      expansion: { contract_version: 1, top: 0.4, right: 0.25, bottom: 0.25, left: 0.25 },
    },
  }))

  const erase = await createBranch(/擦除区域/, '区域擦除')
  await expect(page.getByRole('textbox', { name: '生成提示词' })).toHaveCount(0)
  await page.getByRole('spinbutton', { name: '遮罩羽化' }).fill('0.2')
  await page.getByRole('spinbutton', { name: '遮罩羽化' }).blur()
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(2)
  latestImageRequest = state.requests.filter((request) => request.path === '/api/image-generate').at(-1)!
  expect(latestImageRequest.body).toEqual(expect.objectContaining({
    canvas_node_id: erase.id,
    image_operation: {
      ...createDefaultImageOperationContract('erase', operationCapabilities()),
      mask: { contract_version: 1, kind: 'region', feather: 0.2, invert: false },
    },
  }))
  expect(latestImageRequest.body).not.toHaveProperty('prompt')

  const cutout = await createBranch(/主体抠图/, '主体抠图')
  await expect(page.getByRole('textbox', { name: '生成提示词' })).toHaveCount(0)
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(3)
  latestImageRequest = state.requests.filter((request) => request.path === '/api/image-generate').at(-1)!
  expect(latestImageRequest.body).toEqual(expect.objectContaining({
    canvas_node_id: cutout.id,
    image_operation: createDefaultImageOperationContract('cutout', operationCapabilities()),
  }))
  expect(latestImageRequest.body).not.toHaveProperty('prompt')

  const upscale = await createBranch(/高清放大/, '高清放大')
  await page.getByRole('radio', { name: '4×' }).check()
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(4)
  latestImageRequest = state.requests.filter((request) => request.path === '/api/image-generate').at(-1)!
  expect(latestImageRequest.body).toEqual(expect.objectContaining({
    canvas_node_id: upscale.id,
    image_operation: { contract_version: 1, id: 'upscale', upscale_factor: 4 },
  }))
  expect(latestImageRequest.body).not.toHaveProperty('prompt')
  const accessibility = await new AxeBuilder({ page }).include('.context-panel').analyze()
  expect(accessibility.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ))).toEqual([])
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({ path: resolve(EVIDENCE_DIRECTORY, 'image-operation-upscale-1440x900.png'), fullPage: true })
})

test('inpaint uses the existing explicit generation lifecycle with an exact immutable operation snapshot', async ({ page }) => {
  const state = createResourceMockState()
  const sourceBefore = JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing'))
  await openResourceWorkspace(page, state)
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/generation-capabilities').length).toBe(1)
  await expect.poll(() => state.requests.filter((request) => request.path === '/assets').length).toBe(1)
  await selectCanvasNode(page, '历史图片生成结果')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('option', { name: /局部重绘/ }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)

  const branch = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    (node.content as Record<string, unknown>).title === '局部重绘'
  ))!
  await page.getByRole('textbox', { name: '生成提示词' }).fill('将主体替换为飞鸟')
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)

  const request = state.requests.find((item) => item.path === '/api/image-generate')!
  const expectedOperation = createDefaultImageOperationContract('inpaint', operationCapabilities())
  expect(request.body).toEqual({
    project_id: RESOURCE_PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    client_request_id: expect.any(String),
    canvas_node_id: branch.id,
    prompt: '将主体替换为飞鸟',
    image_ids: ['asset-generated'],
    aspect_ratio: '4:3',
    image_operation: expectedOperation,
  })
  await expect.poll(() => state.quotas.image).toBe(3)
  const task = state.tasks.find((item) => item.canvas_node_id === branch.id)
  expect(task).toEqual(expect.objectContaining({
    status: 'succeeded',
    request_parameters: expect.objectContaining({ image_operation: expectedOperation, image_ids: ['asset-generated'] }),
  }))
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    node.node_type === 'result' && (node.content as Record<string, unknown>).source_task_id === task?.id
  )).length).toBe(1)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing'))).toBe(sourceBefore)
})

test('a failed provider image operation creates no result or quota charge and can explicitly retry the same branch', async ({ page }) => {
  const state = createResourceMockState()
  state.generationOutcome = 'failure'
  await openResourceWorkspace(page, state)
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/generation-capabilities').length).toBe(1)
  await expect.poll(() => state.requests.filter((request) => request.path === '/assets').length).toBe(1)
  await selectCanvasNode(page, '历史图片生成结果')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('option', { name: /主体抠图/ }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)

  const branch = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    (node.content as Record<string, unknown>).title === '主体抠图'
  ))!
  const expectedOperation = createDefaultImageOperationContract('cutout', operationCapabilities())
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  await expect(page.getByRole('button', { name: '开始图片生成' })).toBeEnabled()
  expect(state.quotas.image).toBe(4)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    node.node_type === 'result' && (node.content as Record<string, unknown>).source_task_id === 'task-failure'
  ))).toHaveLength(0)
  expect(state.requests.find((request) => request.path === '/api/image-generate')?.body).toEqual(expect.objectContaining({
    canvas_node_id: branch.id, image_operation: expectedOperation,
  }))

  state.generationOutcome = 'success'
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(2)
  await expect.poll(() => state.quotas.image).toBe(3)
  expect(state.requests.filter((request) => request.path === '/api/image-generate').map((request) => request.body)).toEqual([
    expect.objectContaining({ canvas_node_id: branch.id, image_operation: expectedOperation }),
    expect.objectContaining({ canvas_node_id: branch.id, image_operation: expectedOperation }),
  ])
})

test('fusion preserves selected source order and requires a manual prompt before one mock request', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  state.documents[FIRST_CANVAS_ID].nodes = state.documents[FIRST_CANVAS_ID].nodes.filter((node) => node.id !== 'result-earlier-variant')
  state.documents[FIRST_CANVAS_ID].connections = state.documents[FIRST_CANVAS_ID].connections.filter((connection) => connection.id !== 'connection-earlier-variant')
  await openResourceWorkspace(page, state)
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/generation-capabilities').length).toBe(1)
  await expect.poll(() => state.requests.filter((request) => request.path === '/assets').length).toBe(1)
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  if (!surfaceBox) throw new Error('Canvas surface is unavailable')
  await page.mouse.move(surfaceBox.x + 940, surfaceBox.y + 120)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x + 1320, surfaceBox.y + 750, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByRole('toolbar', { name: '2 个已选节点的操作' })).toBeVisible()
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette.getByRole('option', { name: /多图融合/ })).toBeVisible()
  await palette.getByRole('option', { name: /多图融合/ }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)

  const branch = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    (node.content as Record<string, unknown>).title === '多图融合'
  ))!
  await page.getByRole('textbox', { name: '生成提示词' }).fill('融合两个版本的天空与海岸')
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((request) => request.path === '/api/image-generate')?.body).toEqual({
    project_id: RESOURCE_PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    client_request_id: expect.any(String),
    canvas_node_id: branch.id,
    prompt: '融合两个版本的天空与海岸',
    image_ids: ['asset-generated', 'asset-second-origin'],
    aspect_ratio: '4:3',
    image_operation: createDefaultImageOperationContract('fusion', operationCapabilities()),
  })
})
