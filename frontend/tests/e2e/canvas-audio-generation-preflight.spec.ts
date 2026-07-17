import { expect, test } from '@playwright/test'
import {
  parseAudioGenerationCapabilities,
  preflightAudioGeneration,
} from '../../src/modules/canvas/audio-generation'
import { parseGenerationCapabilities } from '../../src/modules/canvas/generation-parameters'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'

const PROJECT_ID = 'project-audio-generation'
const CANVAS_ID = 'canvas-audio-generation'
const USER_ID = 'user-audio-generation'

function audioCapabilities(executionMode: 'mock-only' | 'unavailable') {
  return parseAudioGenerationCapabilities({
    contract_version: 1,
    execution_mode: executionMode,
    model: executionMode === 'mock-only' ? 'revid-audio-mock-v1' : null,
    generation_modes: executionMode === 'mock-only' ? ['text-to-audio'] : [],
    provider_generation_modes: [],
    audio_driven_video_modes: executionMode === 'mock-only' ? ['audio-driven-video'] : [],
    provider_audio_driven_video_modes: [],
    quota: { available: false, quota_type: null, unit_estimate: null },
    task: { available: false, cancel_supported: false, resume_supported: false },
  })
}

function asset(id: string, type: 'audio' | 'video', url: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id,
    user_id: USER_ID,
    project_id: PROJECT_ID,
    origin_canvas_id: CANVAS_ID,
    canvas_node_id: null,
    type,
    url,
    content_text: id,
    source: 'upload',
    source_model: null,
    source_task_id: null,
    status: 'active',
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function scriptNode(): CanvasNode {
  return {
    id: 'script-source', type: 'script', title: '旁白脚本', x: 0, y: 0, width: 320, height: 180,
    content: '海浪声逐渐靠近，温和女声旁白。', contentData: { subtype: 'script', serialization_version: 1 },
  }
}

function mediaNode(id: string, type: 'audio' | 'video', assetId: string, url: string): CanvasNode {
  return {
    id, type: 'asset', title: id, x: 0, y: 0, width: 320, height: 180,
    contentData: { subtype: type, serialization_version: 1, asset_id: assetId, project_id: PROJECT_ID, origin_canvas_id: CANVAS_ID, url },
  }
}

function preflight(overrides: Partial<Parameters<typeof preflightAudioGeneration>[0]> = {}) {
  const script = scriptNode()
  const audio = mediaNode('audio-source', 'audio', 'asset-audio', 'https://media.revid.test/narration.mp3')
  const video = mediaNode('video-source', 'video', 'asset-video', 'https://media.revid.test/clip.mp4')
  return preflightAudioGeneration({
    assets: [
      asset('asset-audio', 'audio', 'https://media.revid.test/narration.mp3'),
      asset('asset-video', 'video', 'https://media.revid.test/clip.mp4'),
    ],
    capabilities: audioCapabilities('unavailable'),
    canvasId: CANVAS_ID,
    intent: 'text-to-audio',
    nodes: [script, audio, video],
    projectId: PROJECT_ID,
    selectedNodeIds: [script.id],
    userId: USER_ID,
    ...overrides,
  })
}

test('audio capability/preflight is versioned, mock-only when synthetic, and production fail-closed', () => {
  const unavailable = audioCapabilities('unavailable')
  expect(unavailable).toMatchObject({ execution_mode: 'unavailable', generation_modes: [], quota: { available: false }, task: { available: false } })
  const aggregate = parseGenerationCapabilities({ ...GENERATION_CAPABILITIES, contract_version: 4, audio: unavailable })
  expect(aggregate).toMatchObject({ contract_version: 4, audio: { execution_mode: 'unavailable', provider_generation_modes: [] } })
  const unavailablePlan = preflight()
  expect(unavailablePlan).toMatchObject({
    contract_version: 1, executable: false, intent: 'text-to-audio', execution_mode: 'unavailable',
    quota: { available: false }, task: { available: false }, errors: [{ code: 'capability_unavailable' }],
  })

  const mockPlan = preflight({ capabilities: audioCapabilities('mock-only') })
  expect(mockPlan).toMatchObject({ executable: true, execution_mode: 'mock-only', intent: 'text-to-audio' })
  expect(mockPlan.sources.map((source) => source.role)).toEqual(['prompt'])
})

test('audio-driven video preserves source roles and fails closed for ownership or selection drift', () => {
  const mock = audioCapabilities('mock-only')
  const plan = preflight({
    capabilities: mock,
    intent: 'audio-driven-video',
    selectedNodeIds: ['video-source', 'audio-source'],
  })
  expect(plan).toMatchObject({ executable: true, intent: 'audio-driven-video', execution_mode: 'mock-only' })
  expect(plan.sources.map((source) => [source.role, source.node_id, source.asset_id])).toEqual([
    ['audio', 'audio-source', 'asset-audio'],
    ['video', 'video-source', 'asset-video'],
  ])

  expect(preflight({ capabilities: mock, intent: 'audio-driven-video', selectedNodeIds: ['audio-source'] }).errors[0]?.code).toBe('invalid_source_count')
  expect(preflight({ capabilities: mock, intent: 'audio-driven-video', selectedNodeIds: ['audio-source', 'audio-source'] }).errors[0]?.code).toBe('duplicate_selection')
  expect(preflight({
    capabilities: mock,
    intent: 'audio-driven-video',
    selectedNodeIds: ['audio-source', 'video-source'],
    assets: [asset('asset-audio', 'audio', 'https://media.revid.test/narration.mp3', { user_id: 'foreign-user' })],
  }).errors[0]?.code).toBe('asset_not_owned')
})
