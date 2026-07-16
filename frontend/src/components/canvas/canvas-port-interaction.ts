import type { CanvasNode } from '../../types/canvas'
import type { ViewportState } from './canvas-geometry'
import { surfaceToWorld } from './canvas-geometry'
import { buildCanvasNodePresentation, canvasNodeVisualSize } from './canvas-node-presentation'
import { resolveCanvasPortGeometry } from './canvas-port-presentation'

interface CanvasPortPointerTargetOptions {
  surface: HTMLElement
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
  onPortPointerDown: (
    nodeId: string,
    portId: string,
    direction: 'input' | 'output',
    event: { origin: PointerEvent },
  ) => void
}

interface CanvasPortPointerTarget {
  nodeId: string
  portId: string
  direction: 'input' | 'output'
  distanceSquared: number
}

function resolvePointerTarget(options: CanvasPortPointerTargetOptions, event: PointerEvent) {
  const surfaceRect = options.surface.getBoundingClientRect()
  const viewport = options.getViewport()
  const point = surfaceToWorld({ x: event.clientX - surfaceRect.left, y: event.clientY - surfaceRect.top }, viewport)
  let nearest: CanvasPortPointerTarget | null = null
  for (const node of [...options.getNodes()].reverse()) {
    if (node.isLocked) continue
    const presentation = buildCanvasNodePresentation(node)
    const nodeSize = canvasNodeVisualSize(node)
    const ports = [...presentation.inputPorts, ...presentation.outputPorts]
    for (const port of ports) {
      const siblings = port.direction === 'input' ? presentation.inputPorts : presentation.outputPorts
      const index = siblings.findIndex((candidate) => candidate.id === port.id)
      const hit = resolveCanvasPortGeometry(port.direction, nodeSize, index, siblings.length, viewport.zoom).hit
      const localX = point.x - node.x
      const localY = point.y - node.y
      if (localX < hit.x || localX > hit.x + hit.size || localY < hit.y || localY > hit.y + hit.size) continue
      const centerX = node.x + hit.x + hit.size / 2
      const centerY = node.y + hit.y + hit.size / 2
      const distanceSquared = (point.x - centerX) ** 2 + (point.y - centerY) ** 2
      if (!nearest || distanceSquared < nearest.distanceSquared) {
        nearest = { nodeId: node.id, portId: port.id, direction: port.direction, distanceSquared }
      }
    }
  }
  return nearest
}

export function bindCanvasPortPointerTargets(options: CanvasPortPointerTargetOptions) {
  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 1) return
    if (!(event.target instanceof HTMLCanvasElement)) return
    const target = resolvePointerTarget(options, event)
    if (!target) return
    event.preventDefault()
    event.stopImmediatePropagation()
    options.onPortPointerDown(target.nodeId, target.portId, target.direction, { origin: event })
  }
  options.surface.addEventListener('pointerdown', handlePointerDown, true)
  return () => options.surface.removeEventListener('pointerdown', handlePointerDown, true)
}
