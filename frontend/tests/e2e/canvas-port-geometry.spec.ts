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
  resolveCanvasElasticPortPosition,
  resolveCanvasPortAcquisitionWorldRect,
  resolveCanvasElasticOutputPortPosition,
  resolveCanvasOutputAcquisitionWorldRect,
  resolveCanvasPortGeometry,
  resolveCanvasPortHitWorldSize,
  resolveCanvasRuntimePortGeometry,
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

test('acquisition diameter and follow clamp scale with Canvas zoom', () => {
  const nodeSize = { width: 320, height: 180 }
  const at100 = resolveCanvasPortAcquisitionWorldRect('output', nodeSize, 0, 1, 1)
  const at50 = resolveCanvasPortAcquisitionWorldRect('output', nodeSize, 0, 1, 0.5)
  expect(at100.width).toBe(CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX)
  expect(at50.width).toBe(at100.width)
  expect(at50.width * 0.5).toBe(at100.width * 0.5)

  const center = {
    x: at100.x + at100.width / 2,
    y: at100.y + at100.height / 2,
  }
  const pointer = { x: center.x + 36, y: center.y }
  const followedAt100 = resolveCanvasElasticPortPosition(
    'output', pointer, nodeSize, 0, 1, 1,
  )
  const followedAt50 = resolveCanvasElasticPortPosition(
    'output', pointer, nodeSize, 0, 1, 0.5,
  )
  expect(followedAt100).not.toBeNull()
  expect(followedAt50).not.toBeNull()
  expect(followedAt100!.x - center.x).toBe(CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX)
  expect(followedAt50!.x - center.x).toBe(CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX)
})

test('typed registry ports keep distinct projected anchors without losing their ids', () => {
  const generationSize = canvasNodeVisualSize(generation)
  expect(nodeInputPortAnchors(generation)).toEqual([
    { portId: 'prompt', x: 500, y: 100 + generationSize.height / 3 },
    { portId: 'media', x: 500, y: 100 + generationSize.height * 2 / 3 },
  ])
  const scriptSize = canvasNodeVisualSize(script)
  expect(nodePortWorldAnchor(script, 'output', 'out')).toEqual({ x: 20 + scriptSize.width, y: 40 + scriptSize.height / 2 })
})

test('input and output acquisition scale with Canvas while preserving continuous symmetric pointer follow', () => {
  const nodeSize = { width: 320, height: 180 }
  for (const zoom of [0.25, 1, 2]) {
    for (const direction of ['input', 'output'] as const) {
      const acquisition = resolveCanvasPortAcquisitionWorldRect(
        direction,
        nodeSize,
        0,
        1,
        zoom,
      )
      expect(acquisition.width).toBe(CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX)
      const center = {
        x: acquisition.x + acquisition.width / 2,
        y: acquisition.y + acquisition.height / 2,
      }
      const samples = [
        { x: center.x, y: center.y },
        { x: center.x + 8, y: center.y - 6 },
        { x: center.x + 24, y: center.y + 18 },
        { x: center.x - 31, y: center.y + 22 },
      ]
      const positions = samples.map((pointer) => resolveCanvasElasticPortPosition(
        direction,
        pointer,
        nodeSize,
        0,
        1,
        zoom,
      ))
      expect(positions.every(Boolean)).toBe(true)
      expect(new Set(positions.map((position) => `${position!.x}:${position!.y}`)).size)
        .toBeGreaterThan(2)
      for (const position of positions) {
        const distanceWorld = Math.hypot(
          position!.x - center.x,
          position!.y - center.y,
        )
        expect(distanceWorld).toBeLessThanOrEqual(CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX + 0.000001)
        if (direction === 'input') {
          expect(position!.x + CANVAS_PORT_VISUAL_WORLD_SIZE / 2).toBeLessThanOrEqual(0)
        } else {
          expect(position!.x - CANVAS_PORT_VISUAL_WORLD_SIZE / 2).toBeGreaterThanOrEqual(nodeSize.width)
        }
      }
    }
  }
})

test('every logical port receives one distinct symmetric acquisition target', () => {
  const nodeSize = { width: 320, height: 240 }
  for (const direction of ['input', 'output'] as const) {
    const rects = [0, 1, 2].map((index) => resolveCanvasPortAcquisitionWorldRect(
      direction,
      nodeSize,
      index,
      3,
      1,
    ))
    expect(new Set(rects.map((rect) => rect.y)).size).toBe(3)
    expect(rects.map((rect) => rect.x)).toEqual(
      Array(3).fill(direction === 'input' ? -80 : nodeSize.width),
    )
  }
})

test('detached output acquisition scales with Canvas, stays outside-only, follows X/Y, and clamps radially', () => {
  const nodeSize = { width: 320, height: 180 }
  for (const zoom of [0.1, 0.25, 0.5, 1, 2, 8]) {
    const acquisition = resolveCanvasOutputAcquisitionWorldRect(nodeSize, zoom)
    expect(acquisition.width).toBe(CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX)
    expect(acquisition.height).toBe(CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX)
    expect(acquisition.x).toBe(nodeSize.width)
    expect(acquisition.y).toBe(nodeSize.height / 2 - CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX / 2)

    const acquisitionCenter = {
      x: nodeSize.width + CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX / 2,
      y: nodeSize.height / 2,
    }
    const directPointer = {
      x: acquisitionCenter.x + 12,
      y: acquisitionCenter.y - 8,
    }
    expect(resolveCanvasElasticOutputPortPosition(directPointer, nodeSize, zoom)).toEqual({
      x: Math.max(directPointer.x, nodeSize.width + CANVAS_PORT_VISUAL_WORLD_SIZE / 2),
      y: directPointer.y,
    })

    const clamped = resolveCanvasElasticOutputPortPosition(
      { x: acquisitionCenter.x + 32, y: acquisitionCenter.y + 20 }, nodeSize, zoom,
    )!
    const clampedDistanceWorld = Math.hypot(
      clamped.x - acquisitionCenter.x,
      clamped.y - acquisitionCenter.y,
    )
    expect(clampedDistanceWorld).toBeCloseTo(CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX, 6)
    expect(clamped.x - CANVAS_PORT_VISUAL_WORLD_SIZE / 2).toBeGreaterThanOrEqual(nodeSize.width)

    expect(resolveCanvasElasticOutputPortPosition(
      { x: acquisition.x, y: acquisition.y }, nodeSize, zoom,
    )).toBeNull()
    expect(resolveCanvasElasticOutputPortPosition(
      { x: nodeSize.width + 81, y: nodeSize.height / 2 }, nodeSize, zoom,
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

test('input and output port visuals share their logical centers and symmetric acquisition', () => {
  expect(CANVAS_PORT_VISUAL_WORLD_SIZE).toBe(20)
  expect(CANVAS_PORT_HIT_TARGET_PX).toBe(40)
  expect(CANVAS_PORT_HIT_TARGET_MIN_PX).toBe(40)
  expect(CANVAS_PORT_HIT_TARGET_MAX_PX).toBe(40)
  for (const zoom of [0.1, 0.25, 0.5, 1, 2, 8]) {
    const hitWorldSize = resolveCanvasPortHitWorldSize(zoom)
    const hitScreenSize = hitWorldSize * zoom
    for (const direction of ['input', 'output'] as const) {
      const geometry = resolveCanvasPortGeometry(direction, { width: 320, height: 120 }, 0, 1, zoom)
      const expectedCenterX = direction === 'input' ? 0 : 320
      expect(geometry.visual.size).toBe(CANVAS_PORT_VISUAL_WORLD_SIZE)
      expect(geometry.visual.x + geometry.visual.size / 2).toBe(expectedCenterX)
      expect(geometry.hit.x + geometry.hit.size / 2).toBe(expectedCenterX)
      expect(geometry.hit.size).toBe(hitWorldSize)
      expect(geometry).toEqual(expect.objectContaining({
        acquisition: expect.objectContaining({
          diameter: CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX,
          direction,
        }),
      }))
      expect(hitScreenSize).toBeGreaterThanOrEqual(CANVAS_PORT_HIT_TARGET_MIN_PX)
      expect(hitScreenSize).toBeLessThanOrEqual(CANVAS_PORT_HIT_TARGET_MAX_PX)
      expect(hitScreenSize).toBe(CANVAS_PORT_HIT_TARGET_PX)
    }
  }
})

test('runtime multi-input ports stay neighbour-bounded at 50% zoom', () => {
  const first = resolveCanvasRuntimePortGeometry(160, 0, 2, 0.5)
  const second = resolveCanvasRuntimePortGeometry(160, 1, 2, 0.5)
  const centerDistance = second.centerY - first.centerY

  expect(first.visualSize).toBeLessThanOrEqual(centerDistance)
  expect(first.acquisitionSize).toBeLessThanOrEqual(centerDistance - 4)
  expect(second.visualSize).toBe(first.visualSize)
  expect(second.acquisitionSize).toBe(first.acquisitionSize)
})

test('persisted connections attach paths to each exact source and target registry port', () => {
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
  expect(connectionPaths.value[0].target).not.toEqual(connectionPaths.value[1].target)
})

test('persisted outgoing paths stay on the same projected center as the visible plus', () => {
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
  const geometry = resolveCanvasPortGeometry(
    'output',
    canvasNodeVisualSize(script),
    0,
    1,
    1,
  )
  expect(connectionPaths.value[0].source).toEqual({
    x: script.x + geometry.visual.x + geometry.visual.size / 2,
    y: script.y + geometry.visual.y + geometry.visual.size / 2,
  })
})

test('forward connection paths use shared midpoint X controls', () => {
  expect(buildConnectionPath({ x: 20, y: 40 }, { x: 500, y: 220 }))
    .toBe('M 20 40 C 260 40, 260 220, 500 220')
})

test('reverse connection paths use exact outward world tangents', () => {
  expect(buildConnectionPath({ x: 500, y: 40 }, { x: 20, y: 220 }))
    .toBe('M 500 40 C 632 40, -112 220, 20 220')
})
