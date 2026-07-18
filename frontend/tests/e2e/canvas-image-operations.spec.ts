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

test('generation capability v2 parses strict operations while legacy v1 fails closed only for operations', () => {
  const parsed = parseGenerationCapabilities(capabilityDocument(2))
  expect(parsed.contract_version).toBe(2)
  expect(parsed.image.operations).toEqual(operationCapabilities())

  const legacy = parseGenerationCapabilities(capabilityDocument(1))
  expect(legacy.contract_version).toBe(1)
  expect(legacy.image.operations).toBeNull()
  expect(legacy.image.default_aspect_ratio).toBe('4:3')
})

test('operation capability parser rejects unknown duplicate future and inconsistent declarations', () => {
  const invalid = [
    { ...capabilityDocument(2), contract_version: 3 },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), contract_version: 2 } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), supported_operations: ['region', 'unknown'] } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), supported_operations: ['region', 'region'] } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), supported_operations: ['region'], provider_operations: ['inpaint'] } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), provider_operations: ['region'] } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), max_fusion_images: 1 } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), upscale_factors: [2, 2] } } },
    { ...capabilityDocument(2), image: { ...capabilityDocument(2).image, operations: { ...operationCapabilities(), region_coordinate_space: 'pixels' } } },
  ]
  for (const value of invalid) expect(() => parseGenerationCapabilities(value)).toThrow('capability contract 无效')
})

test('a persisted provider operation fails closed when refreshed capabilities withdraw provider execution', () => {
  const capabilities = parseGenerationCapabilities({
    ...capabilityDocument(2),
    image: {
      ...capabilityDocument(2).image,
      operations: operationCapabilities({ provider_operations: ['expand'] }),
    },
  })
  const source = imageResult('drift-source')
  const branch = {
    id: 'generation-drift', type: 'generation' as const, title: '局部重绘',
    x: 560, y: 120, width: 340, height: 220, content: '替换天空',
    contentData: {
      subtype: 'image', serialization_version: 1,
      generation_parameters: {
        schema_version: 1,
        image: {
          aspect_ratio: '4:3',
          operation: createDefaultImageOperationContract('inpaint', operationCapabilities()),
        },
      },
    },
  }
  const context = resolveGenerationRequestContext(branch, 'image', [source, branch], [{
    id: 'edge-drift', from: source.id, to: branch.id, sourcePort: 'out', targetPort: 'media',
    status: 'active', active: true, metadata: { input_order: 1 },
  }], capabilities)
  expect(context.parameterError).toContain('不支持此图片操作')
})

test('image operation registry owns exact version source prompt and execution definitions', () => {
  expect(Object.values(IMAGE_OPERATIONS).map((operation) => ({
    id: operation.id,
    version: operation.version,
    execution: operation.execution,
    sourceCount: operation.sourceCount,
    requiresPrompt: operation.requiresPrompt,
    controls: operation.controls,
  }))).toEqual([
    { id: 'expand', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: true, controls: ['expansion'] },
    { id: 'inpaint', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: true, controls: ['region', 'mask'] },
    { id: 'erase', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: false, controls: ['region', 'mask'] },
    { id: 'cutout', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: false, controls: [] },
    { id: 'upscale', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: false, controls: ['upscale'] },
    { id: 'region', version: 1, execution: 'local', sourceCount: [1, 1], requiresPrompt: false, controls: ['region'] },
    { id: 'fusion', version: 1, execution: 'provider', sourceCount: [2, 8], requiresPrompt: true, controls: [] },
  ])
})

test('operation sources require exact supported current project-owned image results and preserve fusion order', () => {
  const first = imageResult('result-a')
  const second = imageResult('result-b', { x: 520 })
  const persistedIdle = imageResult('persisted-idle', { status: 'idle' })
  expect(resolveImageOperationSources(IMAGE_OPERATIONS.inpaint, sourceContext([first])))?.toEqual({
    nodes: [first], assets: [imageAsset('asset-result-a')],
  })
  expect(resolveImageOperationSources(IMAGE_OPERATIONS.fusion, sourceContext([second, first])))?.toEqual({
    nodes: [second, first], assets: [imageAsset('asset-result-b'), imageAsset('asset-result-a')],
  })
  expect(resolveImageOperationSources(IMAGE_OPERATIONS.region, sourceContext([persistedIdle]))).not.toBeNull()

  const invalidSingle = [
    sourceContext([]),
    sourceContext([first, second]),
    sourceContext([imageResult('locked', { isLocked: true })]),
    sourceContext([imageResult('grouped', { parentNodeId: 'group-a' })]),
    sourceContext([imageResult('video', { contentData: { ...first.contentData, subtype: 'video' } })]),
    sourceContext([imageResult('future', { contentData: { ...first.contentData, serialization_version: 2 } })]),
    sourceContext([first], { assets: [imageAsset('asset-result-a', { user_id: 'foreign-user' })] }),
    sourceContext([first], { assets: [imageAsset('asset-result-a', { project_id: 'foreign-project' })] }),
    sourceContext([first], { assets: [imageAsset('asset-result-a', { status: 'failed' })] }),
    sourceContext([first], { assets: [imageAsset('asset-result-a', { url: 'https://media.revid.test/stale.png' })] }),
    sourceContext([first], { capabilities: operationCapabilities({ supported_operations: ['region'], provider_operations: [] }) }),
  ]
  for (const context of invalidSingle) expect(resolveImageOperationSources(IMAGE_OPERATIONS.inpaint, context)).toBeNull()
  expect(resolveImageOperationSources(IMAGE_OPERATIONS.region, sourceContext([first], {
    capabilities: operationCapabilities({ supported_operations: ['region'], provider_operations: [] }),
  }))).not.toBeNull()

  expect(resolveImageOperationSources(IMAGE_OPERATIONS.fusion, sourceContext([first]))).toBeNull()
  expect(resolveImageOperationSources(IMAGE_OPERATIONS.fusion, sourceContext(Array.from({ length: 9 }, (_, index) => imageResult(`result-${index}`))))).toBeNull()
  expect(resolveImageOperationSources(IMAGE_OPERATIONS.fusion, sourceContext([first, first]))).toBeNull()
})

test('default operation contracts round-trip and malformed regions masks margins and factors fail closed', () => {
  const capabilities = operationCapabilities()
  const ids = Object.keys(IMAGE_OPERATIONS) as ImageOperationId[]
  for (const id of ids) {
    const contract = createDefaultImageOperationContract(id, capabilities)
    expect(parseImageOperationContract(contract, capabilities)).toEqual(contract)
  }

  const region = createDefaultImageOperationContract('inpaint', capabilities)
  const invalid = [
    { ...region, contract_version: 2 },
    { ...region, extra: true },
    { ...region, region: { ...region.region!, x: 0.75, width: 0.5 } },
    { ...region, region: { ...region.region!, width: 0 } },
    { ...region, mask: { ...region.mask!, feather: 1.1 } },
    { ...region, mask: { ...region.mask!, kind: 'asset' } },
    { ...createDefaultImageOperationContract('expand', capabilities), expansion: { contract_version: 1, top: 0, right: 0, bottom: 0, left: 0 } },
    { ...createDefaultImageOperationContract('upscale', capabilities), upscale_factor: 3 },
    { contract_version: 1, id: 'cutout', region: region.region },
  ]
  for (const value of invalid) expect(() => parseImageOperationContract(value, capabilities)).toThrow('图片操作 contract 无效')
})

test('single-source operations create one typed downstream branch and preserve the source exactly', () => {
  const capabilities = operationCapabilities()
  const source = imageResult('result-source')
  const before = JSON.stringify(source)
  const singleIds: ImageOperationId[] = ['expand', 'inpaint', 'erase', 'cutout', 'upscale', 'region']
  for (const id of singleIds) {
    const command = createImageOperationBranchCommand({
      capabilities,
      existingNodes: [source],
      operationId: id,
      selectedNodes: [source],
    })
    expect(command?.type).toBe('insert-graph')
    expect(command?.nodes).toHaveLength(1)
    expect(command?.connections).toHaveLength(1)
    const branch = command!.nodes[0]
    expect(branch.type).toBe('generation')
    expect(branch.contentData?.subtype).toBe('image')
    expect(branch.title).toBe(IMAGE_OPERATIONS[id].title)
    expect(branch.contentData?.generation_parameters).toEqual({
      schema_version: 1,
      image: {
        aspect_ratio: '4:3',
        operation: createDefaultImageOperationContract(id, capabilities),
      },
    })
    expect(command!.connections[0]).toEqual(expect.objectContaining({
      from: source.id,
      to: branch.id,
      targetPort: 'media',
      metadata: { input_order: 1 },
    }))
    expect(branch.contentData?.asset_id).toBeUndefined()
    expect(branch.contentData?.source_task_id).toBeUndefined()
    expect(JSON.stringify(source)).toBe(before)
  }
})

test('fusion creates exact ordered media edges for 2 and 8 unique results and rejects unsafe selections', () => {
  const capabilities = operationCapabilities()
  for (const count of [2, 8]) {
    const selected = Array.from({ length: count }, (_, index) => imageResult(`fusion-${count}-${index}`, { x: 80 + index * 24 }))
    const before = JSON.stringify(selected)
    const command = createImageOperationBranchCommand({
      capabilities,
      existingNodes: selected,
      operationId: 'fusion',
      selectedNodes: selected,
    })
    expect(command?.nodes).toHaveLength(1)
    expect(command?.connections).toHaveLength(count)
    expect(command?.connections.map((connection) => ({
      from: connection.from,
      order: connection.metadata?.input_order,
      targetPort: connection.targetPort,
    }))).toEqual(selected.map((node, index) => ({ from: node.id, order: index + 1, targetPort: 'media' })))
    expect(command?.nodes[0].contentData?.generation_parameters).toEqual({
      schema_version: 1,
      image: { aspect_ratio: '4:3', operation: createDefaultImageOperationContract('fusion', capabilities) },
    })
    expect(JSON.stringify(selected)).toBe(before)
  }

  const one = [imageResult('one')]
  const nine = Array.from({ length: 9 }, (_, index) => imageResult(`nine-${index}`))
  const duplicate = imageResult('duplicate')
  const invalid = [
    { operationId: 'fusion' as const, selectedNodes: one, capabilities },
    { operationId: 'fusion' as const, selectedNodes: nine, capabilities },
    { operationId: 'fusion' as const, selectedNodes: [duplicate, duplicate], capabilities },
    { operationId: 'inpaint' as const, selectedNodes: [imageResult('a'), imageResult('b')], capabilities },
    { operationId: 'cutout' as const, selectedNodes: [imageResult('video', { contentData: { subtype: 'video', serialization_version: 1 } })], capabilities },
    { operationId: 'upscale' as const, selectedNodes: [imageResult('locked', { isLocked: true })], capabilities },
    {
      operationId: 'inpaint' as const,
      selectedNodes: [imageResult('unsupported')],
      capabilities: operationCapabilities({ supported_operations: ['region'], provider_operations: [] }),
    },
  ]
  for (const candidate of invalid) {
    expect(createImageOperationBranchCommand({
      ...candidate,
      existingNodes: candidate.selectedNodes,
    })).toBeNull()
  }
})

test('professional Palette eligibility projects exact supported single and fusion operations', () => {
  const first = imageResult('palette-a')
  const second = imageResult('palette-b')
  const context = (selectedNodes: CanvasNode[], capabilities: ImageOperationCapabilities | null): ProfessionalCanvasActionContext => ({
    assets: selectedNodes.map((node) => imageAsset(String(node.contentData?.asset_id))),
    canvasId: 'canvas-image-operation',
    canvasReady: true,
    imageOperationCapabilities: capabilities,
    isBusy: false,
    isReadOnly: false,
    isWorkflowView: true,
    projectId: PROJECT_ID,
    selectedNodes,
    userId: USER_ID,
  })
  const eligibleIds = (candidate: ProfessionalCanvasActionContext) => resolveProfessionalCanvasActions(candidate)
    .filter((action) => action.eligibility.eligible && action.intent.type === 'create-image-operation')
    .map((action) => action.id)

  expect(eligibleIds(context([first], operationCapabilities()))).toEqual([
    'image-operation.expand', 'image-operation.inpaint', 'image-operation.erase',
    'image-operation.cutout', 'image-operation.upscale', 'image-operation.region',
  ])
  expect(eligibleIds(context([second, first], operationCapabilities()))).toEqual(['image-operation.fusion'])
  expect(eligibleIds(context([first], operationCapabilities({
    supported_operations: ['region'], provider_operations: [],
  })))).toEqual(['image-operation.region'])
  expect(eligibleIds(context([first], null))).toEqual([])
})

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
