import { expect, test } from '@playwright/test'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import type { GenerationRuntimePresentation } from '../../src/modules/canvas/generation-runtime-presentation'
import { projectCanvasStoryboard } from '../../src/modules/canvas/storyboard-projection'

function node(
  id: string,
  type: string,
  x: number,
  y: number,
  contentData: Record<string, unknown> = {},
  overrides: Partial<CanvasNode> = {},
): CanvasNode {
  return {
    id,
    type,
    title: overrides.title ?? id,
    x,
    y,
    width: overrides.width ?? 320,
    height: overrides.height ?? 200,
    parentNodeId: overrides.parentNodeId ?? null,
    isLocked: overrides.isLocked ?? false,
    status: overrides.status ?? 'idle',
    contentData,
    ...overrides,
  }
}

function runtime(
  nodeId: string,
  phase: GenerationRuntimePresentation['phase'],
): GenerationRuntimePresentation {
  const isTerminal = phase === 'succeeded' || phase === 'failed' || phase === 'timed_out'
  return {
    key: `${nodeId}:${phase}`,
    nodeId,
    phase,
    label: phase,
    tone: phase === 'succeeded' ? 'success' : isTerminal ? 'danger' : 'progress',
    source: 'local',
    taskId: null,
    task: null,
    isTerminal,
    progressPercent: null,
    progressStage: null,
    isIndeterminate: !isTerminal,
  }
}

test('storyboard projection classifies canonical and compatibility nodes with truthful runtime and media states', () => {
  const nodes: CanvasNode[] = [
    node('script', 'script', 40, 20, { subtype: 'script', serialization_version: 1 }),
    node('note', 'note', 220, 20, { subtype: 'annotation', serialization_version: 1 }),
    node('legacy-text', 'text', 400, 20),
    node('text-result', 'result', 580, 20, { subtype: 'text', serialization_version: 1 }, { status: 'success' }),
    node('image-asset', 'asset', 40, 240, { subtype: 'image', serialization_version: 1, url: '/image.png' }),
    node('legacy-image', 'image', 220, 240, { url: '/legacy-image.png' }),
    node('image-generation', 'generation', 400, 240, { subtype: 'image', serialization_version: 1 }),
    node('image-result', 'result', 580, 240, { subtype: 'image', serialization_version: 1, url: '/result.png' }, { status: 'success' }),
    node('image-unavailable', 'result', 760, 240, { subtype: 'image', serialization_version: 1 }, { status: 'warning' }),
    node('image-broken', 'result', 940, 240, { subtype: 'image', serialization_version: 1, url: '/broken.png' }, { status: 'warning' }),
    node('video-asset', 'asset', 40, 480, { subtype: 'video', serialization_version: 1, url: '/video.mp4' }),
    node('legacy-video', 'video', 220, 480, { url: '/legacy-video.mp4' }),
    node('video-generation', 'generation', 400, 480, { subtype: 'video', serialization_version: 1, generation_status: 'failed' }),
    node('video-result', 'result', 580, 480, { subtype: 'video', serialization_version: 1, url: '/result.mp4' }, { status: 'success' }),
    node('audio', 'asset', 760, 480, { subtype: 'audio', serialization_version: 1, url: '/audio.mp3' }),
    node('future', 'future-storyboard', 940, 480, { serialization_version: 1 }),
  ]
  const runtimePresentations = new Map([
    ['image-generation', runtime('image-generation', 'running')],
  ])

  const items = projectCanvasStoryboard({ nodes, connections: [], runtimePresentations })

  expect(items.map((item) => [item.lane, item.nodeId, item.status, item.order])).toEqual([
    ['text', 'script', 'draft', 1],
    ['text', 'note', 'draft', 2],
    ['text', 'legacy-text', 'draft', 3],
    ['text', 'text-result', 'succeeded', 4],
    ['image', 'image-asset', 'succeeded', 1],
    ['image', 'legacy-image', 'succeeded', 2],
    ['image', 'image-generation', 'running', 3],
    ['image', 'image-result', 'succeeded', 4],
    ['image', 'image-unavailable', 'unavailable', 5],
    ['image', 'image-broken', 'failed', 6],
    ['video', 'video-asset', 'succeeded', 1],
    ['video', 'legacy-video', 'succeeded', 2],
    ['video', 'video-generation', 'failed', 3],
    ['video', 'video-result', 'succeeded', 4],
  ])
  expect(new Set(items.map((item) => item.nodeId)).size).toBe(items.length)
  expect(items.every((item) => item.groupId === null)).toBe(true)
})

test('valid storyboard metadata owns child order while malformed metadata falls back to geometry', () => {
  const validGroup = node('valid-group', 'group', 100, 100, {
    subtype: 'storyboard',
    serialization_version: 1,
    storyboard_schema_version: 1,
    aspect_ratio: '16:9',
    columns: 2,
    show_numbers: true,
    ordered_child_ids: ['valid-b', 'valid-a'],
  })
  const malformedGroup = node('malformed-group', 'group', 100, 500, {
    subtype: 'storyboard',
    serialization_version: 1,
    storyboard_schema_version: 1,
    aspect_ratio: '16:9',
    columns: 2,
    show_numbers: true,
    ordered_child_ids: ['missing', 'malformed-b'],
  })
  const nodes: CanvasNode[] = [
    validGroup,
    node('valid-a', 'asset', 320, 180, { subtype: 'image', serialization_version: 1, url: '/a.png' }, { parentNodeId: validGroup.id }),
    node('valid-b', 'result', 160, 180, { subtype: 'image', serialization_version: 1, url: '/b.png' }, { parentNodeId: validGroup.id, status: 'success' }),
    malformedGroup,
    node('malformed-a', 'asset', 320, 580, { subtype: 'image', serialization_version: 1, url: '/c.png' }, { parentNodeId: malformedGroup.id }),
    node('malformed-b', 'result', 160, 580, { subtype: 'image', serialization_version: 1, url: '/d.png' }, { parentNodeId: malformedGroup.id, status: 'success' }),
  ]

  const imageItems = projectCanvasStoryboard({ nodes, connections: [] })
    .filter((item) => item.lane === 'image')

  expect(imageItems.map((item) => [item.nodeId, item.groupId, item.order])).toEqual([
    ['valid-b', 'valid-group', 1],
    ['valid-a', 'valid-group', 2],
    ['malformed-b', null, 3],
    ['malformed-a', null, 4],
  ])
})

test('projection is stable, geometry ordered, and leaves graph inputs unchanged', () => {
  const nodes = [
    node('x-later', 'script', 300, 100, { subtype: 'script', serialization_version: 1 }),
    node('document-later', 'script', 100, 100, { subtype: 'script', serialization_version: 1 }),
    node('document-first', 'note', 100, 100, { subtype: 'annotation', serialization_version: 1 }),
  ]
  const connections: CanvasConnection[] = [{ id: 'edge', from: 'document-first', to: 'x-later', status: 'active' }]
  const beforeNodes = structuredClone(nodes)
  const beforeConnections = structuredClone(connections)

  const first = projectCanvasStoryboard({ nodes, connections })
  const second = projectCanvasStoryboard({ nodes, connections })

  expect(first).toEqual(second)
  expect(first.map((item) => item.nodeId)).toEqual(['document-later', 'document-first', 'x-later'])
  expect(nodes).toEqual(beforeNodes)
  expect(connections).toEqual(beforeConnections)
})

test('storyboard keeps persisted queued distinct from running and terminal generation states', () => {
  const nodes = [
    node('queued', 'generation', 0, 0, { subtype: 'image', serialization_version: 1, generation_status: 'queued' }),
    node('running', 'generation', 200, 0, { subtype: 'image', serialization_version: 1, generation_status: 'running' }),
    node('succeeded', 'generation', 400, 0, { subtype: 'image', serialization_version: 1, generation_status: 'succeeded' }),
    node('timed-out', 'generation', 600, 0, { subtype: 'image', serialization_version: 1, generation_status: 'timed_out' }),
  ]

  expect(projectCanvasStoryboard({ nodes, connections: [] }).map((item) => item.status)).toEqual([
    'queued', 'running', 'succeeded', 'failed',
  ])
})
