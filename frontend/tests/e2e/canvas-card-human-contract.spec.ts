import { expect, test } from '@playwright/test'
import { ref } from 'vue'
import { buildCanvasNodeInteraction } from '../../src/components/canvas/canvas-node-interaction'
import {
  resolveCanvasCardVideoWorkMode,
} from '../../src/components/canvas/canvas-card-work-model'
import {
  applyCanvasCardVideoReferenceBindings,
  type CanvasCardConfigurationSnapshot,
} from '../../src/modules/canvas/canvas-card-configuration'
import { buildCanvasCardViewModel } from '../../src/modules/canvas/canvas-card-view-model'
import { parseAudioGenerationCapabilities } from '../../src/modules/canvas/audio-generation'
import {
  createRegistryNodeDraft,
  getAuthoringNodeOptions,
  getCreatableNodeDefinitions,
} from '../../src/modules/canvas/node-registry'
import { createCanvasMutationActions } from '../../src/modules/canvas/mutations'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

function textNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'text-card',
    type: 'script',
    title: '旁白',
    x: 120,
    y: 80,
    width: 320,
    height: 180,
    content: '黄昏海岸，人物入画。',
    contentData: {
      subtype: 'prompt',
      serialization_version: 1,
      text: '黄昏海岸，人物入画。',
    },
    ...overrides,
  }
}

test('Human-confirmed authoring taxonomy is exactly six workflows and excludes utilities', () => {
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
  expect(getCreatableNodeDefinitions().map((definition) => definition.type)).toEqual([
    'script',
    'generation',
  ])
})

test('Video Composition and Audio Generation have distinct canonical card drafts', () => {
  expect(createRegistryNodeDraft('generation', 'video-composition', { x: 40, y: 60 }))
    .toEqual(expect.objectContaining({
      type: 'generation',
      title: '视频合成',
      contentData: expect.objectContaining({ subtype: 'video-composition' }),
    }))
  expect(createRegistryNodeDraft('generation', 'audio', { x: 80, y: 100 }))
    .toEqual(expect.objectContaining({
      type: 'generation',
      title: '音频生成',
      contentData: expect.objectContaining({ subtype: 'audio' }),
    }))
})

test('audio capability uses a backend-authoritative allowed-model list and unavailable is explicit', () => {
  expect(parseAudioGenerationCapabilities({
    contract_version: 2,
    execution_mode: 'unavailable',
    models: [],
    generation_modes: [],
    provider_generation_modes: [],
    audio_driven_video_modes: [],
    provider_audio_driven_video_modes: [],
    quota: { available: false, quota_type: null, unit_estimate: null },
    task: { available: false, cancel_supported: false, resume_supported: false },
  })).toEqual(expect.objectContaining({
    contract_version: 2,
    execution_mode: 'unavailable',
    models: [],
  }))
})

test('disconnecting an edge atomically removes only its canonical edge-backed reference', async () => {
  const source = textNode({ id: 'reference-node-a', type: 'asset', title: '图片 1' })
  const target = textNode({
    id: 'video-card',
    type: 'generation',
    title: '视频生成',
    contentData: {
      subtype: 'video',
      serialization_version: 1,
      card_configuration: {
        schema_version: 1,
        generation_mode: 'image-to-video',
        model_id: 'video-model-a',
        prompt_document: {
          schema_version: 1,
          segments: [
            { kind: 'text', text: '让 ' },
            { kind: 'reference', stable_id: 'reference-node-a', asset_id: 'asset-a' },
            { kind: 'text', text: ' 向镜头走来' },
          ],
        },
        references: [{
          stable_id: 'reference-node-a',
          asset_id: 'asset-a',
          display_name: '图片 1',
          thumbnail_url: '/uploads/asset-a.png',
          source_revision: 1,
          role: 'first-frame',
          order: 0,
        }],
      },
    },
  })
  const nodeState = ref<CanvasNode[]>([source, target])
  const connectionState = ref<CanvasConnection[]>([{
    id: 'edge-a',
    from: source.id,
    to: target.id,
    sourcePort: 'out',
    targetPort: 'media',
  }])
  const selectedNodeId = ref('')
  const selectedNodeIds = ref<string[]>([])
  let revisionCount = 0
  let autosaveCount = 0
  const actions = createCanvasMutationActions({
    activeProjectId: ref('project-a'),
    activeCanvasId: ref('canvas-a'),
    selectedNodeId,
    selectedNodeIds,
    nodes: nodeState,
    connections: connectionState,
    bumpDataRevision: () => { revisionCount += 1 },
    queueAutosave: () => { autosaveCount += 1 },
    updateNode: (nodeId, updater) => {
      nodeState.value = nodeState.value.map((node) => node.id === nodeId ? updater(node) : node)
    },
    findNodeById: (nodeId) => nodeState.value.find((node) => node.id === nodeId) ?? null,
    setSelection: (nodeIds, primaryNodeId) => {
      selectedNodeIds.value = nodeIds
      selectedNodeId.value = primaryNodeId ?? nodeIds.at(-1) ?? ''
    },
    selectConnection: () => undefined,
  })

  await actions.deleteConnection('edge-a')

  expect(connectionState.value).toEqual([])
  const disconnectedCard = buildCanvasCardViewModel(nodeState.value[1])
  expect(disconnectedCard.references).toEqual([])
  expect(disconnectedCard.configuration.promptDocument.segments).toEqual([
    { kind: 'text', text: '让  向镜头走来' },
  ])
  expect({ revisionCount, autosaveCount }).toEqual({ revisionCount: 1, autosaveCount: 1 })
})

test('selection alone does not enter direct editing', () => {
  expect(buildCanvasNodeInteraction(textNode(), {
    isReadOnly: false,
    isSelected: true,
  })).toEqual({ kind: 'static' })
})

test('running cards keep the card drag region available', () => {
  const card = buildCanvasCardViewModel(textNode(), {
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
  expect(card.state).toEqual(expect.objectContaining({ phase: 'running', canDrag: true }))
})

test('disconnecting an edge-backed video reference removes its inline token atomically', () => {
  const configuration: CanvasCardConfigurationSnapshot = {
    schemaVersion: 1,
    generationMode: 'image-to-video',
    modelId: 'video-model',
    promptDocument: {
      schemaVersion: 1,
      segments: [
        { kind: 'text', text: '让 ' },
        { kind: 'reference', stableId: 'source-a', assetId: 'asset-a' },
        { kind: 'text', text: ' 穿过海浪' },
      ],
    },
    references: [{
      stableId: 'source-a',
      assetId: 'asset-a',
      displayName: '图片 1',
      thumbnailUrl: '/uploads/a.png',
      sourceRevision: 3,
      role: 'first-frame',
      order: 0,
    }],
  }

  expect(applyCanvasCardVideoReferenceBindings(configuration, [])).toEqual({
    ...configuration,
    promptDocument: {
      schemaVersion: 1,
      segments: [
        { kind: 'text', text: '让  穿过海浪' },
      ],
    },
    references: [],
  })
})

test('explicit video mode remains authoritative across capability refresh inputs', () => {
  expect(resolveCanvasCardVideoWorkMode({
    persistedGenerationMode: 'image-to-video',
    referenceMode: 'keyframes',
    referenceRoles: ['first-frame', 'last-frame'],
  })).toBe('first-frame-video')
})
