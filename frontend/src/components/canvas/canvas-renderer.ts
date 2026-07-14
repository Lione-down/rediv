import { Ellipse, Group, Image as LeaferImage, Leafer, Rect, Text } from 'leafer-ui'
import type { CanvasNode } from '../../types/canvas'
import type { ViewportState } from './canvas-geometry'
import { buildCanvasNodePresentation, isSupportedCanvasGroupNode } from './canvas-node-presentation'
import { planKeyedReconciliation } from './canvas-renderer-reconciliation'

const POINTER_DOWN = 'pointer.down'
const POINTER_MENU = 'pointer.menu'
const DOUBLE_CLICK = 'double_click'

interface NodeVisuals {
  group: Group
  ports: Array<{ id: string; direction: 'input' | 'output'; shape: Ellipse }>
  card: Rect
  mediaImage: LeaferImage
  contentText: Text
  titleText: Text
  typeText: Text
  state: NodeVisualState
}

interface NodeVisualState {
  content: string
  height: number
  isSelected: boolean
  isLocked: boolean
  status: CanvasNode['status']
  title: string
  type: CanvasNode['type']
  typeLabel: string
  isUnsupported: boolean
  mediaKey: string
  portKey: string
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
  onOutputPointerDown: (nodeId: string, portId: string, event: PointerEventPayload) => void
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
    const presentation = buildCanvasNodePresentation(node)
    const mediaKey = presentation.media
      ? `${presentation.media.kind}:${presentation.media.kind === 'image' ? presentation.media.url : presentation.media.label}`
      : ''
    return {
      content: presentation.media?.kind === 'placeholder'
        ? presentation.media.label
        : presentation.content,
      height: node.height,
      isSelected: options.getSelectedNodeIds().includes(node.id),
      isLocked: Boolean(node.isLocked),
      status: node.status,
      title: node.title,
      type: node.type,
      typeLabel: presentation.typeLabel,
      isUnsupported: presentation.isUnsupported,
      mediaKey,
      portKey: [...presentation.inputPorts, ...presentation.outputPorts]
        .map((port) => `${port.direction}:${port.id}`)
        .join('|'),
      width: node.width,
    }
  }

  function isSameNodeVisualState(left: NodeVisualState, right: NodeVisualState) {
    return (
      left.content === right.content &&
      left.height === right.height &&
      left.isSelected === right.isSelected &&
      left.isLocked === right.isLocked &&
      left.status === right.status &&
      left.title === right.title &&
      left.type === right.type &&
      left.typeLabel === right.typeLabel &&
      left.isUnsupported === right.isUnsupported &&
      left.mediaKey === right.mediaKey &&
      left.portKey === right.portKey &&
      left.width === right.width
    )
  }

  function nodeStrokeColor(node: CanvasNode) {
    if (node.status === 'running') return options.cssVar('--warning', 'oklch(70% 0.13 78)')
    if (node.status === 'warning') return options.cssVar('--danger', 'oklch(58% 0.17 27)')
    if (options.getSelectedNodeIds().includes(node.id)) return options.cssVar('--accent-select', 'oklch(58% 0.115 252)')
    return options.cssVar('--border-subtle', 'oklch(88% 0.009 92)')
  }

  function nodeShadowColor(node: CanvasNode) {
    if (node.status === 'running') return 'oklch(70% 0.13 78 / 0.18)'
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
    const presentation = buildCanvasNodePresentation(node)
    const isGroup = isSupportedCanvasGroupNode(node)
    const isMedia = presentation.visualKind === 'media' || presentation.visualKind === 'result'
    const hasEmphasis = node.status === 'running' || node.status === 'warning' || state.isSelected
    const group = new Group({ x: node.x, y: node.y })
    const card = new Rect({
      width: node.width,
      height: node.height,
      cornerRadius: isMedia ? 8 : 12,
      hit: 'rect',
      fill: isMedia
        ? 'transparent'
        : isGroup
        ? options.cssVar('--v2-accent-soft', 'oklch(65% 0.19 292 / 0.14)')
        : presentation.isUnsupported
          ? options.cssVar('--v2-surface-3', 'oklch(21% 0.035 292)')
        : options.cssVar('--canvas-node-surface', 'rgba(255, 255, 255, 0.92)'),
      stroke: nodeStrokeColor(node),
      strokeWidth: state.isSelected ? 1.5 : 1,
      shadow: isGroup || isMedia ? undefined : hasEmphasis ? { x: 0, y: 10, blur: 28, color: nodeShadowColor(node) } : undefined,
    })
    const ports = [...presentation.inputPorts, ...presentation.outputPorts].map((port) => {
      const siblings = port.direction === 'input' ? presentation.inputPorts : presentation.outputPorts
      const index = siblings.findIndex((candidate) => candidate.id === port.id)
      const shape = new Ellipse({
        x: port.direction === 'input' ? -8 : node.width - 8,
        y: (node.height * (index + 1)) / (siblings.length + 1) - 8,
        width: 16,
        height: 16,
        fill: port.direction === 'input'
          ? options.cssVar('--bg-panel', 'white')
          : options.cssVar('--accent-select', 'oklch(58% 0.115 252)'),
        stroke: options.cssVar('--canvas-port-outline', 'rgba(255, 255, 255, 0.95)'),
        strokeWidth: port.direction === 'input' ? 1.5 : 2,
        visible: !node.isLocked,
      })
      return { id: port.id, direction: port.direction, shape }
    })
    const imageMedia = presentation.media?.kind === 'image' ? presentation.media : null
    const mediaImage = new LeaferImage({
      x: 12,
      y: 62,
      width: Math.max(1, node.width - 24),
      height: Math.max(1, node.height - 74),
      cornerRadius: 8,
      stroke: options.cssVar('--border-subtle', 'rgba(255, 255, 255, 0.08)'),
      strokeWidth: 1,
      visible: false,
      ...(imageMedia ? { url: imageMedia.url } : {}),
    })
    const typeText = new Text({
      x: 16,
      y: isMedia ? -22 : 14,
      text: `${node.isLocked ? '已锁定 · ' : ''}${isGroup || isMedia ? node.title : presentation.typeLabel}`,
      fill: options.cssVar('--text-muted', 'oklch(62% 0.014 245)'),
      fontSize: 11,
      fontWeight: '500',
    })
    const titleText = new Text({
      x: 16,
      y: 34,
      width: node.width - 32,
      text: isGroup || isMedia ? '' : node.title,
      fill: options.cssVar('--text-primary', 'oklch(18% 0.014 245)'),
      fontSize: 15,
      fontWeight: '600',
    })
    const contentText = new Text({
      x: 16,
      y: 62,
      width: node.width - 32,
      text: isGroup || imageMedia ? '' : state.content,
      fill: presentation.isUnsupported
        ? options.cssVar('--danger', 'oklch(66% 0.19 24)')
        : options.cssVar('--text-secondary', 'oklch(46% 0.018 245)'),
      fontSize: 13,
      lineHeight: 22,
      textWrap: 'break',
    })

    group.add([card, mediaImage, ...ports.map((port) => port.shape), typeText, titleText, contentText])
    worldGroup.add(group)
    const visual: NodeVisuals = {
      group,
      ports,
      card,
      mediaImage,
      contentText,
      titleText,
      typeText,
      state,
    }
    nodeVisuals.set(node.id, visual)
    ;[group, card, mediaImage, ...ports.map((port) => port.shape), typeText, titleText, contentText].forEach((target) => {
      interactiveTargets.add(target)
    })
    ;(group as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
      POINTER_DOWN,
      (event) => options.onNodePointerDown(node.id, event),
    )
    for (const port of ports.filter((candidate) => candidate.direction === 'output')) {
      ;(port.shape as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
        POINTER_DOWN,
        (event) => options.onOutputPointerDown(node.id, port.id, event),
      )
    }
    return visual
  }

  function updateNodeVisual(node: CanvasNode, visual: NodeVisuals) {
    const nextState = getNodeVisualState(node)
    if (isSameNodeVisualState(visual.state, nextState)) return
    if (visual.state.portKey !== nextState.portKey) {
      worldGroup.remove(visual.group, true)
      nodeVisuals.delete(node.id)
      createNodeVisual(node)
      return
    }
    const presentation = buildCanvasNodePresentation(node)
    const isGroup = isSupportedCanvasGroupNode(node)

    visual.card.width = node.width
    visual.card.height = node.height
    visual.card.stroke = nodeStrokeColor(node)
    visual.card.fill = isGroup
      ? options.cssVar('--v2-accent-soft', 'oklch(65% 0.19 292 / 0.14)')
      : presentation.isUnsupported
        ? options.cssVar('--v2-surface-3', 'oklch(21% 0.035 292)')
      : options.cssVar('--canvas-node-surface', 'rgba(255, 255, 255, 0.92)')
    const isMedia = presentation.visualKind === 'media' || presentation.visualKind === 'result'
    const hasEmphasis = node.status === 'running' || node.status === 'warning' || nextState.isSelected
    visual.card.cornerRadius = isMedia ? 8 : 12
    if (isMedia) visual.card.fill = 'transparent'
    visual.card.strokeWidth = nextState.isSelected ? 1.5 : 1
    visual.card.shadow = isGroup || isMedia ? undefined : hasEmphasis ? { x: 0, y: 10, blur: 28, color: nodeShadowColor(node) } : undefined
    for (const port of visual.ports) {
      const siblings = visual.ports.filter((candidate) => candidate.direction === port.direction)
      const index = siblings.findIndex((candidate) => candidate.id === port.id)
      port.shape.visible = !node.isLocked
      port.shape.x = port.direction === 'input' ? -8 : node.width - 8
      port.shape.y = (node.height * (index + 1)) / (siblings.length + 1) - 8
    }
    const imageMedia = presentation.media?.kind === 'image' ? presentation.media : null
    visual.mediaImage.visible = false
    visual.mediaImage.width = Math.max(1, node.width - 24)
    visual.mediaImage.height = Math.max(1, node.height - 74)
    if (imageMedia) visual.mediaImage.url = imageMedia.url
    visual.typeText.y = isMedia ? -22 : 14
    visual.typeText.text = `${node.isLocked ? '已锁定 · ' : ''}${isGroup || isMedia ? node.title : presentation.typeLabel}`
    visual.titleText.width = node.width - 32
    visual.titleText.text = isGroup || isMedia ? '' : node.title
    visual.contentText.width = node.width - 32
    visual.contentText.text = isGroup || imageMedia ? '' : nextState.content
    visual.contentText.fill = presentation.isUnsupported
      ? options.cssVar('--danger', 'oklch(66% 0.19 24)')
      : options.cssVar('--text-secondary', 'oklch(46% 0.018 245)')
    visual.state = nextState
  }

  function syncNodeOrder(nodes: CanvasNode[]) {
    const orderedNodes = nodes
      .map((node, index) => ({ node, index }))
      .sort((left, right) => {
        const groupOrder = Number(!isSupportedCanvasGroupNode(left.node)) - Number(!isSupportedCanvasGroupNode(right.node))
        if (groupOrder) return groupOrder
        return (left.node.zIndex ?? 0) - (right.node.zIndex ?? 0) || left.index - right.index
      })
      .map(({ node }) => node)
    orderedNodes.forEach((node, index) => {
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
      return Boolean(visual?.ports.some((port) => target === port.shape))
    },
    resize,
    syncNodes,
    updateNodePosition,
    updateViewport,
  }
}
