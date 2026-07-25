import { expect, test } from '@playwright/test'
import {
  CANONICAL_NODE_TYPES,
  createRegistryNodeDraft,
  getAuthoringConnectionPorts,
  getGenerationMediaType,
  getLegacyGenerationQuotaType,
  getCreatableNodeDefinitions,
  getDefaultConnectionPorts,
  resolveVisibleAcquisitionConnectionPorts,
  resolveNodeDefinition,
} from '../../src/modules/canvas/node-registry'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import { toCanvasDocumentNodeUpsert } from '../../src/modules/canvas/node-serialization'

test('registry retains six canonical storage types but exposes only authoring creation types', () => {
  expect(CANONICAL_NODE_TYPES).toEqual([
    'script', 'note', 'asset', 'generation', 'result', 'group',
  ])

  const definitions = getCreatableNodeDefinitions()
  expect(definitions.map((definition) => definition.type)).toEqual([
    'script', 'generation',
  ])
  for (const definition of definitions) {
    expect(definition.kind).toBe('canonical')
    expect(definition.subtypes.length).toBeGreaterThan(0)
    expect(definition.defaultSize.width).toBeGreaterThanOrEqual(50)
    expect(definition.defaultSize.height).toBeGreaterThanOrEqual(50)
    expect(definition.icon).not.toBe('')
    expect(definition.capabilities).toEqual(expect.objectContaining({
      canEditContent: expect.any(Boolean),
      canGenerate: expect.any(Boolean),
      canPreviewMedia: expect.any(Boolean),
      canReferenceAsset: expect.any(Boolean),
      canContainChildren: expect.any(Boolean),
    }))
    expect(definition.serializationVersion).toBe(1)
  }
})

test('generation task state round-trips through canonical content and restores UI status', () => {
  const persisted = toCanvasDocumentNodeUpsert({
    id: 'generation-state', type: 'generation', title: '封面生成', x: 80, y: 120,
    width: 340, height: 220, status: 'success', content: '海边封面',
    contentData: {
      subtype: 'image', serialization_version: 1,
      generation_status: 'succeeded', generation_task_id: 'task-state',
    },
  })

  expect(persisted.content).toEqual(expect.objectContaining({
    generation_status: 'succeeded',
    generation_task_id: 'task-state',
  }))
  const restored = mapCanvasNode(persisted)
  expect(restored.status).toBe('success')
  expect(restored.contentData).toEqual(expect.objectContaining({
    generation_status: 'succeeded',
    generation_task_id: 'task-state',
  }))
})

test('legacy types resolve through compatibility definitions but stay out of creation menus', () => {
  expect(resolveNodeDefinition('text', {}).kind).toBe('compatibility')
  expect(resolveNodeDefinition('image', {}).kind).toBe('compatibility')
  expect(getCreatableNodeDefinitions().some((definition) => definition.type === 'text')).toBe(false)

  const legacyResult = resolveNodeDefinition('result', {})
  expect(legacyResult.kind).toBe('compatibility')
  expect(resolveNodeDefinition('result', { subtype: 'image' }).kind).toBe('compatibility')
  const legacyGroup = resolveNodeDefinition('group', { subtype: 'scene', legacy_payload: true })
  expect(legacyGroup.kind).toBe('compatibility')
  expect(legacyGroup.capabilities.canContainChildren).toBe(true)
  expect(getDefaultConnectionPorts(
    { type: 'text' },
    { type: 'result', contentData: { subtype: 'image' } },
  )).toEqual({ sourcePort: 'out', targetPort: 'in' })
  expect(resolveNodeDefinition('result', {
    subtype: 'image', serialization_version: 1,
  }).kind).toBe('canonical')
  expect(resolveNodeDefinition('group', {
    subtype: 'group', serialization_version: 1,
  }).kind).toBe('canonical')
  expect(getDefaultConnectionPorts(
    { type: 'script', contentData: { subtype: 'script', serialization_version: 1 } },
    { type: 'result', contentData: { subtype: 'image', serialization_version: 1 } },
  )).toBeNull()
})

test('unknown type or future serialization version resolves to a non-editing unsupported state', () => {
  expect(resolveNodeDefinition('future-storyboard', { payload: true })).toEqual(expect.objectContaining({
    kind: 'unsupported',
    type: 'future-storyboard',
    reason: 'unknown-type',
    ports: [],
    capabilities: expect.objectContaining({
      canEditContent: false,
      canGenerate: false,
      canReferenceAsset: false,
    }),
  }))
  expect(resolveNodeDefinition('script', { serialization_version: 2 })).toEqual(expect.objectContaining({
    kind: 'unsupported',
    type: 'script',
    reason: 'serialization-version',
  }))
  expect(getLegacyGenerationQuotaType({
    type: 'image', contentData: { serialization_version: 2 },
  })).toBeNull()
})

test('legacy generation compatibility is capability-gated by the registry', () => {
  expect(getLegacyGenerationQuotaType({ type: 'image' })).toBe('image')
  expect(getLegacyGenerationQuotaType({ type: 'model' })).toBe('image')
  expect(getLegacyGenerationQuotaType({ type: 'video' })).toBe('video')
  expect(getLegacyGenerationQuotaType({ type: 'text' })).toBeNull()
})

test('canonical generation subtypes resolve to their media quota', () => {
  expect(getGenerationMediaType({
    type: 'generation', contentData: { subtype: 'image', serialization_version: 1 },
  })).toBe('image')
  expect(getGenerationMediaType({
    type: 'generation', contentData: { subtype: 'video', serialization_version: 1 },
  })).toBe('video')
  expect(getGenerationMediaType({
    type: 'generation', contentData: { subtype: 'audio', serialization_version: 1 },
  })).toBeNull()
})

test('registry creates subtype-aware drafts and owns compatible default ports', () => {
  expect(createRegistryNodeDraft('asset', 'audio', { x: 120, y: -80 })).toEqual(expect.objectContaining({
    type: 'asset',
    title: '音频素材',
    x: 120,
    y: -80,
    width: 320,
    height: 240,
    contentData: { subtype: 'audio', serialization_version: 1 },
  }))
  expect(getDefaultConnectionPorts(
    { type: 'script', contentData: { subtype: 'script', serialization_version: 1 } },
    { type: 'generation', contentData: { subtype: 'video', serialization_version: 1 } },
  )).toEqual({ sourcePort: 'out', targetPort: 'prompt' })
  expect(getDefaultConnectionPorts(
    { type: 'asset', contentData: { subtype: 'image', serialization_version: 1 } },
    { type: 'generation', contentData: { subtype: 'video', serialization_version: 1 } },
  )).toEqual({ sourcePort: 'out', targetPort: 'media' })
  for (const legacyType of ['image', 'video', 'model']) {
    expect(getDefaultConnectionPorts(
      { type: legacyType },
      { type: 'generation', contentData: { subtype: 'video', serialization_version: 1 } },
    )).toEqual({ sourcePort: 'out', targetPort: 'media' })
  }
  expect(getDefaultConnectionPorts(
    { type: 'note', contentData: { subtype: 'annotation', serialization_version: 1 } },
    { type: 'generation', contentData: { subtype: 'video', serialization_version: 1 } },
  )).toBeNull()
})

test('authoring compatibility accepts only consumable image generation references while structural reading stays lossless', () => {
  const target = { type: 'generation', contentData: { subtype: 'video', serialization_version: 1 } }
  for (const source of [
    { type: 'asset', contentData: { subtype: 'image', serialization_version: 1 } },
    { type: 'result', contentData: { subtype: 'image', serialization_version: 1 } },
    { type: 'image' },
  ]) expect(getAuthoringConnectionPorts(source, target)).toEqual({ sourcePort: 'out', targetPort: 'media' })

  for (const source of [
    { type: 'asset', contentData: { subtype: 'video', serialization_version: 1 } },
    { type: 'asset', contentData: { subtype: 'audio', serialization_version: 1 } },
    { type: 'result', contentData: { subtype: 'video', serialization_version: 1 } },
    { type: 'result', contentData: { subtype: 'text', serialization_version: 1 } },
    { type: 'generation', contentData: { subtype: 'image', serialization_version: 1 } },
  ]) {
    expect(getDefaultConnectionPorts(source, target)).toEqual({ sourcePort: 'out', targetPort: 'media' })
    expect(getAuthoringConnectionPorts(source, target)).toBeNull()
  }
})

test('one visible acquisition resolves exactly one compatible logical pair and fails closed otherwise', () => {
  const videoGeneration = {
    type: 'generation',
    contentData: { subtype: 'video', serialization_version: 1 },
  }
  expect(resolveVisibleAcquisitionConnectionPorts(
    { type: 'script', contentData: { subtype: 'script', serialization_version: 1 } },
    videoGeneration,
  )).toEqual({ sourcePort: 'out', targetPort: 'prompt' })
  expect(resolveVisibleAcquisitionConnectionPorts(
    { type: 'asset', contentData: { subtype: 'image', serialization_version: 1 } },
    videoGeneration,
  )).toEqual({ sourcePort: 'out', targetPort: 'media' })
  expect(resolveVisibleAcquisitionConnectionPorts(
    { type: 'asset', contentData: { subtype: 'video', serialization_version: 1 } },
    videoGeneration,
  )).toBeNull()
  expect(resolveVisibleAcquisitionConnectionPorts(
    { type: 'future-node', contentData: {} },
    videoGeneration,
  )).toBeNull()
})
