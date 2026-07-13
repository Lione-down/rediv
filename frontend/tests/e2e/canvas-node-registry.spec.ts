import { expect, test } from '@playwright/test'
import {
  CANONICAL_NODE_TYPES,
  createRegistryNodeDraft,
  getLegacyGenerationQuotaType,
  getCreatableNodeDefinitions,
  getDefaultConnectionPorts,
  resolveNodeDefinition,
} from '../../src/modules/canvas/node-registry'

test('registry exposes complete metadata for the six canonical creation types', () => {
  expect(CANONICAL_NODE_TYPES).toEqual([
    'script', 'note', 'asset', 'generation', 'result', 'group',
  ])

  const definitions = getCreatableNodeDefinitions()
  expect(definitions.map((definition) => definition.type)).toEqual(CANONICAL_NODE_TYPES)
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
