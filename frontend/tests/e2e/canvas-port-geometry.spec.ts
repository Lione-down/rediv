import { expect, test } from '@playwright/test'
import { useCanvasConnectionPresentation } from '../../src/components/canvas/composables/use-canvas-connection-presentation'
import {
  nodeInputPortAnchors,
  nodePortWorldAnchor,
} from '../../src/components/canvas/canvas-geometry'
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
  expect(nodeInputPortAnchors(generation)).toEqual([
    { portId: 'prompt', x: 500, y: 100 + 220 / 3 },
    { portId: 'media', x: 500, y: 100 + (220 * 2) / 3 },
  ])
  expect(nodePortWorldAnchor(script, 'output', 'out')).toEqual({ x: 340, y: 140 })
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

  expect(connectionPaths.value).toEqual([expect.objectContaining({
    path: 'M 340 140 C 450 140, 390 173.33333333333331, 500 173.33333333333331',
  })])
})
