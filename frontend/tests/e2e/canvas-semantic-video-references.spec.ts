import { expect, test } from '@playwright/test'
import {
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

function imageNode(id: string, assetId: string): CanvasNode {
  return {
    id,
    type: 'asset',
    title: 'Reference image',
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: assetId,
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

function officialCapabilitiesPayload() {
  const base = structuredClone(GENERATION_CAPABILITIES_V6)
  const ratios = base.video.aspect_ratios
  const imageRatios = base.image.aspect_ratios
  return {
    ...base,
    contract_version: 7,
    image: {
      ...base.image,
      sizes: ['1K'],
      default_size: '1K',
      size_dimensions: {
        '1K': Object.fromEntries(imageRatios.map((ratio) => [
          ratio,
          { width: 1024, height: 1024 },
        ])),
      },
    },
    video: {
      ...base.video,
      resolutions: ['480p', '720p', '1080p'],
      default_resolution: '720p',
      resolution_dimensions: Object.fromEntries(
        ['480p', '720p', '1080p'].map((resolution) => [
          resolution,
          Object.fromEntries(ratios.map((ratio) => [
            ratio,
            base.video.aspect_ratio_dimensions[ratio as keyof typeof base.video.aspect_ratio_dimensions],
          ])),
        ]),
      ),
      max_references: 8,
      negative_prompt_max_length: 2000,
      supports_semantic_multi_reference: false,
    },
  }
}

test('capability parser rejects semantic Video modes and roles', () => {
  const payload = officialCapabilitiesPayload() as Record<string, any>
  payload.video.reference_modes = [
    'text-to-video',
    'image-to-video',
    'keyframes',
    'semantic-multi-image',
  ]
  payload.video.reference_roles = [
    'character',
    'scene',
    'prop',
  ]
  payload.video.supports_semantic_multi_reference = true

  expect(() => parseGenerationCapabilities(payload)).toThrow()
})

test('semantic role instruction exclusion fields fail closed instead of becoming keyframes', () => {
  const first = imageNode('role-node', 'role-asset')
  const last = imageNode('scene-node', 'scene-asset')
  const video: CanvasNode = {
    id: 'video-card',
    type: 'generation',
    title: 'Provider-valid Video',
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
          reference_mode: 'keyframes',
          reference_bindings: [{
            node_id: first.id,
            asset_id: first.contentData?.asset_id,
            source_revision: 'a'.repeat(64),
            role: 'character',
            instruction: 'Preserve identity.',
            must_not_transfer: ['background'],
            order: 0,
          }, {
            node_id: last.id,
            asset_id: last.contentData?.asset_id,
            source_revision: 'b'.repeat(64),
            role: 'scene',
            instruction: 'Use the scene.',
            must_not_transfer: ['identity'],
            order: 1,
          }],
        },
      },
    },
  }
  const resolved = resolveGenerationRequestContext(
    video,
    'video',
    [video, first, last],
    [
      edge('edge-first', first.id, video.id, 1),
      edge('edge-last', last.id, video.id, 2),
    ],
    parseGenerationCapabilities(officialCapabilitiesPayload()),
  )

  expect(resolved.parameterError).not.toBe('')
  expect(resolved.videoReferences).toBeUndefined()
  expect(resolved.referenceMode).toBeUndefined()
})
