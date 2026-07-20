import { Ellipse, Group, Image as LeaferImage, Leafer, Rect, Text } from 'leafer-ui'
import type { CanvasNode } from '../../types/canvas'
import type { ViewportState } from './canvas-geometry'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import { resolveCanvasAuthoringCardPresentation } from './canvas-authoring-card-presentation'
import {
  createCanvasGenerationProgressVisuals,
  generationProgressVisualTargets,
  updateCanvasGenerationProgressVisuals,
  type CanvasGenerationProgressVisuals,
} from './canvas-generation-progress-visual'
import { buildCanvasNodePresentation, canvasNodeVisualSize, isSupportedCanvasGroupNode } from './canvas-node-presentation'
import { bindCanvasPortPointerTargets } from './canvas-port-interaction'
import { resolveCanvasPortGeometry } from './canvas-port-presentation'
import { planKeyedReconciliation } from './canvas-renderer-reconciliation'

const POINTER_DOWN = 'pointer.down'
const compactNodeTitle = (title: string) => title.length > 28 ? `${title.slice(0, 27)}…` : title
const POINTER_MENU = 'pointer.menu'
const DOUBLE_CLICK = 'double_click'

interface NodeVisuals extends CanvasGenerationProgressVisuals {
  group: Group
  ports: Array<{ id: string; direction: 'input' | 'output'; visual: Ellipse }>
  card: Rect
  mediaImage: LeaferImage
  contentText: Text
  titleText: Text
  typeText: Text
  state: NodeVisualState
}

interface NodeVisualState {
  authoringKey: string
  hasAuthoringLifecycle: boolean
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
  getGenerationRuntimePresentation: (nodeId: string) => GenerationRuntimePresentation | null
  getViewport: () => ViewportState
  cssVar: (name: string, fallback: string) => string
  onStagePointerDown: (event: PointerEventPayload) => void
  onContextMenu: (event: PointerEventPayload) => void
  onStageDoubleClick: (event: PointerEventPayload) => void
  onNodePointerDown: (nodeId: string, event: PointerEventPayload) => void
  onPortPointerDown: (nodeId: string, portId: string, direction: 'input' | 'output', event: PointerEventPayload) => void
}

export interface CanvasRenderer {
  destroy: () => void
  isInteractiveTarget: (target: unknown) => boolean
  isPortTarget: (nodeId: string, target: unknown) => boolean
  resize: () => void
  syncNodes: () => void
  updateNodeVisuals: (nodeIds: readonly string[]) => void
  updateNodePosition: (nodeId: string) => void
  updateViewport: () => void
}

interface CanvasRendererInspectionSurface extends HTMLElement {
  __revidCanvasInspection?: {
    getNodeScreenRect: (nodeId: string) => { height: number; width: number; x: number; y: number } | null
    getPortScreenPoint: (nodeId: string, direction: 'input' | 'output', portId: string) => { x: number; y: number } | null
  }
}

export function createCanvasRenderer(options: CanvasRendererOptions): CanvasRenderer {
  const interactiveTargets = new WeakSet<object>()
  const nodeVisuals = new Map<string, NodeVisuals>()
  const unbindPortPointerTargets = bindCanvasPortPointerTargets(options)
  const leafer = new Leafer({
    view: options.surface,
    width: Math.max(options.surface.clientWidth, 1),
    height: Math.max(options.surface.clientHeight, 1),
    fill: options.cssVar('--bg-canvas', 'oklch(98% 0.006 92)'),
  })
  const worldGroup = new Group()
  leafer.add(worldGroup)

  const inspectionSurface = options.surface as CanvasRendererInspectionSurface
  const isInspectionEnabled = new URLSearchParams(window.location.search).get('revidCanvasInspection') === '1'
  if (isInspectionEnabled) {
    Object.defineProperty(inspectionSurface, '__revidCanvasInspection', {
      configurable: true,
      value: {
        getNodeScreenRect(nodeId: string) {
          const visual = nodeVisuals.get(nodeId)
          if (!visual) return null
          const bounds = visual.card.getBounds('box', 'page')
          const surfaceBounds = options.surface.getBoundingClientRect()
          return {
            x: surfaceBounds.x + bounds.x,
            y: surfaceBounds.y + bounds.y,
            width: bounds.width,
            height: bounds.height,
          }
        },
        getPortScreenPoint(nodeId: string, direction: 'input' | 'output', portId: string) {
          const port = nodeVisuals.get(nodeId)?.ports.find((candidate) => (
            candidate.direction === direction && candidate.id === portId
          ))
          if (!port) return null
          const bounds = port.visual.getBounds('box', 'page')
          const surfaceBounds = options.surface.getBoundingClientRect()
          return {
            x: surfaceBounds.x + bounds.x + bounds.width / 2,
            y: surfaceBounds.y + bounds.y + bounds.height / 2,
          }
        },
      },
    })
  }

  function getNodeVisualState(node: CanvasNode): NodeVisualState {
    const presentation = buildCanvasNodePresentation(node)
    const authoringCard = resolveCanvasAuthoringCardPresentation(node, options.getGenerationRuntimePresentation(node.id))
    const size = canvasNodeVisualSize(node)
    const mediaKey = presentation.media
      ? `${presentation.media.kind}:${presentation.media.kind === 'image' ? presentation.media.url : presentation.media.label}`
      : ''
    return {
      authoringKey: authoringCard
        ? [
            authoringCard.kind,
            authoringCard.title,
            authoringCard.bodyPreview,
            authoringCard.isLocked,
            authoringCard.lifecycle?.label ?? '',
            authoringCard.lifecycle?.tone ?? '',
            authoringCard.lifecycle?.progressPercent ?? 'indeterminate',
            authoringCard.lifecycle?.isIndeterminate ?? false,
          ].join('|')
        : '',
      hasAuthoringLifecycle: Boolean(authoringCard?.lifecycle),
      content: presentation.media?.kind === 'placeholder'
        ? presentation.media.label
        : presentation.content,
      height: size.height,
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
      width: size.width,
    }
  }

  function isSameNodeVisualState(left: NodeVisualState, right: NodeVisualState) {
    return (
      left.authoringKey === right.authoringKey &&
      left.hasAuthoringLifecycle === right.hasAuthoringLifecycle &&
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
    if (isNodeProgress(node)) return options.cssVar('--warning', 'oklch(70% 0.13 78)')
    if (isNodeDanger(node)) return options.cssVar('--danger', 'oklch(58% 0.17 27)')
    if (options.getSelectedNodeIds().includes(node.id)) return options.cssVar('--accent-select', 'oklch(58% 0.115 252)')
    return options.cssVar('--border-subtle', 'oklch(88% 0.009 92)')
  }

  function nodeShadowColor(node: CanvasNode) {
    if (isNodeProgress(node)) return 'oklch(70% 0.13 78 / 0.18)'
    if (isNodeDanger(node)) return 'oklch(58% 0.17 27 / 0.18)'
    if (options.getSelectedNodeIds().includes(node.id)) return options.cssVar('--canvas-node-selected-shadow', 'rgba(75, 122, 255, 0.16)')
    return options.cssVar('--canvas-node-shadow', 'rgba(44, 52, 68, 0.10)')
  }

  function isNodeProgress(node: CanvasNode) {
    const runtime = options.getGenerationRuntimePresentation(node.id)
    return runtime
      ? runtime.phase === 'submitting' || runtime.phase === 'queued' || runtime.phase === 'running'
      : node.status === 'running'
  }

  function isNodeDanger(node: CanvasNode) {
    const runtime = options.getGenerationRuntimePresentation(node.id)
    return runtime
      ? runtime.phase === 'failed' || runtime.phase === 'timed_out'
      : node.status === 'warning'
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
    const authoringCard = resolveCanvasAuthoringCardPresentation(node, options.getGenerationRuntimePresentation(node.id))
    const isGroup = presentation.chrome.bodyKind === 'group'
    const isMedia = presentation.chrome.bodyKind === 'media'
    const hasExternalLabel = presentation.chrome.labelPlacement === 'external'
    const size = canvasNodeVisualSize(node)
    const hasEmphasis = isNodeProgress(node) || isNodeDanger(node) || state.isSelected
    const group = new Group({ x: node.x, y: node.y })
    const card = new Rect({
      width: size.width,
      height: size.height,
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
      const geometry = resolveCanvasPortGeometry(port.direction, size, index, siblings.length, options.getViewport().zoom)
      const visual = new Ellipse({
        x: geometry.visual.x,
        y: geometry.visual.y,
        width: geometry.visual.size,
        height: geometry.visual.size,
        fill: port.direction === 'input'
          ? options.cssVar('--canvas-port-idle-fill', 'rgba(255, 255, 255, 0.24)')
          : options.cssVar('--canvas-port-idle-fill', 'rgba(255, 255, 255, 0.24)'),
        stroke: options.cssVar('--canvas-port-outline', 'rgba(255, 255, 255, 0.95)'),
        strokeWidth: port.direction === 'input' ? 1.5 : 2,
        opacity: state.isSelected ? 1 : 0.16,
        visible: !node.isLocked,
        hittable: false,
      })
      return { id: port.id, direction: port.direction, visual }
    })
    const imageMedia = presentation.media?.kind === 'image' ? presentation.media : null
    const mediaImage = new LeaferImage({
      x: 12,
      y: 62,
      width: Math.max(1, size.width),
      height: Math.max(1, size.height),
      cornerRadius: 8,
      stroke: options.cssVar('--border-subtle', 'rgba(255, 255, 255, 0.08)'),
      strokeWidth: 1,
      visible: false,
      ...(imageMedia ? { url: imageMedia.url } : {}),
    })
    const typeText = new Text({
      x: 16,
      y: hasExternalLabel ? -22 : 14,
      text: `${node.isLocked ? '已锁定 · ' : ''}${hasExternalLabel ? presentation.chrome.label : presentation.typeLabel}`,
      fill: options.cssVar('--text-muted', 'oklch(62% 0.014 245)'),
      fontSize: authoringCard ? 10 : 11,
      fontWeight: authoringCard ? 600 : 500,
    })
    const titleText = new Text({
      x: authoringCard ? 92 : 16,
      y: authoringCard ? 10 : 34,
      width: authoringCard ? size.width - 108 : size.width - 32,
      text: hasExternalLabel ? '' : compactNodeTitle(node.title),
      fill: options.cssVar('--text-primary', 'oklch(18% 0.014 245)'),
      fontSize: authoringCard ? 14 : 15,
      fontWeight: '600',
      height: 22,
      textWrap: 'none',
      textOverflow: 'ellipsis',
    })
    const contentText = new Text({
      x: 16,
      y: hasExternalLabel ? 16 : 62,
      width: size.width - 32,
      text: authoringCard ? authoringCard.bodyPreview : isGroup || imageMedia ? '' : state.content,
      fill: presentation.isUnsupported
        ? options.cssVar('--danger', 'oklch(66% 0.19 24)')
        : options.cssVar('--text-secondary', 'oklch(46% 0.018 245)'),
      fontSize: 13,
      lineHeight: 22,
      textWrap: 'break',
      height: hasExternalLabel
        ? Math.max(22, size.height - (authoringCard?.lifecycle ? 46 : 32))
        : Math.max(22, size.height - 70),
      textOverflow: 'hide',
    })
    const progressVisuals = authoringCard?.lifecycle
      ? createCanvasGenerationProgressVisuals(authoringCard, size.width, options.cssVar)
      : {}
    const lifecycleVisuals = generationProgressVisualTargets(progressVisuals)

    group.add([card, mediaImage, ...ports.map((port) => port.visual), typeText, titleText, contentText, ...lifecycleVisuals])
    worldGroup.add(group)
    const visual: NodeVisuals = {
      group,
      ports,
      card,
      mediaImage,
      contentText,
      ...progressVisuals,
      titleText,
      typeText,
      state,
    }
    nodeVisuals.set(node.id, visual)
    ;[group, card, mediaImage, typeText, titleText, contentText, ...lifecycleVisuals].forEach((target) => {
      interactiveTargets.add(target)
    })
    ;(group as unknown as { on: (type: string, handler: (event: PointerEventPayload) => void) => void }).on(
      POINTER_DOWN,
      (event) => options.onNodePointerDown(node.id, event),
    )
    const setPortsHovered = (isHovered: boolean) => {
      for (const port of ports) port.visual.opacity = state.isSelected || isHovered ? 1 : 0.16
    }
    ;(group as unknown as { on: (type: string, handler: () => void) => void }).on('pointer.enter', () => setPortsHovered(true))
    ;(group as unknown as { on: (type: string, handler: () => void) => void }).on('pointer.leave', () => setPortsHovered(false))
    return visual
  }

  function updateNodeVisual(node: CanvasNode, visual: NodeVisuals) {
    const nextState = getNodeVisualState(node)
    if (isSameNodeVisualState(visual.state, nextState)) return
    if (visual.state.portKey !== nextState.portKey || visual.state.hasAuthoringLifecycle !== nextState.hasAuthoringLifecycle) {
      worldGroup.remove(visual.group, true)
      nodeVisuals.delete(node.id)
      createNodeVisual(node)
      return
    }
    const presentation = buildCanvasNodePresentation(node)
    const authoringCard = resolveCanvasAuthoringCardPresentation(node, options.getGenerationRuntimePresentation(node.id))
    const isGroup = presentation.chrome.bodyKind === 'group'
    const hasExternalLabel = presentation.chrome.labelPlacement === 'external'
    const size = canvasNodeVisualSize(node)

    visual.card.width = size.width
    visual.card.height = size.height
    visual.card.stroke = nodeStrokeColor(node)
    visual.card.fill = isGroup
      ? options.cssVar('--v2-accent-soft', 'oklch(65% 0.19 292 / 0.14)')
      : presentation.isUnsupported
        ? options.cssVar('--v2-surface-3', 'oklch(21% 0.035 292)')
      : options.cssVar('--canvas-node-surface', 'rgba(255, 255, 255, 0.92)')
    const isMedia = presentation.chrome.bodyKind === 'media'
    const hasEmphasis = isNodeProgress(node) || isNodeDanger(node) || nextState.isSelected
    visual.card.cornerRadius = isMedia ? 8 : 12
    if (isMedia) visual.card.fill = 'transparent'
    visual.card.strokeWidth = nextState.isSelected ? 1.5 : 1
    visual.card.shadow = isGroup || isMedia ? undefined : hasEmphasis ? { x: 0, y: 10, blur: 28, color: nodeShadowColor(node) } : undefined
    for (const port of visual.ports) {
      const siblings = port.direction === 'input' ? presentation.inputPorts : presentation.outputPorts
      const index = siblings.findIndex((candidate) => candidate.id === port.id)
      const geometry = resolveCanvasPortGeometry(
        port.direction,
        size,
        index,
        siblings.length,
        options.getViewport().zoom,
      )
      port.visual.x = geometry.visual.x
      port.visual.y = geometry.visual.y
      port.visual.width = geometry.visual.size
      port.visual.height = geometry.visual.size
      port.visual.visible = !node.isLocked
      port.visual.opacity = nextState.isSelected ? 1 : 0.16
    }
    const imageMedia = presentation.media?.kind === 'image' ? presentation.media : null
    visual.mediaImage.visible = false
    visual.mediaImage.width = Math.max(1, size.width)
    visual.mediaImage.height = Math.max(1, size.height)
    if (imageMedia) visual.mediaImage.url = imageMedia.url
    visual.typeText.y = hasExternalLabel ? -22 : 14
    visual.typeText.text = `${node.isLocked ? '已锁定 · ' : ''}${hasExternalLabel ? presentation.chrome.label : presentation.typeLabel}`
    visual.typeText.fontSize = authoringCard ? 10 : 11
    visual.typeText.fontWeight = authoringCard ? 600 : 500
    visual.titleText.x = authoringCard ? 92 : 16
    visual.titleText.y = authoringCard ? 10 : 34
    visual.titleText.width = authoringCard ? size.width - 108 : size.width - 32
    visual.titleText.fontSize = authoringCard ? 14 : 15
    visual.titleText.text = hasExternalLabel ? '' : compactNodeTitle(node.title)
    visual.contentText.width = size.width - 32
    visual.contentText.y = hasExternalLabel ? 16 : 62
    visual.contentText.height = hasExternalLabel
      ? Math.max(22, size.height - (authoringCard?.lifecycle ? 46 : 32))
      : Math.max(22, size.height - 70)
    visual.contentText.text = authoringCard ? authoringCard.bodyPreview : isGroup || imageMedia ? '' : nextState.content
    visual.contentText.fill = presentation.isUnsupported
      ? options.cssVar('--danger', 'oklch(66% 0.19 24)')
      : options.cssVar('--text-secondary', 'oklch(46% 0.018 245)')
    if (visual.statusText && authoringCard?.lifecycle) {
      updateCanvasGenerationProgressVisuals(visual, authoringCard, size.width, options.cssVar)
    }
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

  function updateNodeVisuals(nodeIds: readonly string[]) {
    const nodesById = new Map(options.getNodes().map((node) => [node.id, node]))
    for (const nodeId of nodeIds) {
      const node = nodesById.get(nodeId)
      const visual = nodeVisuals.get(nodeId)
      if (node && visual) updateNodeVisual(node, visual)
    }
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
    destroy: () => {
      unbindPortPointerTargets()
      if (isInspectionEnabled) delete inspectionSurface.__revidCanvasInspection
      leafer.destroy()
    },
    isInteractiveTarget: (target) => Boolean(target && interactiveTargets.has(target as object)),
    isPortTarget: (nodeId, target) => {
      const visual = nodeVisuals.get(nodeId)
      return Boolean(visual?.ports.some((port) => target === port.visual))
    },
    resize,
    syncNodes,
    updateNodeVisuals,
    updateNodePosition,
    updateViewport,
  }
}
