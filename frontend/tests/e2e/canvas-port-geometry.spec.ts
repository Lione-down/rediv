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
  CANVAS_PORT_VISUAL_WORLD_SIZE,
  resolveCanvasPortGeometry,
  resolveCanvasPortHitWorldSize,
} from '../../src/components/canvas/canvas-port-presentation'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

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

test('registry ports expose distinct world anchors that match their rendered positions', () => {
  const generationSize = canvasNodeVisualSize(generation)
  expect(nodeInputPortAnchors(generation)).toEqual([
    { portId: 'prompt', x: 500, y: 100 + generationSize.height / 3 },
    { portId: 'media', x: 500, y: 100 + (generationSize.height * 2) / 3 },
  ])
  const scriptSize = canvasNodeVisualSize(script)
  expect(nodePortWorldAnchor(script, 'output', 'out')).toEqual({ x: 20 + scriptSize.width, y: 40 + scriptSize.height / 2 })
})

test('port visuals stay world-sized while the real hit target stays screen-stable', () => {
  for (const zoom of [0.1, 0.25, 0.5, 1, 2, 8]) {
    const hitWorldSize = resolveCanvasPortHitWorldSize(zoom)
    const hitScreenSize = hitWorldSize * zoom
    const geometry = resolveCanvasPortGeometry('output', { width: 320, height: 120 }, 0, 1, zoom)
    expect(geometry.visual.size).toBe(CANVAS_PORT_VISUAL_WORLD_SIZE)
    expect(geometry.hit.size).toBe(hitWorldSize)
    expect(hitScreenSize).toBeGreaterThanOrEqual(CANVAS_PORT_HIT_TARGET_MIN_PX)
    expect(hitScreenSize).toBeLessThanOrEqual(CANVAS_PORT_HIT_TARGET_MAX_PX)
    expect(hitScreenSize).toBe(40)
  }
})

test('persisted connections attach paths to the exact source and target registry ports', () => {
  const connections: CanvasConnection[] = [{
    id: 'connection-1',
    from: 'script',
    to: 'generation',
    sourcePort: 'out',
    targetPort: 'prompt',
  }]
  const { connectionPaths } = useCanvasConnectionPresentation({
    getConnections: () => connections,
    getNodes: () => [script, generation],
    getViewport: () => ({ zoom: 1, x: 0, y: 0 }),
  })

  const from = nodePortWorldAnchor(script, 'output', 'out')
  const to = nodePortWorldAnchor(generation, 'input', 'prompt')
  expect(connectionPaths.value).toEqual([expect.objectContaining({ path: buildConnectionPath(from, to) })])
})
