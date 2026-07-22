import type { CanvasNode } from '../../types/canvas'
import type { ViewportState } from './canvas-geometry'
import { surfaceToWorld } from './canvas-geometry'
import { buildCanvasNodePresentation, canvasNodeVisualSize } from './canvas-node-presentation'
import { resolveCanvasPortGeometry } from './canvas-port-presentation'
import { resolveCanvasElasticOutputPortPosition } from './canvas-port-presentation'

export interface CanvasElasticOutputTarget {
  edgeDistancePx: number
  nodeId: string
  portId: string
  localX: number
  localY: number
}

interface CanvasPortPointerTargetOptions {
  surface: HTMLElement
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
  getReadOnly?: () => boolean
  onElasticOutputChange?: (target: CanvasElasticOutputTarget | null) => void
  onPortPointerDown: (
    nodeId: string,
    portId: string,
    direction: 'input' | 'output',
    event: { origin: PointerEvent },
  ) => void
}

function resolveElasticOutputTarget(options: CanvasPortPointerTargetOptions, event: PointerEvent) {
  const surfaceRect = options.surface.getBoundingClientRect()
  const viewport = options.getViewport()
  const point = surfaceToWorld({ x: event.clientX - surfaceRect.left, y: event.clientY - surfaceRect.top }, viewport)
  return resolveCanvasElasticOutputTargetAtPoint(options.getNodes(), point, viewport.zoom, options.getReadOnly?.() ?? false)
}

export function resolveCanvasElasticOutputTargetAtPoint(
  nodes: readonly CanvasNode[],
  point: { x: number; y: number },
  zoom: number,
  isReadOnly = false,
): CanvasElasticOutputTarget | null {
  if (isReadOnly) return null
  const orderedNodes = [...nodes].reverse()
  const occupiedNode = orderedNodes.find((node) => {
    const size = canvasNodeVisualSize(node)
    return point.x >= node.x && point.x <= node.x + size.width && point.y >= node.y && point.y <= node.y + size.height
  })
  for (const node of orderedNodes) {
    if (node.isLocked) continue
    if (occupiedNode && occupiedNode.id !== node.id) continue
    const presentation = buildCanvasNodePresentation(node)
    const port = presentation.outputPorts[0]
    if (!port) continue
    const nodeSize = canvasNodeVisualSize(node)
    const position = resolveCanvasElasticOutputPortPosition(
      { x: point.x - node.x, y: point.y - node.y }, nodeSize, zoom,
    )
    if (position) return {
      edgeDistancePx: Math.abs(point.x - node.x - nodeSize.width) * zoom,
      nodeId: node.id, portId: port.id, localX: position.x, localY: position.y,
    }
  }
  return null
}

interface CanvasPortPointerTarget {
  nodeId: string
  portId: string
  direction: 'input' | 'output'
  distanceSquared: number
}

function resolvePointerTarget(options: CanvasPortPointerTargetOptions, event: PointerEvent) {
  const elasticOutput = resolveElasticOutputTarget(options, event)
  if (elasticOutput) return { ...elasticOutput, direction: 'output' as const, distanceSquared: 0 }
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
  let currentElasticKey = ''
  const handlePointerMove = (event: PointerEvent) => {
    const target = resolveElasticOutputTarget(options, event)
    const nextKey = target ? `${target.nodeId}:${target.portId}:${target.localX}:${target.localY}` : ''
    if (nextKey === currentElasticKey) return
    currentElasticKey = nextKey
    options.onElasticOutputChange?.(target)
  }
  const resetElasticOutput = () => {
    if (!currentElasticKey) return
    currentElasticKey = ''
    options.onElasticOutputChange?.(null)
  }
  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 1) return
    const targetElement = event.target
    const isCanvasTarget = targetElement instanceof HTMLCanvasElement
    const isConnectionTarget = targetElement instanceof SVGElement && (
      targetElement.classList.contains('connection-hit') || targetElement.classList.contains('connection-line')
    )
    if (!isCanvasTarget && !isConnectionTarget) return
    const target = resolvePointerTarget(options, event)
    if (!target) return
    event.preventDefault()
    event.stopImmediatePropagation()
    options.onPortPointerDown(target.nodeId, target.portId, target.direction, { origin: event })
  }
  options.surface.addEventListener('pointerdown', handlePointerDown, true)
  options.surface.addEventListener('pointermove', handlePointerMove, true)
  options.surface.addEventListener('pointerleave', resetElasticOutput)
  options.surface.addEventListener('pointercancel', resetElasticOutput)
  return () => {
    options.surface.removeEventListener('pointerdown', handlePointerDown, true)
    options.surface.removeEventListener('pointermove', handlePointerMove, true)
    options.surface.removeEventListener('pointerleave', resetElasticOutput)
    options.surface.removeEventListener('pointercancel', resetElasticOutput)
  }
}
