import { Group, Image as LeaferImage, Leafer, Rect, Text } from 'leafer-ui'
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
import { buildCanvasCardViewModel, canvasNodeVisualSize, isSupportedCanvasGroupNode } from './canvas-node-presentation'
import { bindCanvasPortPointerTargets, type CanvasElasticOutputTarget } from './canvas-port-interaction'
import { planKeyedReconciliation } from './canvas-renderer-reconciliation'
import { resolveCanvasCardInteractionPresentation, type CanvasCardInteractionPresentation } from './canvas-card-interaction-presentation'
import {
  applyCanvasCardInteractionToVisuals, createCanvasCardPortVisuals, moveCanvasCardOutputPorts,
  resetCanvasCardPortPositions, resolveCanvasCardOutlineColor, resolveCanvasCardShadow,
  type CanvasCardPortVisual,
} from './canvas-card-interaction-renderer'

const POINTER_DOWN = 'pointer.down'
const POINTER_MENU = 'pointer.menu'
const DOUBLE_CLICK = 'double_click'

interface NodeVisuals extends CanvasGenerationProgressVisuals {
  group: Group
  ports: CanvasCardPortVisual[]
  card: Rect
  mediaImage: LeaferImage
  contentText: Text
  titleText: Text
  typeText: Text
  interactionPresentation: CanvasCardInteractionPresentation
  state: NodeVisualState
}

interface NodeVisualState {
  authoringKey: string
  hasAuthoringLifecycle: boolean
  content: string
  height: number
  isSelected: boolean; isCompatibleDrag: boolean; isLocked: boolean; isReadOnly: boolean
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
  getCompatibleTargetNodeIds: () => ReadonlySet<string>
  getReadOnly: () => boolean
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
    getNodeInteractionPresentation: (nodeId: string) => CanvasCardInteractionPresentation | null
    getNodeScreenRect: (nodeId: string) => { height: number; width: number; x: number; y: number } | null
    getPortScreenPoint: (nodeId: string, direction: 'input' | 'output', portId: string) => { x: number; y: number } | null
    getPortMarkerScreenPoint: (nodeId: string, direction: 'input' | 'output', portId: string) => { x: number; y: number } | null
  }
}

export function createCanvasRenderer(options: CanvasRendererOptions): CanvasRenderer {
  const interactiveTargets = new WeakSet<object>()
  const nodeVisuals = new Map<string, NodeVisuals>()
  let elasticOutputNodeId = ''
  const unbindPortPointerTargets = bindCanvasPortPointerTargets({
    ...options,
    onElasticOutputChange: setElasticOutputTarget,
  })
  const leafer = new Leafer({
    view: options.surface,
    width: Math.max(options.surface.clientWidth, 1),
    height: Math.max(options.surface.clientHeight, 1),
    fill: 'transparent',
  })
  const worldGroup = new Group()
  leafer.add(worldGroup)

  const inspectionSurface = options.surface as CanvasRendererInspectionSurface
  const isInspectionEnabled = new URLSearchParams(window.location.search).get('revidCanvasInspection') === '1'
  if (isInspectionEnabled) {
    Object.defineProperty(inspectionSurface, '__revidCanvasInspection', {
      configurable: true,
      value: {
        getNodeInteractionPresentation(nodeId: string) {
          return nodeVisuals.get(nodeId)?.interactionPresentation ?? null
        },
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
        getPortMarkerScreenPoint(nodeId: string, direction: 'input' | 'output', portId: string) {
          const port = nodeVisuals.get(nodeId)?.ports.find((candidate) => (
            candidate.direction === direction && candidate.id === portId
          ))
          if (!port) return null
          const bounds = port.marker.getBounds('box', 'page')
          const surfaceBounds = options.surface.getBoundingClientRect()
          return {
            x: surfaceBounds.x + bounds.x + bounds.width / 2,
            y: surfaceBounds.y + bounds.y + bounds.height / 2,
          }
        },
      },
    })
  }

  function resolveNodeViewModel(node: CanvasNode) {
    return buildCanvasCardViewModel(node, {
      isReadOnly: options.getReadOnly(),
      isSelected: options.getSelectedNodeIds().includes(node.id),
      runtimePresentation: options.getGenerationRuntimePresentation(node.id),
    })
  }

  function getNodeVisualState(node: CanvasNode): NodeVisualState {
    const presentation = resolveNodeViewModel(node)
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
      isCompatibleDrag: options.getCompatibleTargetNodeIds().has(node.id),
      isLocked: Boolean(node.isLocked),
      isReadOnly: options.getReadOnly(),
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
      left.isCompatibleDrag === right.isCompatibleDrag &&
      left.isLocked === right.isLocked &&
      left.isReadOnly === right.isReadOnly &&
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

  function resolveNodeInteraction(node: CanvasNode, isHovered = false) {
    const runtime = options.getGenerationRuntimePresentation(node.id)
    const lifecycleTone = runtime
      ? runtime.phase === 'submitting' || runtime.phase === 'queued' || runtime.phase === 'running'
        ? 'progress'
        : runtime.phase === 'failed' || runtime.phase === 'timed_out' ? 'danger' : 'none'
      : node.status === 'running' ? 'progress' : node.status === 'warning' ? 'danger' : 'none'
    return resolveCanvasCardInteractionPresentation({
      bodyKind: resolveNodeViewModel(node).chrome.bodyKind,
      isCompatibleDrag: options.getCompatibleTargetNodeIds().has(node.id), isFocused: false, isHovered,
      isLocked: Boolean(node.isLocked), isReadOnly: options.getReadOnly(),
      isSelected: options.getSelectedNodeIds().includes(node.id), lifecycleTone,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
  }

  function resize() {
    leafer.width = Math.max(options.surface.clientWidth, 1)
    leafer.height = Math.max(options.surface.clientHeight, 1)
  }

  function updateViewport() {
    setElasticOutputTarget(null)
    const viewport = options.getViewport()
    worldGroup.x = viewport.x
    worldGroup.y = viewport.y
    worldGroup.scaleX = viewport.zoom
    worldGroup.scaleY = viewport.zoom
  }

  function resetOutputPorts(nodeId: string) {
    const node = options.getNodes().find((candidate) => candidate.id === nodeId)
    const visual = nodeVisuals.get(nodeId)
    if (!node || !visual) return
    resetCanvasCardPortPositions(node, visual.ports, options.getViewport().zoom)
    applyNodeInteraction(visual, resolveNodeInteraction(node))
  }

  function setElasticOutputTarget(target: CanvasElasticOutputTarget | null) {
    if (elasticOutputNodeId && elasticOutputNodeId !== target?.nodeId) resetOutputPorts(elasticOutputNodeId)
    elasticOutputNodeId = target?.nodeId ?? ''
    if (!target) return
    const node = options.getNodes().find((candidate) => candidate.id === target.nodeId)
    const visual = nodeVisuals.get(target.nodeId)
    if (!node || !visual || node.isLocked || options.getReadOnly()) {
      elasticOutputNodeId = ''
      return
    }
    moveCanvasCardOutputPorts(visual.ports, target.localX, target.localY)
    applyNodeInteraction(visual, resolveNodeInteraction(node, true))
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
    const interactionPresentation = resolveNodeInteraction(node)
    const presentation = resolveNodeViewModel(node)
    const authoringCard = resolveCanvasAuthoringCardPresentation(node, options.getGenerationRuntimePresentation(node.id))
    const isGroup = presentation.chrome.bodyKind === 'group'
    const isMedia = presentation.chrome.bodyKind === 'media'
    const hasExternalLabel = presentation.chrome.labelPlacement === 'external'
    const size = canvasNodeVisualSize(node)
    const group = new Group({ x: node.x, y: node.y })
    const card = new Rect({
      width: size.width,
      height: size.height,
      cornerRadius: interactionPresentation.cornerRadius,
      hit: 'rect',
      fill: isMedia
        ? 'transparent'
        : isGroup
        ? options.cssVar('--v2-accent-soft', 'oklch(65% 0.19 292 / 0.14)')
        : presentation.isUnsupported
          ? options.cssVar('--v2-surface-3', 'oklch(21% 0.035 292)')
        : options.cssVar('--canvas-node-surface', 'rgba(255, 255, 255, 0.92)'),
      stroke: resolveCanvasCardOutlineColor(interactionPresentation, options.cssVar),
      strokeWidth: interactionPresentation.outlineWidth,
      shadow: resolveCanvasCardShadow(interactionPresentation, options.cssVar),
    })
    const ports = createCanvasCardPortVisuals(node, options.getViewport().zoom, interactionPresentation, options.cssVar)
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
      text: hasExternalLabel
        ? ''
        : `${node.isLocked ? '已锁定 · ' : ''}${presentation.typeLabel}`,
      fill: options.cssVar('--text-muted', 'oklch(62% 0.014 245)'),
      fontSize: authoringCard ? 10 : 11,
      fontWeight: authoringCard ? 600 : 500,
    })
    const titleText = new Text({
      x: authoringCard ? 92 : 16,
      y: authoringCard ? 10 : 34,
      width: authoringCard ? size.width - 108 : size.width - 32,
      text: '',
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

    group.add([card, mediaImage, ...ports.flatMap((port) => [port.visual, port.marker]), typeText, titleText, contentText, ...lifecycleVisuals])
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
      interactionPresentation,
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
    const setHovered = (isHovered: boolean) => {
      applyNodeInteraction(visual, resolveNodeInteraction(node, isHovered))
    }
    ;(group as unknown as { on: (type: string, handler: () => void) => void }).on('pointer.enter', () => setHovered(true))
    ;(group as unknown as { on: (type: string, handler: () => void) => void }).on('pointer.leave', () => setHovered(false))
    return visual
  }

  function applyNodeInteraction(visual: NodeVisuals, presentation: CanvasCardInteractionPresentation) {
    applyCanvasCardInteractionToVisuals(visual.card, visual.ports, presentation, options.cssVar)
    visual.interactionPresentation = presentation
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
    const presentation = resolveNodeViewModel(node)
    const authoringCard = resolveCanvasAuthoringCardPresentation(node, options.getGenerationRuntimePresentation(node.id))
    const isGroup = presentation.chrome.bodyKind === 'group'
    const hasExternalLabel = presentation.chrome.labelPlacement === 'external'
    const size = canvasNodeVisualSize(node)

    visual.card.width = size.width
    visual.card.height = size.height
    visual.card.fill = isGroup
      ? options.cssVar('--v2-accent-soft', 'oklch(65% 0.19 292 / 0.14)')
      : presentation.isUnsupported
        ? options.cssVar('--v2-surface-3', 'oklch(21% 0.035 292)')
      : options.cssVar('--canvas-node-surface', 'rgba(255, 255, 255, 0.92)')
    const isMedia = presentation.chrome.bodyKind === 'media'
    if (isMedia) visual.card.fill = 'transparent'
    const interactionPresentation = resolveNodeInteraction(node)
    applyNodeInteraction(visual, interactionPresentation)
    resetCanvasCardPortPositions(node, visual.ports, options.getViewport().zoom)
    const imageMedia = presentation.media?.kind === 'image' ? presentation.media : null
    visual.mediaImage.visible = false
    visual.mediaImage.width = Math.max(1, size.width)
    visual.mediaImage.height = Math.max(1, size.height)
    if (imageMedia) visual.mediaImage.url = imageMedia.url
    visual.typeText.y = hasExternalLabel ? -22 : 14
    visual.typeText.text = hasExternalLabel
      ? ''
      : `${node.isLocked ? '已锁定 · ' : ''}${presentation.typeLabel}`
    visual.typeText.fontSize = authoringCard ? 10 : 11
    visual.typeText.fontWeight = authoringCard ? 600 : 500
    visual.titleText.x = authoringCard ? 92 : 16
    visual.titleText.y = authoringCard ? 10 : 34
    visual.titleText.width = authoringCard ? size.width - 108 : size.width - 32
    visual.titleText.fontSize = authoringCard ? 14 : 15
    visual.titleText.text = ''
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
    const elasticNode = nodes.find((node) => node.id === elasticOutputNodeId)
    if (elasticOutputNodeId && (!elasticNode || elasticNode.isLocked || options.getReadOnly())) setElasticOutputTarget(null)
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
