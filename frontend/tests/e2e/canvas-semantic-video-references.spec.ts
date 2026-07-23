import { expect, test } from '@playwright/test'
import * as generationParameters from '../../src/modules/canvas/generation-parameters'
import {
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import type { GenerationCapabilities } from '../../src/modules/canvas/generation-parameters'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

type ResolveSemanticVideoReferenceOptions = (input: {
  videoNodeId: string
  nodes: readonly CanvasNode[]
  connections: readonly CanvasConnection[]
}) => Array<{
  nodeId: string
  assetId: string
  title: string
  thumbnail: string
  disambiguation: string
}>

type CreateSemanticVideoReferenceBinding = (input: {
  option: {
    nodeId: string
    assetId: string
    title: string
    thumbnail: string
    disambiguation: string
  }
  sourceRevision: string
  role: string
  instruction: string
  mustNotTransfer: string[]
  order: number
}) => Record<string, unknown>

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

function imageNode(id: string, assetId: string, title = '参考图'): CanvasNode {
  return {
    id,
    type: 'asset',
    title,
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: assetId,
      url: `https://media.revid.test/${assetId}.png`,
    },
  }
}

function edge(id: string, from: string, to: string, order: number): CanvasConnection {
  return {
    id,
    from,
    to,
    sourcePort: 'out',
    targetPort: 'media',
    active: true,
    metadata: { input_order: order },
  }
}

function semanticCapabilitiesPayload() {
  return {
    ...structuredClone(GENERATION_CAPABILITIES_V6),
    contract_version: 7,
    video: {
      ...structuredClone(GENERATION_CAPABILITIES_V6.video),
      reference_modes: [
        'text-to-video',
        'image-to-video',
        'keyframes',
        'semantic-multi-image',
      ],
      reference_roles: [
        'character',
        'scene',
        'prop',
        'wardrobe',
        'action',
        'style',
        'composition',
        'first-frame',
        'last-frame',
      ],
      semantic_reference_support: true,
      max_references: 9,
    },
  }
}

test('capability parser distinguishes semantic multi-image from legacy keyframes', () => {
  let capabilities: GenerationCapabilities
  try {
    capabilities = parseGenerationCapabilities(semanticCapabilitiesPayload())
  } catch (error) {
    throw new Error(
      `T6-007 RED [semantic-video-capability-contract-absent]: ${String(error)}`,
    )
  }

  expect(capabilities.video.reference_modes).toContain('semantic-multi-image')
  expect(capabilities.video.reference_roles).toEqual([
    'character',
    'scene',
    'prop',
    'wardrobe',
    'action',
    'style',
    'composition',
    'first-frame',
    'last-frame',
  ])
})

test('request context preserves stable semantic IDs revisions roles instructions exclusions and order', () => {
  const references = [
    imageNode('role-node', 'role-asset', '人物图'),
    imageNode('scene-node', 'scene-asset', '场景图'),
    imageNode('prop-node', 'prop-asset', '道具图'),
  ]
  const video: CanvasNode = {
    id: 'video-card',
    type: 'generation',
    title: '语义多图视频',
    x: 420,
    y: 0,
    width: 340,
    height: 220,
    contentData: {
      subtype: 'video',
      serialization_version: 1,
      generation_parameters: {
        schema_version: 1,
        video: {
          duration_seconds: 5,
          reference_bindings: references.map((reference, index) => ({
            node_id: reference.id,
            asset_id: reference.contentData?.asset_id,
            source_revision: String.fromCharCode(97 + index).repeat(64),
            role: ['character', 'scene', 'prop'][index],
            instruction: ['保持人物身份和服装', '使用室内环境和光线', '让人物手持该产品'][index],
            must_not_transfer: [['background'], ['identity'], ['style']][index],
            order: index,
          })),
        },
      },
    },
  }
  const capabilities = semanticCapabilitiesPayload() as unknown as GenerationCapabilities
  const resolved = resolveGenerationRequestContext(
    video,
    'video',
    [video, ...references],
    references.map((reference, index) => edge(`edge-${index}`, reference.id, video.id, index + 1)),
    capabilities,
  )

  expect(
    resolved.parameterError,
    'T6-007 RED [semantic-video-request-context-absent]: semantic bindings are still rejected or coerced',
  ).toBe('')
  expect(resolved.referenceMode).toBe('semantic-multi-image')
  expect(resolved.videoReferences).toEqual(
    (video.contentData?.generation_parameters as {
      video: { reference_bindings: unknown[] }
    }).video.reference_bindings,
  )
})

test('@ options list connected compatible images and keep bindings stable across duplicate-title rename', () => {
  const resolveOptions = requireContractFunction<ResolveSemanticVideoReferenceOptions>(
    generationParameters,
    'resolveSemanticVideoReferenceOptions',
    'T6-007 RED [semantic-video-at-options-absent]: connected-image @ options are not implemented',
  )
  const createBinding = requireContractFunction<CreateSemanticVideoReferenceBinding>(
    generationParameters,
    'createSemanticVideoReferenceBinding',
    'T6-007 RED [semantic-video-binding-absent]: stable semantic binding creation is not implemented',
  )
  const first = imageNode('image-a', 'asset-a')
  const second = imageNode('image-b', 'asset-b')
  const unconnected = imageNode('image-c', 'asset-c', '未连接')
  const video: CanvasNode = {
    id: 'video-card',
    type: 'generation',
    title: '视频',
    x: 420,
    y: 0,
    width: 340,
    height: 220,
    contentData: { subtype: 'video', serialization_version: 1 },
  }
  const connections = [
    edge('edge-a', first.id, video.id, 1),
    edge('edge-b', second.id, video.id, 2),
  ]

  const options = resolveOptions({
    videoNodeId: video.id,
    nodes: [first, second, unconnected, video],
    connections,
  })

  expect(options.map((option) => option.nodeId)).toEqual(['image-a', 'image-b'])
  expect(new Set(options.map((option) => option.disambiguation)).size).toBe(2)
  const binding = createBinding({
    option: options[0],
    sourceRevision: 'a'.repeat(64),
    role: 'character',
    instruction: '保持人物身份',
    mustNotTransfer: ['background'],
    order: 0,
  })
  first.title = '主角定妆照'
  expect(binding).toEqual({
    node_id: 'image-a',
    asset_id: 'asset-a',
    source_revision: 'a'.repeat(64),
    role: 'character',
    instruction: '保持人物身份',
    must_not_transfer: ['background'],
    order: 0,
  })
  expect(binding).not.toHaveProperty('title')
})
