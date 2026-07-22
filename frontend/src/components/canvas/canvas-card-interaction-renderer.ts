import { Ellipse, Rect, Text } from 'leafer-ui'
import type { CanvasNode } from '../../types/canvas'
import type { CanvasCardInteractionPresentation } from './canvas-card-interaction-presentation'
import { buildCanvasNodePresentation, canvasNodeVisualSize } from './canvas-node-presentation'
import { CANVAS_PORT_VISUAL_WORLD_SIZE, resolveCanvasPortGeometry } from './canvas-port-presentation'

type CssVarResolver = (name: string, fallback: string) => string

export interface CanvasCardPortVisual {
  id: string
  direction: 'input' | 'output'
  isPrimary: boolean
  marker: Text
  visual: Ellipse
}

const OUTLINE_TOKENS = {
  compatible: ['--canvas-node-compatible-outline', 'oklch(72% 0.13 155 / 0.92)'],
  danger: ['--danger', 'oklch(58% 0.17 27)'],
  disabled: ['--canvas-node-disabled-outline', 'oklch(94% 0.015 292 / 0.06)'],
  focus: ['--canvas-node-focus-outline', 'oklch(72% 0.17 292 / 0.72)'],
  selected: ['--canvas-node-selected-outline', 'oklch(68% 0.18 292 / 0.88)'],
  subtle: ['--canvas-node-outline', 'oklch(94% 0.015 292 / 0.1)'],
  warning: ['--warning', 'oklch(70% 0.13 78)'],
} as const

const CANVAS_PORT_MARKER_WIDTH = 12

function canvasPortMarkerX(visualX: number, visualSize: number) {
  return visualX + (visualSize - CANVAS_PORT_MARKER_WIDTH) / 2
}

export function resolveCanvasCardOutlineColor(
  presentation: CanvasCardInteractionPresentation,
  cssVar: CssVarResolver,
) {
  const [name, fallback] = OUTLINE_TOKENS[presentation.outlineTone]
  return cssVar(name, fallback)
}

export function resolveCanvasCardShadow(
  presentation: CanvasCardInteractionPresentation,
  cssVar: CssVarResolver,
) {
  if (presentation.shadowTone === 'none') return undefined
  const color = presentation.shadowTone === 'selected'
    ? cssVar('--canvas-node-selected-shadow', 'oklch(65% 0.19 292 / 0.2)')
    : presentation.shadowTone === 'warning' ? 'oklch(70% 0.13 78 / 0.18)' : 'oklch(58% 0.17 27 / 0.18)'
  return { x: 0, y: 10, blur: 28, color }
}

export function createCanvasCardPortVisuals(
  node: CanvasNode,
  zoom: number,
  presentation: CanvasCardInteractionPresentation,
  cssVar: CssVarResolver,
) {
  const nodePresentation = buildCanvasNodePresentation(node)
  const size = canvasNodeVisualSize(node)
  return [...nodePresentation.inputPorts, ...nodePresentation.outputPorts].map((port): CanvasCardPortVisual => {
    const siblings = port.direction === 'input' ? nodePresentation.inputPorts : nodePresentation.outputPorts
    const index = siblings.findIndex((candidate) => candidate.id === port.id)
    const geometry = resolveCanvasPortGeometry(port.direction, size, index, siblings.length, zoom)
    const visual = new Ellipse({
      x: geometry.visual.x, y: geometry.visual.y,
      width: geometry.visual.size, height: geometry.visual.size,
      fill: cssVar('--canvas-port-idle-fill', 'rgba(255, 255, 255, 0.24)'),
      stroke: cssVar('--canvas-port-outline', 'rgba(255, 255, 255, 0.95)'),
      strokeWidth: port.direction === 'input' ? 1.5 : 2,
      opacity: presentation.portOpacity,
      visible: presentation.portsVisible && index === 0,
      hittable: false,
    })
    const marker = new Text({
      x: canvasPortMarkerX(geometry.visual.x, geometry.visual.size), y: geometry.visual.y + 1,
      width: CANVAS_PORT_MARKER_WIDTH, height: 18, text: '+',
      fill: cssVar('--canvas-port-outline', 'rgba(255, 255, 255, 0.95)'),
      fontSize: 15, fontWeight: '500', textAlign: 'center',
      opacity: presentation.portOpacity,
      visible: presentation.portsVisible && index === 0,
      hittable: false,
    })
    return { id: port.id, direction: port.direction, isPrimary: index === 0, marker, visual }
  })
}

export function applyCanvasCardInteractionToVisuals(
  card: Rect,
  ports: readonly CanvasCardPortVisual[],
  presentation: CanvasCardInteractionPresentation,
  cssVar: CssVarResolver,
) {
  card.cornerRadius = presentation.cornerRadius
  card.stroke = resolveCanvasCardOutlineColor(presentation, cssVar)
  card.strokeWidth = presentation.outlineWidth
  card.shadow = resolveCanvasCardShadow(presentation, cssVar)
  for (const port of ports) {
    port.visual.opacity = presentation.portOpacity
    port.visual.visible = presentation.portsVisible && port.isPrimary
    port.marker.opacity = presentation.portOpacity
    port.marker.visible = presentation.portsVisible && port.isPrimary
  }
}

export function resetCanvasCardPortPositions(
  node: CanvasNode,
  ports: readonly CanvasCardPortVisual[],
  zoom: number,
) {
  const presentation = buildCanvasNodePresentation(node)
  const size = canvasNodeVisualSize(node)
  for (const port of ports) {
    const siblings = port.direction === 'input' ? presentation.inputPorts : presentation.outputPorts
    const index = siblings.findIndex((candidate) => candidate.id === port.id)
    const geometry = resolveCanvasPortGeometry(port.direction, size, index, siblings.length, zoom)
    port.visual.x = geometry.visual.x
    port.visual.y = geometry.visual.y
    port.visual.width = geometry.visual.size
    port.visual.height = geometry.visual.size
    port.marker.x = canvasPortMarkerX(geometry.visual.x, geometry.visual.size)
    port.marker.y = geometry.visual.y + 1
  }
}

export function moveCanvasCardOutputPorts(ports: readonly CanvasCardPortVisual[], localX: number, localY: number) {
  const radius = CANVAS_PORT_VISUAL_WORLD_SIZE / 2
  for (const port of ports.filter((candidate) => candidate.direction === 'output')) {
    port.visual.x = localX - radius
    port.visual.y = localY - radius
    port.marker.x = localX - CANVAS_PORT_MARKER_WIDTH / 2
    port.marker.y = localY - radius + 1
  }
}
