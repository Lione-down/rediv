import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import {
  buildConnectionPath,
  calculateMinimapMetrics,
  clampZoom,
  minimapPointToWorld,
  minimapNodeStyle as getMinimapNodeStyle,
  minimapViewportStyle as getMinimapViewportStyle,
  nodeInputAnchor as getNodeInputAnchor,
  nodeOutputAnchor as getNodeOutputAnchor,
  normalizeViewport,
  nodeIntersectsRect,
  rectFromPoints,
  surfaceToWorld,
  viewportWorldRect as getViewportWorldRect,
  worldToSurface,
  type Point,
  type ViewportState,
} from '../canvas-geometry'
import { createCanvasRenderer, type CanvasRenderer } from '../canvas-renderer'
import { useCanvasContextMenu } from './use-canvas-context-menu'

interface DragState {
  nodeId: string
  pointerId: number | null
  offsetX: number
  offsetY: number
  originX: number
  originY: number
  moved: boolean
}
interface PanState { pointerId: number | null; startClientX: number; startClientY: number; originX: number; originY: number }
interface DraftConnectionState { fromNodeId: string; pointerId: number | null; currentX: number; currentY: number }
interface MarqueeState { pointerId: number | null; start: Point; current: Point; additive: boolean }
interface NativePointerLikeEvent extends MouseEvent { pointerId?: number }
interface LeaferPointerEvent { target?: unknown; origin?: NativePointerLikeEvent }
interface StageNotice { kind: 'missing' | 'loading' | 'error' | 'empty'; title: string; detail: string; canRetry?: boolean }
type StatusVisualState = Extract<NonNullable<CanvasNode['status']>, 'running' | 'success' | 'warning'>

interface CanvasStageOptions {
  isReadOnly?: () => boolean
}

export function useCanvasStage(options: CanvasStageOptions = {}) {
  const canvasStore = useCanvasStore()
  const stageRef = ref<HTMLElement | null>(null)
  const canvasSurfaceRef = ref<HTMLElement | null>(null)
  const minimapRef = ref<HTMLElement | null>(null)
  const draftConnection = ref<DraftConnectionState | null>(null)
  const marquee = ref<MarqueeState | null>(null)
  const surfaceViewportSize = ref({ width: 0, height: 0 })
  const minimapSize = ref({ width: 160, height: 104 })
  const isSpacePressed = ref(false)
  const isPanning = ref(false)
  let renderer: CanvasRenderer | null = null
  let resizeObserver: ResizeObserver | null = null
  let dragState: DragState | null = null
  let panState: PanState | null = null
  let windowPointerListenersBound = false

  const statusIconMap: Record<StatusVisualState, typeof Loader2 | typeof CheckCircle2 | typeof AlertCircle> = {
    running: Loader2, success: CheckCircle2, warning: AlertCircle,
  }
  const sceneSignature = computed(() => JSON.stringify({
    selectedNodeIds: canvasStore.selectedNodeIds,
    nodes: canvasStore.nodes.map(({ id, type, title, content, status, width, height }) => ({
      id, type, title, content, status, width, height,
    })),
    connections: canvasStore.connections.map(({ id, from, to, active }) => ({ id, from, to, active })),
  }))
  const nodePositions = computed(() => canvasStore.nodes.map(({ id, x, y }) => ({ id, x, y })))
  const viewportSignature = computed(() => JSON.stringify({ ...canvasStore.viewport, ...surfaceViewportSize.value }))
  const viewportCursor = computed(() => {
    if (isPanning.value) return 'grabbing'
    if (canvasStore.mode === 'hand' || isSpacePressed.value) return 'grab'
    return 'default'
  })
  const viewportWorldRect = computed(() => getViewportWorldRect(getViewport(), surfaceViewportSize.value))
  const minimapMetrics = computed(() => calculateMinimapMetrics(canvasStore.nodes, viewportWorldRect.value, minimapSize.value))
  const minimapViewportStyle = computed(() => getMinimapViewportStyle(viewportWorldRect.value, minimapMetrics.value))
  const statusNodes = computed(() => canvasStore.nodes.filter(
    (node): node is CanvasNode & { status: StatusVisualState } =>
      node.status === 'running' || node.status === 'success' || node.status === 'warning',
  ))
  const temporaryConnectionPath = computed(() => {
    const draft = draftConnection.value
    return draft ? buildConnectionPath(nodeOutputAnchor(draft.fromNodeId), { x: draft.currentX, y: draft.currentY }) : ''
  })
  const marqueeStyle = computed(() => {
    if (!marquee.value) return null
    const rect = rectFromPoints(marquee.value.start, marquee.value.current)
    return { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }
  })
  const stageNotice = computed<StageNotice | null>(() => {
    if (!canvasStore.activeProjectId) {
      return { kind: 'missing', title: '未选择项目', detail: '请从项目列表进入工作流后加载画布。' }
    }
    if (canvasStore.isLoading && !canvasStore.hasLoaded) {
      return { kind: 'loading', title: '正在加载画布', detail: '正在同步项目节点与连线…' }
    }
    if (canvasStore.loadError) {
      return { kind: 'error', title: '画布加载失败', detail: canvasStore.loadError, canRetry: true }
    }
    if (canvasStore.hasLoaded && canvasStore.nodes.length === 0) {
      return { kind: 'empty', title: '画布为空', detail: '当前项目还没有节点。' }
    }
    return null
  })
  const {
    closeContextMenu, contextMenu, contextMenuOptions, handleContextMenu,
    handleContextMenuSelect, handleStageDoubleClick, updateContextMenuShow,
  } = useCanvasContextMenu({
    cancelActiveInteraction,
    findNodeAtWorldPoint,
    getViewport,
    isReadOnly: () => options.isReadOnly?.() ?? false,
    toSurfacePoint,
  })

  function cssVar(name: string, fallback: string) {
    if (!canvasSurfaceRef.value) return fallback
    return getComputedStyle(canvasSurfaceRef.value).getPropertyValue(name).trim() || fallback
  }
  function getViewport(): ViewportState { return normalizeViewport(canvasStore.viewport) }
  function updateViewport(next: Partial<ViewportState>) {
    const current = getViewport()
    canvasStore.updateViewport({
      zoom: clampZoom(next.zoom ?? current.zoom),
      x: next.x ?? current.x,
      y: next.y ?? current.y,
    })
  }
  function findNode(nodeId: string) { return canvasStore.nodes.find((node) => node.id === nodeId) ?? null }
  function findNodeAtWorldPoint(point: Point) {
    return [...canvasStore.nodes].reverse().find((node) => (
      point.x >= node.x && point.x <= node.x + node.width &&
      point.y >= node.y && point.y <= node.y + node.height
    )) ?? null
  }
  function nodeInputAnchor(nodeId: string) {
    const node = findNode(nodeId)
    return node ? getNodeInputAnchor(node, getViewport()) : { x: 0, y: 0 }
  }
  function nodeOutputAnchor(nodeId: string) {
    const node = findNode(nodeId)
    return node ? getNodeOutputAnchor(node, getViewport()) : { x: 0, y: 0 }
  }
  function minimapNodeStyle(node: CanvasNode) { return getMinimapNodeStyle(node, minimapMetrics.value) }
  function surfaceNodeRectStyle(node: CanvasNode) {
    const position = worldToSurface({ x: node.x, y: node.y }, getViewport())
    const zoom = getViewport().zoom
    return { left: `${position.x}px`, top: `${position.y}px`, width: `${node.width * zoom}px`, height: `${node.height * zoom}px` }
  }
  function statusBadgeStyle() {
    const zoom = getViewport().zoom
    return { left: `${16 * zoom}px`, top: `${14 * zoom}px`, transform: `scale(${Math.max(0.88, Math.min(zoom, 1.2))})`, transformOrigin: 'top left' }
  }
  function statusLabel(status: StatusVisualState) {
    if (status === 'running') return '运行中'
    if (status === 'success') return '已完成'
    return '生成失败'
  }
  function centerNodeInViewport(nodeId: string) {
    const node = findNode(nodeId)
    if (!node) return
    const viewport = getViewport()
    updateViewport({
      x: surfaceViewportSize.value.width / 2 - (node.x + node.width / 2) * viewport.zoom,
      y: surfaceViewportSize.value.height / 2 - (node.y + node.height / 2) * viewport.zoom,
    })
  }
  function handleMinimapPointerDown(event: PointerEvent) {
    if (event.button !== 0) return
    const rect = minimapRef.value?.getBoundingClientRect()
    if (!rect) return
    const worldPoint = minimapPointToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, minimapMetrics.value)
    const viewport = getViewport()
    updateViewport({
      x: surfaceViewportSize.value.width / 2 - worldPoint.x * viewport.zoom,
      y: surfaceViewportSize.value.height / 2 - worldPoint.y * viewport.zoom,
    })
  }
  function handleConnectionPointerDown(connectionId: string, event: PointerEvent) {
    if (event.button !== 0 || canvasStore.mode !== 'select') return
    cancelActiveInteraction()
    closeContextMenu()
    canvasStore.selectConnection(connectionId)
  }
  function retryProjectLoad() {
    if (!canvasStore.activeProjectId) return
    void canvasStore.reloadActiveDocument().catch(() => undefined)
  }
  function toSurfacePoint(clientX: number, clientY: number) {
    const rect = stageRef.value?.getBoundingClientRect()
    return rect ? { x: clientX - rect.left, y: clientY - rect.top } : null
  }
  function shouldStartPan(origin?: NativePointerLikeEvent, allowSpaceDrag = true) {
    return Boolean(origin && (origin.button === 1 || canvasStore.mode === 'hand' || (allowSpaceDrag && isSpacePressed.value && origin.button === 0)))
  }
  function bindWindowPointerListeners() {
    if (windowPointerListenersBound) return
    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)
    windowPointerListenersBound = true
  }
  function unbindWindowPointerListeners() {
    if (!windowPointerListenersBound) return
    window.removeEventListener('pointermove', handleWindowPointerMove)
    window.removeEventListener('pointerup', handleWindowPointerUp)
    window.removeEventListener('pointercancel', handleWindowPointerUp)
    windowPointerListenersBound = false
  }
  function startPan(origin?: NativePointerLikeEvent) {
    if (!origin) return
    dragState = null
    draftConnection.value = null
    panState = { pointerId: origin.pointerId ?? null, startClientX: origin.clientX, startClientY: origin.clientY, originX: getViewport().x, originY: getViewport().y }
    isPanning.value = true
    bindWindowPointerListeners()
  }
  function handleStagePointerDown(event: LeaferPointerEvent) {
    if (renderer?.isInteractiveTarget(event.target)) return
    if (shouldStartPan(event.origin)) return startPan(event.origin)
    const origin = event.origin
    const point = origin ? toSurfacePoint(origin.clientX, origin.clientY) : null
    if (!origin || origin.button !== 0 || !point || canvasStore.mode !== 'select') return
    const additive = origin.ctrlKey || origin.metaKey || origin.shiftKey
    if (!additive) canvasStore.setSelection([])
    marquee.value = { pointerId: origin.pointerId ?? null, start: point, current: point, additive }
    bindWindowPointerListeners()
  }
  function handleNodePointerDown(nodeId: string, event: LeaferPointerEvent) {
    if (renderer?.isPortTarget(nodeId, event.target)) return
    if (shouldStartPan(event.origin)) return startPan(event.origin)
    const node = findNode(nodeId)
    const point = event.origin ? toSurfacePoint(event.origin.clientX, event.origin.clientY) : null
    if (!node || !point) return
    canvasStore.selectNode(nodeId, event.origin?.ctrlKey || event.origin?.metaKey || event.origin?.shiftKey ? 'toggle' : 'replace')
    if (options.isReadOnly?.()) return
    const worldPoint = surfaceToWorld(point, getViewport())
    dragState = {
      nodeId,
      pointerId: event.origin?.pointerId ?? null,
      offsetX: worldPoint.x - node.x,
      offsetY: worldPoint.y - node.y,
      originX: node.x,
      originY: node.y,
      moved: false,
    }
    bindWindowPointerListeners()
  }
  function handleOutputPointerDown(nodeId: string, event: LeaferPointerEvent) {
    if (shouldStartPan(event.origin, false)) return startPan(event.origin)
    canvasStore.selectNode(nodeId)
    if (options.isReadOnly?.()) return
    const anchor = nodeOutputAnchor(nodeId)
    dragState = null
    draftConnection.value = { fromNodeId: nodeId, pointerId: event.origin?.pointerId ?? null, currentX: anchor.x, currentY: anchor.y }
    bindWindowPointerListeners()
  }
  function handleWindowPointerMove(event: PointerEvent) {
    if (panState) {
      if (panState.pointerId !== null && event.pointerId !== panState.pointerId) return
      updateViewport({ x: panState.originX + event.clientX - panState.startClientX, y: panState.originY + event.clientY - panState.startClientY })
      return
    }
    if (dragState) {
      if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return
      const point = toSurfacePoint(event.clientX, event.clientY)
      const node = findNode(dragState.nodeId)
      if (!point || !node) return
      const worldPoint = surfaceToWorld(point, getViewport())
      const nextX = worldPoint.x - dragState.offsetX
      const nextY = worldPoint.y - dragState.offsetY
      dragState.moved = dragState.moved || nextX !== dragState.originX || nextY !== dragState.originY
      node.x = nextX
      node.y = nextY
      renderer?.updateNodePosition(node.id)
      return
    }
    const draft = draftConnection.value
    if (marquee.value) {
      if (marquee.value.pointerId !== null && event.pointerId !== marquee.value.pointerId) return
      const point = toSurfacePoint(event.clientX, event.clientY)
      if (point) marquee.value = { ...marquee.value, current: point }
      return
    }
    if (!draft || (draft.pointerId !== null && event.pointerId !== draft.pointerId)) return
    const point = toSurfacePoint(event.clientX, event.clientY)
    if (point) draftConnection.value = { ...draft, currentX: point.x, currentY: point.y }
  }
  function findConnectionTarget(point: Point, sourceNodeId: string) {
    let match: CanvasNode | null = null
    let matchedDistance = Number.POSITIVE_INFINITY
    for (const node of canvasStore.nodes) {
      if (node.id === sourceNodeId) continue
      const anchor = nodeInputAnchor(node.id)
      const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y)
      if (distance <= 24 && distance < matchedDistance) { match = node; matchedDistance = distance }
    }
    return match
  }
  function finalizeDraftConnection(point: Point) {
    const draft = draftConnection.value
    if (!draft) return
    const target = findConnectionTarget(point, draft.fromNodeId)
    const exists = target && canvasStore.connections.some((connection) => connection.from === draft.fromNodeId && connection.to === target.id)
    if (target && !exists) {
      void canvasStore.createConnection({ from: draft.fromNodeId, to: target.id, sourcePort: 'out', targetPort: 'in' }).catch(() => undefined)
    }
    draftConnection.value = null
  }
  function handleWindowPointerUp(event: PointerEvent) {
    if (panState && (panState.pointerId === null || event.pointerId === panState.pointerId)) { panState = null; isPanning.value = false }
    if (dragState && (dragState.pointerId === null || event.pointerId === dragState.pointerId)) {
      const nodeId = dragState.nodeId
      const didMove = dragState.moved
      dragState = null
      renderer?.updateNodePosition(nodeId)
      const node = findNode(nodeId)
      if (node && didMove) canvasStore.queueNodeMove(nodeId, node.x, node.y)
    }
    const draft = draftConnection.value
    if (draft && (draft.pointerId === null || event.pointerId === draft.pointerId)) {
      const point = toSurfacePoint(event.clientX, event.clientY)
      if (point) finalizeDraftConnection(point)
      else draftConnection.value = null
    }
    if (marquee.value && (marquee.value.pointerId === null || event.pointerId === marquee.value.pointerId)) {
      const selection = marquee.value
      const worldStart = surfaceToWorld(selection.start, getViewport())
      const worldEnd = surfaceToWorld(selection.current, getViewport())
      const selectedIds = canvasStore.nodes
        .filter((node) => nodeIntersectsRect(node, rectFromPoints(worldStart, worldEnd)))
        .map((node) => node.id)
      canvasStore.setSelection(selection.additive ? [...canvasStore.selectedNodeIds, ...selectedIds] : selectedIds)
      marquee.value = null
    }
    if (!panState && !dragState && !draftConnection.value && !marquee.value) unbindWindowPointerListeners()
  }
  function applyZoomAtPoint(nextZoom: number, point: Point) {
    const viewport = getViewport()
    const zoom = clampZoom(nextZoom)
    if (Math.abs(zoom - viewport.zoom) < 0.0001) return
    const worldPoint = surfaceToWorld(point, viewport)
    updateViewport({ zoom, x: point.x - worldPoint.x * zoom, y: point.y - worldPoint.y * zoom })
  }
  function handleSurfaceWheel(event: WheelEvent) {
    event.preventDefault()
    const point = toSurfacePoint(event.clientX, event.clientY)
    if (point) applyZoomAtPoint(getViewport().zoom * Math.exp(-event.deltaY * 0.0015), point)
  }
  function isEditableTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  }
  function cancelActiveInteraction() {
    const wasActive = Boolean(dragState || panState || draftConnection.value || marquee.value)
    if (dragState) {
      const node = findNode(dragState.nodeId)
      if (node) {
        node.x = dragState.originX
        node.y = dragState.originY
        renderer?.updateNodePosition(node.id)
      }
    }
    dragState = null
    panState = null
    draftConnection.value = null
    marquee.value = null
    isPanning.value = false
    unbindWindowPointerListeners()
    return wasActive
  }
  async function deleteSelectedNodes() {
    const nodeIds = [...canvasStore.selectedNodeIds]
    for (const nodeId of nodeIds) {
      try { await canvasStore.deleteNode(nodeId) } catch { /* Store reports the owned failure. */ }
    }
  }
  async function deleteSelectedConnection() {
    const connectionId = canvasStore.selectedConnectionId
    if (!connectionId) return
    canvasStore.selectConnection('')
    try {
      await canvasStore.deleteConnection(connectionId)
    } catch {
      if (!canvasStore.selectedConnectionId && canvasStore.connections.some((connection) => connection.id === connectionId)) {
        canvasStore.selectConnection(connectionId)
      }
    }
  }
  function handleWindowKeyDown(event: KeyboardEvent) {
    if (event.key === ' ') isSpacePressed.value = true
    if (isEditableTarget(event.target)) return
    if (event.key === 'Escape') {
      if (contextMenu.value.show) {
        closeContextMenu()
        return
      }
      if (!cancelActiveInteraction()) {
        if (canvasStore.selectedConnectionId) canvasStore.selectConnection('')
        else canvasStore.setSelection([])
      }
      return
    }
    if (options.isReadOnly?.()) return
    if ((event.key === 'Delete' || event.key === 'Backspace') && canvasStore.selectedConnectionId && !event.repeat) {
      event.preventDefault()
      void deleteSelectedConnection()
      return
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && canvasStore.selectedNodeIds.length > 0 && !event.repeat) {
      event.preventDefault()
      void deleteSelectedNodes()
    }
  }
  function handleWindowKeyUp(event: KeyboardEvent) { if (event.key === ' ') isSpacePressed.value = false }

  onMounted(() => {
    const surface = canvasSurfaceRef.value
    const stage = stageRef.value
    if (!surface || !stage) return
    surfaceViewportSize.value = { width: Math.max(stage.clientWidth, 1), height: Math.max(stage.clientHeight, 1) }
    renderer = createCanvasRenderer({
      surface, getNodes: () => canvasStore.nodes, getSelectedNodeIds: () => canvasStore.selectedNodeIds,
      getViewport, cssVar, onStagePointerDown: handleStagePointerDown,
      onContextMenu: handleContextMenu, onStageDoubleClick: handleStageDoubleClick,
      onNodePointerDown: handleNodePointerDown, onOutputPointerDown: handleOutputPointerDown,
    })
    renderer.render()
    surface.addEventListener('wheel', handleSurfaceWheel, { passive: false })
    window.addEventListener('keydown', handleWindowKeyDown)
    window.addEventListener('keyup', handleWindowKeyUp)
    resizeObserver = new ResizeObserver(() => {
      surfaceViewportSize.value = { width: Math.max(stage.clientWidth, 1), height: Math.max(stage.clientHeight, 1) }
      if (minimapRef.value) {
        minimapSize.value = { width: Math.max(minimapRef.value.clientWidth, 1), height: Math.max(minimapRef.value.clientHeight, 1) }
      }
      renderer?.resize()
    })
    resizeObserver.observe(stage)
    if (minimapRef.value) {
      minimapSize.value = { width: Math.max(minimapRef.value.clientWidth, 1), height: Math.max(minimapRef.value.clientHeight, 1) }
      resizeObserver.observe(minimapRef.value)
    }
  })
  watch(sceneSignature, () => renderer?.render())
  watch(nodePositions, (positions, previousPositions = []) => {
    const previousById = new Map(previousPositions.map((position) => [position.id, position]))
    for (const position of positions) {
      const previous = previousById.get(position.id)
      if (previous && (previous.x !== position.x || previous.y !== position.y)) {
        renderer?.updateNodePosition(position.id)
      }
    }
  })
  watch(viewportSignature, () => renderer?.render())
  onBeforeUnmount(() => {
    unbindWindowPointerListeners()
    canvasSurfaceRef.value?.removeEventListener('wheel', handleSurfaceWheel)
    window.removeEventListener('keydown', handleWindowKeyDown)
    window.removeEventListener('keyup', handleWindowKeyUp)
    resizeObserver?.disconnect()
    renderer?.destroy()
    resizeObserver = null
    renderer = null
    dragState = null
    panState = null
    draftConnection.value = null
    marquee.value = null
    closeContextMenu()
  })

  return {
    buildConnectionPath, canvasStore, canvasSurfaceRef, centerNodeInViewport, handleConnectionPointerDown,
    handleMinimapPointerDown, minimapNodeStyle, minimapRef,
    minimapViewportStyle, nodeInputAnchor, nodeOutputAnchor, stageRef, statusBadgeStyle,
    statusIconMap, statusLabel, statusNodes, stageNotice, surfaceNodeRectStyle, temporaryConnectionPath, marqueeStyle,
    viewportCursor, retryProjectLoad, contextMenu, contextMenuOptions, closeContextMenu,
    handleContextMenuSelect, updateContextMenuShow,
  }
}
