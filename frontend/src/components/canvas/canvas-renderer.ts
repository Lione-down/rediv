import { Ellipse, Group, Leafer, Rect, Text } from 'leafer-ui'
import type { CanvasNode } from '../../types/canvas'
import { worldToSurface, type ViewportState } from './canvas-geometry'

const POINTER_DOWN = 'pointer.down'

interface NodeVisuals {
  group: Group
  input: Ellipse
  output: Ellipse
}

interface PointerEventPayload {
  target?: unknown
  origin?: PointerEvent
}

interface CanvasRendererOptions {
  surface: HTMLElement
  getNodes: () => CanvasNode[]
  getSelectedNodeIds: () => string[]
  getViewport: () => ViewportState
  cssVar: (name: string, fallback: string) => string
  onStagePointerDown: (event: PointerEventPayload) => void
  onNodePointerDown: (nodeId: string, event: PointerEventPayload) => void
  onOutputPointerDown: (nodeId: string, event: PointerEventPayload) => void
}

export interface CanvasRenderer {
  destroy: () => void
  isInteractiveTarget: (target: unknown) => boolean
  isPortTarget: (nodeId: string, target: unknown) => boolean
  render: () => void
  resize: () => void
  updateNodePosition: (nodeId: string) => void
}

export function createCanvasRenderer(options: CanvasRendererOptions): CanvasRenderer {
  let interactiveTargets = new WeakSet<object>()
  const nodeVisuals = new Map<string, NodeVisuals>()
  const leafer = new Leafer({
    view: options.surface,
    width: Math.max(options.surface.clientWidth, 1),
    height: Math.max(options.surface.clientHeight, 1),
    fill: options.cssVar('--bg-canvas', 'oklch(98% 0.006 92)'),
  })

  function nodeStrokeColor(node: CanvasNode) {
    if (node.status === 'running') return options.cssVar('--warning', 'oklch(70% 0.13 78)')
    if (node.status === 'success') return options.cssVar('--success', 'oklch(60% 0.12 150)')
    if (node.status === 'warning') return options.cssVar('--danger', 'oklch(58% 0.17 27)')
    if (options.getSelectedNodeIds().includes(node.id)) return options.cssVar('--accent-select', 'oklch(58% 0.115 252)')
    return options.cssVar('--border-subtle', 'oklch(88% 0.009 92)')
  }

  function nodeShadowColor(node: CanvasNode) {
    if (node.status === 'running') return 'oklch(70% 0.13 78 / 0.18)'
    if (node.status === 'success') return 'oklch(60% 0.12 150 / 0.18)'
    if (node.status === 'warning') return 'oklch(58% 0.17 27 / 0.18)'
    if (options.getSelectedNodeIds().includes(node.id)) return 'rgba(75, 122, 255, 0.16)'
    return 'rgba(44, 52, 68, 0.10)'
  }

  function resize() {
    leafer.width = Math.max(options.surface.clientWidth, 1)
    leafer.height = Math.max(options.surface.clientHeight, 1)
  }

  function updateNodePosition(nodeId: string) {
    const visual = nodeVisuals.get(nodeId)
    const node = options.getNodes().find((candidate) => candidate.id === nodeId)
    if (!visual || !node) return

    const position = worldToSurface({ x: node.x, y: node.y }, options.getViewport())
    visual.group.x = position.x
    visual.group.y = position.y
    visual.group.scaleX = options.getViewport().zoom
    visual.group.scaleY = options.getViewport().zoom
  }

  function render() {
    const viewport = options.getViewport()
    resize()
    leafer.clear()
    leafer.fill = options.cssVar('--bg-canvas', 'oklch(98% 0.006 92)')
    nodeVisuals.clear()
    interactiveTargets = new WeakSet<object>()

    for (const node of options.getNodes()) {
      const position = worldToSurface({ x: node.x, y: node.y }, viewport)
      const group = new Group({ x: position.x, y: position.y, scaleX: viewport.zoom, scaleY: viewport.zoom })
      const card = new Rect({
        width: node.width,
        height: node.height,
        cornerRadius: 12,
        hit: 'rect',
        fill: 'rgba(255, 255, 255, 0.92)',
        stroke: nodeStrokeColor(node),
        strokeWidth: node.status === 'running' || node.status === 'success' || node.status === 'warning' || options.getSelectedNodeIds().includes(node.id) ? 2 : 1,
        shadow: { x: 0, y: 18, blur: 42, color: nodeShadowColor(node) },
      })
      const input = new Ellipse({
        x: -8,
        y: node.height / 2 - 8,
        width: 16,
        height: 16,
        fill: options.cssVar('--bg-panel', 'white'),
        stroke: options.cssVar('--border-strong', 'oklch(80% 0.014 245)'),
        strokeWidth: 1.5,
      })
      const output = new Ellipse({
        x: node.width - 8,
        y: node.height / 2 - 8,
        width: 16,
        height: 16,
        fill: options.cssVar('--accent-select', 'oklch(58% 0.115 252)'),
        stroke: 'rgba(255, 255, 255, 0.95)',
        strokeWidth: 2,
      })
      const typeText = new Text({
        x: 16,
        y: 14,
        text: node.type.toUpperCase(),
        fill: options.cssVar('--text-muted', 'oklch(62% 0.014 245)'),
        fontSize: 11,
        fontWeight: '500',
      })
      const titleText = new Text({
        x: 16,
        y: 34,
        width: node.width - 32,
        text: node.title,
        fill: options.cssVar('--text-primary', 'oklch(18% 0.014 245)'),
        fontSize: 15,
        fontWeight: '600',
      })
      const contentText = new Text({
        x: 16,
        y: 62,
        width: node.width - 32,
        text: node.content,
        fill: options.cssVar('--text-secondary', 'oklch(46% 0.018 245)'),
        fontSize: 13,
        lineHeight: 22,
        textWrap: 'break',
      })

      group.add([card, input, output, typeText, titleText, contentText])
      leafer.add(group)
      nodeVisuals.set(node.id, { group, input, output })
      ;[group, card, input, output, typeText, titleText, contentText].forEach((target) => interactiveTargets.add(target))
      ;(group as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
        POINTER_DOWN,
        (event) => options.onNodePointerDown(node.id, event),
      )
      ;(output as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
        POINTER_DOWN,
        (event) => options.onOutputPointerDown(node.id, event),
      )
    }
  }

  ;(leafer as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
    POINTER_DOWN,
    options.onStagePointerDown,
  )

  return {
    destroy: () => leafer.destroy(),
    isInteractiveTarget: (target) => Boolean(target && interactiveTargets.has(target as object)),
    isPortTarget: (nodeId, target) => {
      const visual = nodeVisuals.get(nodeId)
      return Boolean(visual && (target === visual.input || target === visual.output))
    },
    render,
    resize,
    updateNodePosition,
  }
}
