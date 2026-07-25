import { expect, test } from '@playwright/test'
import {
  buildCanvasCardViewModel,
  resolveCanvasCardReferenceDisplayTitle,
} from '../../src/modules/canvas/canvas-card-view-model'
import {
  applyCanvasCardConfiguration,
  applyCanvasCardVideoReferenceBindings,
  serializeCanvasCardConfiguration,
} from '../../src/modules/canvas/canvas-card-configuration'
import {
  getAuthoringNodeOptions,
  getCreatableNodeDefinitions,
  resolveNodeDefinition,
} from '../../src/modules/canvas/node-registry'
import { resolveCanvasCardProductionInteractionState } from '../../src/components/canvas/canvas-card-production-state'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import type { CanvasNode } from '../../src/types/canvas'

function node(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'node-card',
    type: 'generation',
    title: '视频生成',
    x: 120,
    y: 80,
    width: 340,
    height: 220,
    content: '',
    contentData: {
      subtype: 'video',
      serialization_version: 1,
    },
    ...overrides,
  }
}

test('authoring taxonomy excludes generated results and structural groups', () => {
  const definitions = getCreatableNodeDefinitions()
  expect(definitions.map((definition) => definition.type)).toEqual([
    'script',
    'generation',
  ])
  expect(resolveNodeDefinition('script', { subtype: 'prompt', serialization_version: 1 }).label).toBe('文本')
  expect(resolveNodeDefinition('script', { subtype: 'script', serialization_version: 1 }).label).toBe('脚本')
  expect(resolveNodeDefinition('generation', { subtype: 'image', serialization_version: 1 }).label).toBe('图片生成')
  expect(resolveNodeDefinition('generation', { subtype: 'video', serialization_version: 1 }).label).toBe('视频生成')
  expect(resolveNodeDefinition('asset', { subtype: 'image', serialization_version: 1 }).label).toBe('素材')
})

test('authoring catalog exposes exactly the six Human-confirmed Add choices', () => {
  expect(getAuthoringNodeOptions()).toEqual([
    { id: 'text', label: '文本', type: 'script', subtype: 'prompt', availability: 'enabled' },
    { id: 'script', label: '脚本', type: 'script', subtype: 'script', availability: 'enabled' },
    { id: 'image-generation', label: '图片生成', type: 'generation', subtype: 'image', availability: 'enabled' },
    { id: 'video-generation', label: '视频生成', type: 'generation', subtype: 'video', availability: 'enabled' },
    { id: 'video-composition', label: '视频合成', type: 'generation', subtype: 'video-composition', availability: 'enabled' },
    {
      id: 'audio-generation',
      label: '音频生成',
      type: 'generation',
      subtype: 'audio',
      availability: 'disabled',
      unavailableReason: '当前没有兼容的音频生成模型',
    },
  ])
})

test('canonical card view model preserves explicit mode model and structured inline references', () => {
  const card = node({
    contentData: {
      subtype: 'video',
      serialization_version: 1,
      card_configuration: {
        schema_version: 1,
        generation_mode: 'image-to-video',
        model_id: 'video-model-explicit',
        prompt_document: {
          schema_version: 1,
          segments: [
            { kind: 'text', text: '人物奔跑 ' },
            { kind: 'reference', stable_id: 'reference-node-a', asset_id: 'asset-a' },
            { kind: 'text', text: ' 穿过海浪' },
          ],
        },
        references: [{
          stable_id: 'reference-node-a',
          asset_id: 'asset-a',
          display_name: '海边人物',
          thumbnail_url: '/uploads/thumb-a.png',
          source_revision: 7,
          role: 'first-frame',
          order: 0,
        }],
      },
    },
  })

  const viewModel = buildCanvasCardViewModel(card)
  expect(viewModel).toEqual(expect.objectContaining({
    configuration: {
      schemaVersion: 1,
      generationMode: 'image-to-video',
      modelId: 'video-model-explicit',
      promptDocument: {
        schemaVersion: 1,
        segments: [
          { kind: 'text', text: '人物奔跑 ' },
          { kind: 'reference', stableId: 'reference-node-a', assetId: 'asset-a' },
          { kind: 'text', text: ' 穿过海浪' },
        ],
      },
    },
    references: [{
      stableId: 'reference-node-a',
      assetId: 'asset-a',
      displayName: '海边人物',
      thumbnailUrl: '/uploads/thumb-a.png',
      sourceRevision: 7,
      role: 'first-frame',
      order: 0,
    }],
  }))
})

test('card configuration adapter serializes and restores ordered structured references', () => {
  const configuration = {
    schemaVersion: 1 as const,
    generationMode: 'image-to-video',
    modelId: 'video-model-explicit',
    promptDocument: {
      schemaVersion: 1 as const,
      segments: [
        { kind: 'text' as const, text: '人物奔跑 ' },
        { kind: 'reference' as const, stableId: 'reference-node-a', assetId: 'asset-a' },
        { kind: 'text' as const, text: ' 穿过海浪' },
      ],
    },
    references: [{
      stableId: 'reference-node-a',
      assetId: 'asset-a',
      displayName: '海边人物',
      thumbnailUrl: '/uploads/thumb-a.png',
      sourceRevision: 7,
      role: 'first-frame',
      order: 0,
    }],
  }
  expect(serializeCanvasCardConfiguration(configuration)).toEqual({
    schema_version: 1,
    generation_mode: 'image-to-video',
    model_id: 'video-model-explicit',
    prompt_document: {
      schema_version: 1,
      segments: [
        { kind: 'text', text: '人物奔跑 ' },
        { kind: 'reference', stable_id: 'reference-node-a', asset_id: 'asset-a' },
        { kind: 'text', text: ' 穿过海浪' },
      ],
    },
    references: [{
      stable_id: 'reference-node-a',
      asset_id: 'asset-a',
      display_name: '海边人物',
      thumbnail_url: '/uploads/thumb-a.png',
      source_revision: 7,
      role: 'first-frame',
      order: 0,
    }],
  })

  const restored = buildCanvasCardViewModel(applyCanvasCardConfiguration(node(), configuration))
  expect(restored.configuration).toEqual({
    schemaVersion: 1,
    generationMode: 'image-to-video',
    modelId: 'video-model-explicit',
    promptDocument: configuration.promptDocument,
  })
  expect(restored.references).toEqual(configuration.references)
})

test('prompt text and inline document persist through one atomic card command', async () => {
  const fixture = [node()]
  const updates: Array<Partial<Omit<CanvasNode, 'id'>>> = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => fixture,
    getConnections: () => [],
    createNode: async () => { throw new Error('not expected') },
    createConnection: async () => { throw new Error('not expected') },
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    updateConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, update) => {
      updates.push(structuredClone(update))
      Object.assign(fixture.find((candidate) => candidate.id === nodeId)!, structuredClone(update))
    },
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
  const promptDocument = {
    schemaVersion: 1 as const,
    segments: [
      { kind: 'text' as const, text: '人物奔跑 ' },
      { kind: 'reference' as const, stableId: 'reference-node-a', assetId: 'asset-a' },
      { kind: 'text' as const, text: ' 穿过海浪' },
    ],
  }
  await executor.executeCommand({
    source: 'accessibility',
    command: {
      type: 'set-card-configuration',
      nodeId: 'node-card',
      content: '人物奔跑  穿过海浪',
      configuration: {
        schemaVersion: 1,
        generationMode: 'image-to-video',
        modelId: 'video-model-explicit',
        promptDocument,
        references: [{
          stableId: 'reference-node-a',
          assetId: 'asset-a',
          displayName: '海边人物',
          thumbnailUrl: '/uploads/thumb-a.png',
          sourceRevision: 7,
          role: 'reference',
          order: 0,
        }],
      },
    },
  })

  expect(updates).toHaveLength(1)
  expect(updates[0]).toEqual(expect.objectContaining({
    content: '人物奔跑  穿过海浪',
    contentData: expect.objectContaining({
      text: '人物奔跑  穿过海浪',
      card_configuration: expect.objectContaining({
        prompt_document: {
          schema_version: 1,
          segments: [
            { kind: 'text', text: '人物奔跑 ' },
            { kind: 'reference', stable_id: 'reference-node-a', asset_id: 'asset-a' },
            { kind: 'text', text: ' 穿过海浪' },
          ],
        },
      }),
    }),
  }))
})

test('duplicate reference names remain clean display names because identity is structured', () => {
  const first = node({ id: 'reference-a', title: '角色 A', type: 'asset' })
  const second = node({ id: 'reference-b', title: '角色 A', type: 'asset' })

  expect(resolveCanvasCardReferenceDisplayTitle(first, [first, second])).toBe('角色 A')
  expect(resolveCanvasCardReferenceDisplayTitle(second, [first, second])).toBe('角色 A')
})

test('canonical state machine exposes one explicit phase for each card state', () => {
  const idle = buildCanvasCardViewModel(node())
  const selected = buildCanvasCardViewModel(node(), { isSelected: true })
  const editing = buildCanvasCardViewModel(
    node(),
    { isSelected: true, interactionState: 'editing' } as never,
  )
  const running = buildCanvasCardViewModel(node(), {
    isSelected: true,
    runtimePresentation: {
      key: 'job-a:running:1',
      source: 'job',
      phase: 'running',
      label: '生成中',
      tone: 'progress',
      progressPercent: 40,
      isIndeterminate: false,
      isTerminal: false,
      task: null,
    },
  })

  expect(idle).toEqual(expect.objectContaining({ state: { phase: 'idle', canDrag: true } }))
  expect(selected).toEqual(expect.objectContaining({ state: { phase: 'selected', canDrag: true } }))
  expect(editing).toEqual(expect.objectContaining({ state: { phase: 'editing', canDrag: true } }))
  expect(running).toEqual(expect.objectContaining({ state: { phase: 'running', canDrag: true } }))
})

test('production editors and attached composers project into the canonical card state machine', () => {
  expect(resolveCanvasCardProductionInteractionState({
    hasInlineEditor: true,
    hasAttachedComposer: false,
    isSubmitting: false,
  })).toBe('editing')
  expect(resolveCanvasCardProductionInteractionState({
    hasInlineEditor: false,
    hasAttachedComposer: true,
    isSubmitting: false,
  })).toBe('composing')
  expect(resolveCanvasCardProductionInteractionState({
    hasInlineEditor: true,
    hasAttachedComposer: true,
    isSubmitting: true,
  })).toBe('submitting')
})

test('video role and order edits update the canonical reference model atomically', () => {
  const configuration = {
    schemaVersion: 1 as const,
    generationMode: 'keyframes',
    modelId: 'video-model',
    promptDocument: { schemaVersion: 1 as const, segments: [] },
    references: [
      {
        stableId: 'reference-a', assetId: 'asset-a', displayName: 'A',
        thumbnailUrl: 'https://media.revid.test/a.png', sourceRevision: 1,
        role: 'first-frame', order: 0,
      },
      {
        stableId: 'reference-b', assetId: 'asset-b', displayName: 'B',
        thumbnailUrl: 'https://media.revid.test/b.png', sourceRevision: 2,
        role: 'last-frame', order: 1,
      },
    ],
  }

  expect(applyCanvasCardVideoReferenceBindings(configuration, [
    { node_id: 'reference-b', asset_id: 'asset-b', role: 'first-frame', order: 0 },
    { node_id: 'reference-a', asset_id: 'asset-a', role: 'last-frame', order: 1 },
  ])).toEqual({
    ...configuration,
    references: [
      expect.objectContaining({ stableId: 'reference-b', role: 'first-frame', order: 0 }),
      expect.objectContaining({ stableId: 'reference-a', role: 'last-frame', order: 1 }),
    ],
  })
})

test('asset and generated result ownership expose truthful editability', () => {
  const asset = buildCanvasCardViewModel(node({
    id: 'asset-a',
    type: 'asset',
    title: '角色素材',
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'asset-a',
      url: '/uploads/asset-a.png',
    },
  }))
  const result = buildCanvasCardViewModel(node({
    id: 'result-a',
    type: 'result',
    title: '生成结果',
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'asset-result',
      source_job_id: 'job-a',
      url: '/uploads/result-a.png',
    },
  }))

  expect(asset).toEqual(expect.objectContaining({
    ownership: 'project-asset',
    editability: { title: true, body: false, configuration: false },
  }))
  expect(result).toEqual(expect.objectContaining({
    ownership: 'generated-result',
    editability: { title: true, body: false, configuration: false },
  }))
})
