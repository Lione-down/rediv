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
