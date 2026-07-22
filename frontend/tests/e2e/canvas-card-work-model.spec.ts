import { expect, test } from '@playwright/test'
import {
  resolveCanvasCardWorkModel,
  resolveCanvasCardProjectedResult,
  type CanvasCardWorkModeId,
} from '../../src/components/canvas/canvas-card-work-model'
import { projectCanvasMaterializedCardFamilies } from '../../src/components/canvas/canvas-materialized-card-projection'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { createCardSourceReferenceCommand } from '../../src/modules/canvas/resource-commands'
import type { ProjectAsset } from '../../src/modules/canvas/project-resource-types'

function node(
  type: CanvasNode['type'],
  contentData: Record<string, unknown> = {},
): CanvasNode {
  return {
    id: `${type}-1`,
    type,
    title: `${type} card`,
    x: 0,
    y: 0,
    width: 320,
    height: 240,
    contentData,
  }
}

function modeIds(type: CanvasNode['type'], contentData: Record<string, unknown> = {}) {
  return resolveCanvasCardWorkModel(node(type, contentData), {
    isReadOnly: false,
    isSelected: false,
  }).modes.map((mode) => mode.id) as CanvasCardWorkModeId[]
}

test('text cards disclose the four observed empty-card work modes', () => {
  expect(modeIds('text')).toEqual([
    'direct-write',
    'text-to-video',
    'image-to-prompt',
    'text-to-music',
  ])
  expect(modeIds('script', { subtype: 'script', serialization_version: 1 })).toEqual([
    'direct-write',
    'text-to-video',
    'image-to-prompt',
    'text-to-music',
  ])
  expect(resolveCanvasCardWorkModel(node('text'), { isReadOnly: false, isSelected: false }).showsEmptyModeChooser).toBe(true)
  expect(resolveCanvasCardWorkModel({ ...node('text'), content: '已有内容' }, { isReadOnly: false, isSelected: false }).showsEmptyModeChooser).toBe(false)
})

test('image and video cards expose type-specific work modes', () => {
  expect(modeIds('generation', { subtype: 'image', serialization_version: 1 })).toEqual([
    'text-to-image',
    'image-to-image',
    'image-upscale',
  ])
  expect(modeIds('image')).toEqual(['text-to-image', 'image-to-image', 'image-upscale'])
  expect(modeIds('generation', { subtype: 'video', serialization_version: 1 })).toEqual([
    'text-to-video',
    'first-frame-video',
    'keyframes-video',
  ])
})

test('selected editable media card owns source acquisition and an attached work surface', () => {
  const image = node('generation', { subtype: 'image', serialization_version: 1 })
  expect(resolveCanvasCardWorkModel(image, { isReadOnly: false, isSelected: true })).toMatchObject({
    family: 'image',
    canChooseSource: true,
    sourceChoices: ['local-upload', 'project-asset'],
    showsAttachedWorkSurface: true,
  })
  expect(resolveCanvasCardWorkModel(image, { isReadOnly: false, isSelected: false })).toMatchObject({
    canChooseSource: true,
    showsAttachedWorkSurface: false,
    showsEmptyModeChooser: false,
  })
})

test('specialized recipe and image-operation cards keep their dedicated workflow without a generic prompt surface', () => {
  for (const contentData of [
    { subtype: 'image', serialization_version: 1, generation_recipe_id: 'character-sheet' },
    {
      subtype: 'image',
      serialization_version: 1,
      generation_parameters: { schema_version: 1, image: { aspect_ratio: '4:3', operation: { id: 'upscale' } } },
    },
  ]) {
    expect(resolveCanvasCardWorkModel(node('generation', contentData), {
      isReadOnly: false,
      isSelected: true,
    })).toMatchObject({
      canChooseSource: false,
      showsAttachedWorkSurface: false,
    })
  }
})

test('readonly locked and unsupported cards fail closed', () => {
  const image = node('image')
  const locked = { ...image, isLocked: true }
  expect(resolveCanvasCardWorkModel(image, { isReadOnly: true, isSelected: true })).toMatchObject({
    canChooseSource: false,
    showsAttachedWorkSurface: false,
  })
  expect(resolveCanvasCardWorkModel(locked, { isReadOnly: false, isSelected: true })).toMatchObject({
    canChooseSource: false,
    showsAttachedWorkSurface: false,
  })
  expect(resolveCanvasCardWorkModel(node('unknown'), { isReadOnly: false, isSelected: true })).toMatchObject({
    family: null,
    canChooseSource: false,
    modes: [],
    showsAttachedWorkSurface: false,
  })
  expect(resolveCanvasCardWorkModel(node('result', { subtype: 'image', serialization_version: 1 }), { isReadOnly: false, isSelected: true })).toMatchObject({
    family: 'image',
    canChooseSource: false,
    showsAttachedWorkSurface: false,
  })
})

test('card source acquisition creates one atomic asset-to-card graph command', () => {
  const target = node('generation', { subtype: 'image', serialization_version: 1 })
  target.id = 'generation-1'
  target.x = 400
  const asset: ProjectAsset = {
    id: 'asset-1',
    user_id: 'user-1',
    project_id: 'project-1',
    origin_canvas_id: 'canvas-1',
    canvas_node_id: null,
    source: 'upload',
    source_task_id: null,
    source_model: null,
    status: 'active',
    type: 'image',
    url: 'https://example.test/image.png',
    content_text: null,
    created_at: '2026-07-21T00:00:00Z',
    updated_at: '2026-07-21T00:00:00Z',
  }

  const command = createCardSourceReferenceCommand(asset, target, [target])
  expect(command).not.toBeNull()
  expect(command?.nodes).toHaveLength(1)
  expect(command?.nodes[0].contentData).toMatchObject({ asset_id: 'asset-1', subtype: 'image' })
  expect(command?.connections).toEqual([
    expect.objectContaining({
      from: command?.nodes[0].id,
      to: 'generation-1',
      sourcePort: 'out',
      targetPort: 'media',
      metadata: { input_order: 1, source_acquisition: 'card' },
    }),
  ])
})

test('latest connected generated result is projected back into its source card', () => {
  const source = node('generation', { subtype: 'image', serialization_version: 1 })
  source.id = 'generation-1'
  const first = { ...node('result', { subtype: 'image', serialization_version: 1, asset_id: 'a1', url: 'https://example.test/first.png' }), id: 'result-1' }
  const latest = { ...node('result', { subtype: 'image', serialization_version: 1, asset_id: 'a2', url: 'https://example.test/latest.png' }), id: 'result-2' }
  const connections = [
    { id: 'c1', from: source.id, to: first.id },
    { id: 'c2', from: source.id, to: latest.id },
  ]
  expect(resolveCanvasCardProjectedResult(source, [source, first, latest], connections)?.id).toBe('result-2')
  expect(resolveCanvasCardProjectedResult(first, [source, first, latest], connections)).toBeNull()
})

test('materialized generation family presents one stable media card and projects downstream edges', () => {
  const source = {
    ...node('generation', {
      subtype: 'image', serialization_version: 1, text: '三花小猫',
      result_materialized_task_id: 'task-1',
    }),
    id: 'generation-1',
  }
  const result = {
    ...node('result', {
      subtype: 'image', serialization_version: 1, asset_id: 'asset-1',
      url: 'https://example.test/cat.png', width: 1024, height: 1024, source_task_id: 'task-1',
    }),
    id: 'result-1', x: 480, width: 360, height: 220,
  }
  const downstream = { ...node('generation', { subtype: 'video', serialization_version: 1 }), id: 'generation-2', x: 920 }
  const connections: CanvasConnection[] = [
    { id: 'internal', from: source.id, to: result.id, sourcePort: 'out', targetPort: 'in' },
    { id: 'downstream', from: result.id, to: downstream.id, sourcePort: 'out', targetPort: 'media' },
  ]

  const idle = projectCanvasMaterializedCardFamilies([source, result, downstream], connections, [])
  const selected = projectCanvasMaterializedCardFamilies([source, result, downstream], connections, [source.id])
  const idleSource = idle.nodes.find((candidate) => candidate.id === source.id)
  const selectedSource = selected.nodes.find((candidate) => candidate.id === source.id)

  expect(idle.nodes.map((candidate) => candidate.id)).toEqual([source.id, downstream.id])
  expect(idle.hiddenNodeIds).toEqual(new Set([result.id]))
  expect(idleSource).toMatchObject({
    id: source.id,
    type: 'generation',
    x: source.x,
    y: source.y,
    width: result.width,
    height: result.height,
    contentData: expect.objectContaining({
      asset_id: 'asset-1',
      url: 'https://example.test/cat.png',
      width: 1024,
      height: 1024,
    }),
  })
  expect(selectedSource).toEqual(idleSource)
  expect(idle.connections).toEqual([
    expect.objectContaining({ id: 'downstream', from: source.id, to: downstream.id }),
  ])
})

test('Graph Access selection reveals the canonical result without duplicating its projection', () => {
  const source = {
    ...node('generation', { subtype: 'image', serialization_version: 1, result_materialized_task_id: 'task-1' }),
    id: 'generation-1',
  }
  const result = {
    ...node('result', { subtype: 'image', serialization_version: 1, asset_id: 'asset-1', url: 'https://example.test/cat.png', source_task_id: 'task-1' }),
    id: 'result-1', x: 480,
  }
  const connection: CanvasConnection = { id: 'internal', from: source.id, to: result.id, sourcePort: 'out', targetPort: 'in' }

  const projection = projectCanvasMaterializedCardFamilies([source, result], [connection], [result.id])

  expect(projection.nodes).toEqual([source, result])
  expect(projection.connections).toEqual([connection])
  expect(projection.hiddenNodeIds.size).toBe(0)
})

test('specialized generation workflows retain their dedicated source and result cards', () => {
  const source = {
    ...node('generation', { subtype: 'image', serialization_version: 1, generation_recipe_id: 'character-sheet' }),
    id: 'generation-1',
  }
  const result = {
    ...node('result', { subtype: 'image', serialization_version: 1, asset_id: 'asset-1', url: 'https://example.test/sheet.png' }),
    id: 'result-1', x: 480,
  }
  const connection: CanvasConnection = { id: 'internal', from: source.id, to: result.id, sourcePort: 'out', targetPort: 'in' }

  const projection = projectCanvasMaterializedCardFamilies([source, result], [connection], [])

  expect(projection.nodes).toEqual([source, result])
  expect(projection.connections).toEqual([connection])
  expect(projection.hiddenNodeIds.size).toBe(0)
})

test('an arbitrary generation to result edge is not mistaken for a materialized card family', () => {
  const source = { ...node('generation', { subtype: 'image', serialization_version: 1 }), id: 'generation-1' }
  const result = {
    ...node('result', { subtype: 'image', serialization_version: 1, url: 'https://example.test/independent.png' }),
    id: 'result-1', x: 480,
  }
  const connection: CanvasConnection = { id: 'edge-1', from: source.id, to: result.id }

  const projection = projectCanvasMaterializedCardFamilies([source, result], [connection], [])

  expect(projection.nodes).toEqual([source, result])
  expect(projection.connections).toEqual([connection])
})
