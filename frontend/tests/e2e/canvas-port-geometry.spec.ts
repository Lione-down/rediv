import { expect, test } from '@playwright/test'
import { useCanvasConnectionPresentation } from '../../src/components/canvas/composables/use-canvas-connection-presentation'
import {
  buildConnectionPath,
  nodeInputPortAnchors,
  nodePortWorldAnchor,
} from '../../src/components/canvas/canvas-geometry'
import { canvasNodeVisualSize } from '../../src/components/canvas/canvas-node-presentation'
import {
  CANVAS_PORT_HIT_TARGET_MAX_PX,
  CANVAS_PORT_HIT_TARGET_MIN_PX,
  CANVAS_PORT_HIT_TARGET_PX,
  CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX,
  CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX,
  CANVAS_PORT_VISUAL_WORLD_SIZE,
  resolveCanvasElasticOutputPortPosition,
  resolveCanvasOutputAcquisitionWorldRect,
  resolveCanvasPortGeometry,
  resolveCanvasPortHitWorldSize,
} from '../../src/components/canvas/canvas-port-presentation'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { resolveCanvasElasticOutputTargetAtPoint } from '../../src/components/canvas/canvas-port-interaction'

const script: CanvasNode = {
  id: 'script',
  type: 'script',
  title: '脚本',
  x: 20,
  y: 40,
  width: 320,
  height: 200,
  contentData: { subtype: 'script', serialization_version: 1 },
}

const generation: CanvasNode = {
  id: 'generation',
  type: 'generation',
  title: '视频生成',
  x: 500,
  y: 100,
  width: 340,
  height: 220,
  contentData: { subtype: 'video', serialization_version: 1 },
}

test('typed registry ports share one visible directional anchor without losing their ids', () => {
  const generationSize = canvasNodeVisualSize(generation)
  expect(nodeInputPortAnchors(generation)).toEqual([
    { portId: 'prompt', x: 500, y: 100 + generationSize.height / 2 },
    { portId: 'media', x: 500, y: 100 + generationSize.height / 2 },
  ])
  const scriptSize = canvasNodeVisualSize(script)
  expect(nodePortWorldAnchor(script, 'output', 'out')).toEqual({ x: 20 + scriptSize.width, y: 40 + scriptSize.height / 2 })
})

test('detached output acquisition is CSS-stable, outside-only, follows X/Y, and clamps radially', () => {
  const nodeSize = { width: 320, height: 180 }
  for (const zoom of [0.1, 0.25, 0.5, 1, 2, 8]) {
    const acquisition = resolveCanvasOutputAcquisitionWorldRect(nodeSize, zoom)
    expect(acquisition.width * zoom).toBe(CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX)
    expect(acquisition.height * zoom).toBe(CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX)
    expect(acquisition.x).toBe(nodeSize.width)
    expect(acquisition.y).toBe(nodeSize.height / 2 - CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX / 2 / zoom)

    const acquisitionCenter = {
      x: nodeSize.width + CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX / 2 / zoom,
      y: nodeSize.height / 2,
    }
    const directPointer = {
      x: acquisitionCenter.x + 12 / zoom,
      y: acquisitionCenter.y - 8 / zoom,
    }
    expect(resolveCanvasElasticOutputPortPosition(directPointer, nodeSize, zoom)).toEqual({
      x: Math.max(directPointer.x, nodeSize.width + CANVAS_PORT_VISUAL_WORLD_SIZE / 2),
      y: directPointer.y,
    })

    const clamped = resolveCanvasElasticOutputPortPosition(
      { x: acquisitionCenter.x + 32 / zoom, y: acquisitionCenter.y + 20 / zoom }, nodeSize, zoom,
    )!
    const clampedDistancePx = Math.hypot(
      clamped.x - acquisitionCenter.x,
      clamped.y - acquisitionCenter.y,
    ) * zoom
    if (zoom <= 2) expect(clampedDistancePx).toBeCloseTo(CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX, 6)
    else expect(clampedDistancePx).toBeGreaterThanOrEqual(CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX)
    expect(clamped.x - CANVAS_PORT_VISUAL_WORLD_SIZE / 2).toBeGreaterThanOrEqual(nodeSize.width)

    expect(resolveCanvasElasticOutputPortPosition(
      { x: acquisition.x, y: acquisition.y }, nodeSize, zoom,
    )).toBeNull()
    expect(resolveCanvasElasticOutputPortPosition(
      { x: nodeSize.width + 81 / zoom, y: nodeSize.height / 2 }, nodeSize, zoom,
    )).toBeNull()
    expect(resolveCanvasElasticOutputPortPosition(
      { x: nodeSize.width, y: 72 }, nodeSize, zoom, false,
    )).toBeNull()
  }
})

test('elastic output acquisition never steals a real neighbouring card at low zoom', () => {
  const neighbour: CanvasNode = {
    ...script,
    id: 'neighbour',
    x: 460,
    y: 40,
  }
  const target = resolveCanvasElasticOutputTargetAtPoint(
    [script, neighbour],
    { x: neighbour.x + 160, y: neighbour.y + 100 },
    0.25,
  )
  expect(target?.nodeId).not.toBe(script.id)
})

test('port visuals stay world-sized while the real hit target stays screen-stable', () => {
  expect(CANVAS_PORT_VISUAL_WORLD_SIZE).toBe(20)
  expect(CANVAS_PORT_HIT_TARGET_PX).toBe(40)
  expect(CANVAS_PORT_HIT_TARGET_MIN_PX).toBe(40)
  expect(CANVAS_PORT_HIT_TARGET_MAX_PX).toBe(40)
  for (const zoom of [0.1, 0.25, 0.5, 1, 2, 8]) {
    const hitWorldSize = resolveCanvasPortHitWorldSize(zoom)
    const hitScreenSize = hitWorldSize * zoom
    const geometry = resolveCanvasPortGeometry('output', { width: 320, height: 120 }, 0, 1, zoom)
    expect(geometry.visual.size).toBe(CANVAS_PORT_VISUAL_WORLD_SIZE)
    expect(geometry.visual.x).toBeGreaterThanOrEqual(320)
    expect(geometry.hit.size).toBe(hitWorldSize)
    expect(hitScreenSize).toBeGreaterThanOrEqual(CANVAS_PORT_HIT_TARGET_MIN_PX)
    expect(hitScreenSize).toBeLessThanOrEqual(CANVAS_PORT_HIT_TARGET_MAX_PX)
    expect(hitScreenSize).toBe(CANVAS_PORT_HIT_TARGET_PX)
  }
})

test('persisted connections attach paths to the exact source and target registry ports', () => {
  const secondScript = { ...script, id: 'script-2', y: 300 }
  const connections: CanvasConnection[] = [{
    id: 'connection-1',
    from: 'script',
    to: 'generation',
    sourcePort: 'out',
    targetPort: 'prompt',
  }, {
    id: 'connection-2', from: 'script-2', to: 'generation', sourcePort: 'out', targetPort: 'media',
  }]
  const { connectionPaths } = useCanvasConnectionPresentation({
    getConnections: () => connections,
    getNodes: () => [script, secondScript, generation],
    getViewport: () => ({ zoom: 1, x: 0, y: 0 }),
  })

  const from = nodePortWorldAnchor(script, 'output', 'out')
  const to = nodePortWorldAnchor(generation, 'input', 'prompt')
  expect(connectionPaths.value[0]).toEqual(expect.objectContaining({ path: buildConnectionPath(from, to) }))
  expect(connectionPaths.value[0].target).toEqual(connectionPaths.value[1].target)
})

test('persisted outgoing paths stay on the fixed logical midpoint while the visual plus floats independently', () => {
  const connection: CanvasConnection = {
    id: 'connection-elastic', from: 'script', to: 'generation', sourcePort: 'out', targetPort: 'prompt',
  }
  const { connectionPaths } = useCanvasConnectionPresentation({
    getConnections: () => [connection],
    getNodes: () => [script, generation],
    getViewport: () => ({ zoom: 1, x: 0, y: 0 }),
  })
  expect(connectionPaths.value[0].source).toEqual(nodePortWorldAnchor(script, 'output', 'out'))
  expect(connectionPaths.value[0].connection.sourcePort).toBe('out')
})

test('forward connection paths use shared midpoint X controls', () => {
  expect(buildConnectionPath({ x: 20, y: 40 }, { x: 500, y: 220 }))
    .toBe('M 20 40 C 260 40, 260 220, 500 220')
})

test('reverse connection paths use exact outward world tangents', () => {
  expect(buildConnectionPath({ x: 500, y: 40 }, { x: 20, y: 220 }))
    .toBe('M 500 40 C 632 40, -112 220, 20 220')
})
