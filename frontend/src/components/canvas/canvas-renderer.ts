import { Ellipse, Group, Leafer, Rect, Text } from 'leafer-ui'
import type { CanvasNode } from '../../types/canvas'
import type { ViewportState } from './canvas-geometry'
import { planKeyedReconciliation } from './canvas-renderer-reconciliation'

const POINTER_DOWN = 'pointer.down'
const POINTER_MENU = 'pointer.menu'
const DOUBLE_CLICK = 'double_click'

interface NodeVisuals {
  group: Group
  input: Ellipse
  output: Ellipse
  card: Rect
  contentText: Text
  titleText: Text
  typeText: Text
  state: NodeVisualState
}

interface NodeVisualState {
  content: string
  height: number
  isSelected: boolean
  status: CanvasNode['status']
  title: string
  type: CanvasNode['type']
  width: number
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
  onContextMenu: (event: PointerEventPayload) => void
  onStageDoubleClick: (event: PointerEventPayload) => void
  onNodePointerDown: (nodeId: string, event: PointerEventPayload) => void
  onOutputPointerDown: (nodeId: string, event: PointerEventPayload) => void
}

export interface CanvasRenderer {
  destroy: () => void
  isInteractiveTarget: (target: unknown) => boolean
  isPortTarget: (nodeId: string, target: unknown) => boolean
  resize: () => void
  syncNodes: () => void
  updateNodePosition: (nodeId: string) => void
  updateViewport: () => void
}

export function createCanvasRenderer(options: CanvasRendererOptions): CanvasRenderer {
  const interactiveTargets = new WeakSet<object>()
  const nodeVisuals = new Map<string, NodeVisuals>()
  const leafer = new Leafer({
    view: options.surface,
    width: Math.max(options.surface.clientWidth, 1),
    height: Math.max(options.surface.clientHeight, 1),
    fill: options.cssVar('--bg-canvas', 'oklch(98% 0.006 92)'),
  })
  const worldGroup = new Group()
  leafer.add(worldGroup)

  function getNodeVisualState(node: CanvasNode): NodeVisualState {
    return {
      content: node.content ?? '',
      height: node.height,
      isSelected: options.getSelectedNodeIds().includes(node.id),
      status: node.status,
      title: node.title,
      type: node.type,
      width: node.width,
    }
  }

  function isSameNodeVisualState(left: NodeVisualState, right: NodeVisualState) {
    return (
      left.content === right.content &&
      left.height === right.height &&
      left.isSelected === right.isSelected &&
      left.status === right.status &&
      left.title === right.title &&
      left.type === right.type &&
      left.width === right.width
    )
  }

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
    if (options.getSelectedNodeIds().includes(node.id)) return options.cssVar('--canvas-node-selected-shadow', 'rgba(75, 122, 255, 0.16)')
    return options.cssVar('--canvas-node-shadow', 'rgba(44, 52, 68, 0.10)')
  }

  function resize() {
    leafer.width = Math.max(options.surface.clientWidth, 1)
    leafer.height = Math.max(options.surface.clientHeight, 1)
  }

  function updateViewport() {
    const viewport = options.getViewport()
    worldGroup.x = viewport.x
    worldGroup.y = viewport.y
    worldGroup.scaleX = viewport.zoom
    worldGroup.scaleY = viewport.zoom
  }

  function updateNodePosition(nodeId: string) {
    const visual = nodeVisuals.get(nodeId)
    const node = options.getNodes().find((candidate) => candidate.id === nodeId)
    if (!visual || !node) return

    visual.group.x = node.x
    visual.group.y = node.y
  }

  function createNodeVisual(node: CanvasNode) {
    const state = getNodeVisualState(node)
    const hasEmphasis = node.status === 'running' || node.status === 'success' || node.status === 'warning' || state.isSelected
    const group = new Group({ x: node.x, y: node.y })
    const card = new Rect({
      width: node.width,
      height: node.height,
      cornerRadius: 12,
      hit: 'rect',
      fill: options.cssVar('--canvas-node-surface', 'rgba(255, 255, 255, 0.92)'),
      stroke: nodeStrokeColor(node),
      strokeWidth: hasEmphasis ? 2 : 1,
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
      stroke: options.cssVar('--canvas-port-outline', 'rgba(255, 255, 255, 0.95)'),
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
      text: node.content ?? '',
      fill: options.cssVar('--text-secondary', 'oklch(46% 0.018 245)'),
      fontSize: 13,
      lineHeight: 22,
      textWrap: 'break',
    })

    group.add([card, input, output, typeText, titleText, contentText])
    worldGroup.add(group)
    const visual: NodeVisuals = {
      group,
      input,
      output,
      card,
      contentText,
      titleText,
      typeText,
      state,
    }
    nodeVisuals.set(node.id, visual)
    ;[group, card, input, output, typeText, titleText, contentText].forEach((target) => {
      interactiveTargets.add(target)
    })
    ;(group as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
      POINTER_DOWN,
      (event) => options.onNodePointerDown(node.id, event),
    )
    ;(output as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
      POINTER_DOWN,
      (event) => options.onOutputPointerDown(node.id, event),
    )
    return visual
  }

  function updateNodeVisual(node: CanvasNode, visual: NodeVisuals) {
    const nextState = getNodeVisualState(node)
    if (isSameNodeVisualState(visual.state, nextState)) return

    visual.card.width = node.width
    visual.card.height = node.height
    visual.card.stroke = nodeStrokeColor(node)
    const hasEmphasis = node.status === 'running' || node.status === 'success' || node.status === 'warning' || nextState.isSelected
    visual.card.strokeWidth = hasEmphasis ? 2 : 1
    visual.card.shadow = { x: 0, y: 18, blur: 42, color: nodeShadowColor(node) }
    visual.input.y = node.height / 2 - 8
    visual.output.x = node.width - 8
    visual.output.y = node.height / 2 - 8
    visual.typeText.text = node.type.toUpperCase()
    visual.titleText.width = node.width - 32
    visual.titleText.text = node.title
    visual.contentText.width = node.width - 32
    visual.contentText.text = node.content ?? ''
    visual.state = nextState
  }

  function syncNodeOrder(nodes: CanvasNode[]) {
    nodes.forEach((node, index) => {
      const group = nodeVisuals.get(node.id)?.group
      if (group && worldGroup.children[index] !== group) worldGroup.addAt(group, index)
    })
  }

  function syncNodes() {
    const nodes = options.getNodes()
    const plan = planKeyedReconciliation(nodeVisuals.keys(), nodes)

    for (const nodeId of plan.remove) {
      const visual = nodeVisuals.get(nodeId)
      if (!visual) continue
      worldGroup.remove(visual.group, true)
      nodeVisuals.delete(nodeId)
    }
    for (const node of plan.create) createNodeVisual(node)
    for (const node of plan.update) {
      const visual = nodeVisuals.get(node.id)
      if (visual) updateNodeVisual(node, visual)
    }
    syncNodeOrder(nodes)
  }

  ;(leafer as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
    POINTER_DOWN,
    options.onStagePointerDown,
  )
  ;(leafer as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
    POINTER_MENU,
    options.onContextMenu,
  )
  ;(leafer as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
    DOUBLE_CLICK,
    options.onStageDoubleClick,
  )

  return {
    destroy: () => leafer.destroy(),
    isInteractiveTarget: (target) => Boolean(target && interactiveTargets.has(target as object)),
    isPortTarget: (nodeId, target) => {
      const visual = nodeVisuals.get(nodeId)
      return Boolean(visual && (target === visual.input || target === visual.output))
    },
    resize,
    syncNodes,
    updateNodePosition,
    updateViewport,
  }
}
