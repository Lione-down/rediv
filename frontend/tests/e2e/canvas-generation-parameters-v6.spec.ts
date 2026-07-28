import { expect, test } from '@playwright/test'
import {
  parseGenerationCapabilities,
  replaceImageOperationParameters,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

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

test('legacy compatibility: v6 preserves output counts and keyframe-oriented video roles', () => {
  expect(capabilitiesV6.contract_version).toBe(6)
  expect(capabilitiesV6.image.output_counts).toEqual([1, 2, 3, 4])
  expect(capabilitiesV6.image.default_output_count).toBe(1)
  expect(capabilitiesV6.video.reference_roles).toEqual(['first-frame', 'last-frame', 'reference'])
  expect(capabilitiesV6.video.max_references).toBe(9)
  expect(capabilitiesV6.video.aspect_ratios).toEqual(['16:9', '9:16', '1:1', '4:3', '3:4'])
  expect(capabilitiesV6.video.default_aspect_ratio).toBe('16:9')
  expect(capabilitiesV6.video.aspect_ratio_dimensions['9:16']).toEqual({ width: 648, height: 1152 })

  const image = generationNode('image')
  expect(resolveGenerationRequestContext(image, 'image', [image], [], capabilitiesV6)).toMatchObject({
    outputCount: 1,
    parameters: { schema_version: 1, image: { aspect_ratio: '4:3', output_count: 1 } },
  })

  const reference = referenceNode('reference-a')
  const video = generationNode('video', {
    schema_version: 1,
    video: {
      duration_seconds: 5,
      reference_bindings: [
        { node_id: reference.id, asset_id: 'asset-reference-a', role: 'first-frame', order: 0 },
        { node_id: reference.id, asset_id: 'asset-reference-a', role: 'reference', order: 1 },
      ],
    },
  })
  const resolved = resolveGenerationRequestContext(
    video, 'video', [video, reference],
    [mediaConnection('edge-role-source', reference.id, video.id, 1)], capabilitiesV6,
  )
  expect(resolved).toMatchObject({
    parameterError: '', referenceMode: 'keyframes',
    aspectRatio: '16:9',
    imageIds: ['asset-reference-a', 'asset-reference-a'],
    videoReferences: [
      { node_id: reference.id, asset_id: 'asset-reference-a', role: 'first-frame', order: 0 },
      { node_id: reference.id, asset_id: 'asset-reference-a', role: 'reference', order: 1 },
    ],
  })
  expect(resolved.parameters).toEqual({
    schema_version: 1,
    video: {
      aspect_ratio: '16:9',
      duration_seconds: 5,
      reference_mode: 'keyframes',
      reference_bindings: resolved.videoReferences,
    },
  })

  const legacy = generationNode('video', {
    schema_version: 1,
    video: { duration_seconds: 5, reference_mode: 'image-to-video', primary_reference_node_id: reference.id },
  })
  expect(resolveGenerationRequestContext(
    legacy, 'video', [legacy, reference],
    [mediaConnection('edge-legacy-source', reference.id, legacy.id, 1)], capabilitiesV6,
  ).parameters).toEqual({
    schema_version: 1,
    video: {
      aspect_ratio: '16:9',
      duration_seconds: 5,
      reference_mode: 'image-to-video',
      reference_bindings: [
        { node_id: reference.id, asset_id: 'asset-reference-a', role: 'first-frame', order: 0 },
      ],
    },
  })

  const legacyDimensions = generationNode('video', {
    schema_version: 1,
    video: {
      aspect_ratio: '1152:768',
      duration_seconds: 18,
      reference_bindings: [],
    },
  })
  expect(resolveGenerationRequestContext(
    legacyDimensions, 'video', [legacyDimensions], [], capabilitiesV6,
  )).toMatchObject({
    aspectRatio: '16:9',
    durationSeconds: 18,
    parameterError: '',
    parameters: {
      video: { aspect_ratio: '16:9', duration_seconds: 18 },
    },
  })
})

test('v6 image requests retain the eight-source boundary and image operation edits preserve batch identity', () => {
  const image = generationNode('image', {
    schema_version: 1,
    image: {
      aspect_ratio: '4:3', output_count: 4,
      batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 2, slot_count: 4 },
    },
  })
  const references = Array.from({ length: 9 }, (_, index) => referenceNode(`image-reference-${index + 1}`))
  const resolved = resolveGenerationRequestContext(
    image, 'image', [image, ...references],
    references.map((reference, index) => mediaConnection(`edge-image-${index + 1}`, reference.id, image.id, index + 1)),
    capabilitiesV6,
  )
  expect(resolved.parameterError).toContain('最多允许 8 张')

  const operation = {
    contract_version: 1 as const, id: 'region' as const,
    region: {
      contract_version: 1 as const, coordinate_space: 'source-normalized' as const,
      x: 0.1, y: 0.2, width: 0.5, height: 0.5,
    },
  }
  expect(replaceImageOperationParameters({
    schema_version: 1,
    image: {
      aspect_ratio: '4:3', output_count: 4,
      batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 2, slot_count: 4 },
    },
  }, operation)).toEqual({
    schema_version: 1,
    image: {
      aspect_ratio: '4:3', output_count: 4,
      batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 2, slot_count: 4 }, operation,
    },
  })
})

test('canonical card references override stale provider bindings at the request boundary', () => {
  const first = referenceNode('reference-a')
  const second = referenceNode('reference-b')
  const video = generationNode('video', {
    schema_version: 1,
    video: {
      duration_seconds: 5,
      reference_bindings: [
        { node_id: first.id, asset_id: 'asset-reference-a', role: 'first-frame', order: 0 },
        { node_id: second.id, asset_id: 'asset-reference-b', role: 'last-frame', order: 1 },
      ],
    },
  })
  video.contentData = {
    ...video.contentData,
    card_configuration: {
      schema_version: 1,
      generation_mode: 'keyframes',
      model_id: 'video-model',
      references: [
        {
          stable_id: second.id, asset_id: 'asset-reference-b', display_name: second.title,
          thumbnail_url: 'https://media.revid.test/b.png', source_revision: 1,
          role: 'first-frame', order: 0,
        },
        {
          stable_id: first.id, asset_id: 'asset-reference-a', display_name: first.title,
          thumbnail_url: 'https://media.revid.test/a.png', source_revision: 1,
          role: 'last-frame', order: 1,
        },
      ],
    },
  }

  const resolved = resolveGenerationRequestContext(
    video,
    'video',
    [video, first, second],
    [
      mediaConnection('edge-a', first.id, video.id, 1),
      mediaConnection('edge-b', second.id, video.id, 2),
    ],
    capabilitiesV6,
  )

  expect(resolved.videoReferences).toEqual([
    { node_id: second.id, asset_id: 'asset-reference-b', role: 'first-frame', order: 0 },
    { node_id: first.id, asset_id: 'asset-reference-a', role: 'last-frame', order: 1 },
  ])
  expect(resolved.parameters).toEqual({
    schema_version: 1,
    video: {
      aspect_ratio: '16:9',
      duration_seconds: 5,
      reference_mode: 'keyframes',
      reference_bindings: resolved.videoReferences,
    },
  })
})
