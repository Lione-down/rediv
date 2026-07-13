import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import {
  createMoveNodesCommand,
  isArrangeEligibleNode,
  type CanvasAlignment,
  type CanvasDistribution,
  type CanvasNodePosition,
} from '../../../modules/canvas/canvas-commands'
import {
  buildConnectionPath,
  clampZoom,
  minimapPointToWorld,
  nodeInputPortAnchors,
  nodeOutputAnchor as getNodeOutputAnchor,
  normalizeViewport, nodeIntersectsRect,
  rectFromPoints,
  snapDeltaToGrid,
  surfaceToWorld, worldToSurface,
  type Point,
  type ViewportState,
} from '../canvas-geometry'
import { createCanvasRenderer, type CanvasRenderer } from '../canvas-renderer'
import { createPointerFrameQueue } from '../canvas-pointer-frame'
import { useCanvasCommandInteractions } from './use-canvas-command-interactions'
import { useCanvasConnectionPresentation } from './use-canvas-connection-presentation'
import { useCanvasContextMenu } from './use-canvas-context-menu'
import { useCanvasMinimapPresentation } from './use-canvas-minimap-presentation'
import { useCanvasStageKeyboard } from './use-canvas-stage-keyboard'
import { useCanvasStageOverlays } from './use-canvas-stage-overlays'
import { useCanvasStagePresentation } from './use-canvas-stage-presentation'
import { useCanvasViewControls } from './use-canvas-view-controls'
interface DragState { pointerId: number | null; startWorldPoint: Point; origins: CanvasNodePosition[]; moved: boolean }
interface PanState { pointerId: number | null; startClientX: number; startClientY: number; originX: number; originY: number }
interface DraftConnectionState { fromNodeId: string; sourcePort: string; pointerId: number | null; currentX: number; currentY: number }
interface MarqueeState { pointerId: number | null; start: Point; current: Point; additive: boolean }
interface NativePointerLikeEvent extends MouseEvent { pointerId?: number }
interface LeaferPointerEvent { target?: unknown; origin?: NativePointerLikeEvent }
interface CanvasStageOptions { isReadOnly?: () => boolean }
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
  const viewportCursor = computed(() => {
    if (isPanning.value) return 'grabbing'
    if (canvasStore.mode === 'hand' || isSpacePressed.value) return 'grab'
    return 'default'
  })
  const temporaryConnectionPath = computed(() => {
    const draft = draftConnection.value
    return draft ? buildConnectionPath(nodeOutputAnchor(draft.fromNodeId, draft.sourcePort), { x: draft.currentX, y: draft.currentY }) : ''
  })
  const marqueeStyle = computed(() => {
    if (!marquee.value) return null
    const rect = rectFromPoints(marquee.value.start, marquee.value.current)
    return { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }
  })
  const {
    closeContextMenu, contextMenu, contextMenuOptions, handleContextMenu,
    createRegistryNodeAt, handleContextMenuSelect, handleStageDoubleClick, updateContextMenuShow,
  } = useCanvasContextMenu({
    cancelActiveInteraction,
    findNodeAtWorldPoint,
    getViewport,
    isReadOnly: () => options.isReadOnly?.() ?? false,
    toSurfacePoint,
  })
  const { closeGraphPanel, closeNodeMenu, createNodeFromMenu, isGraphPanelOpen, isNodeMenuOpen,
    openNodeMenu, toggleGraphPanel, updateNodeMenuOpen } = useCanvasStageOverlays({
    closeContextMenu, createRegistryNodeAt, getViewport, getViewportSize: () => surfaceViewportSize.value,
  })
  const {
    alignSelection,
    autoArrange,
    canAlignSelection: canAlignSelectionNow,
    canAutoArrange: canAutoArrangeNow,
    canConnectSelection: canConnectSelectionNow,
    canDeleteSelection: canDeleteSelectionNow,
    canDistributeSelection: canDistributeSelectionNow,
    canDuplicateSelection: canDuplicateSelectionNow,
    canGroupSelection: canGroupSelectionNow,
    canUngroupSelection: canUngroupSelectionNow,
    connectNodes,
    connectSelection,
    deleteSelection,
    duplicateSelection,
    distributeSelection,
    groupSelection,
    handleCommandKeyDown,
    hasLockedSelection: hasLockedSelectionNow,
    toggleLockSelection,
    ungroupSelection,
  } = useCanvasCommandInteractions({
    isReadOnly: () => options.isReadOnly?.() ?? false,
  })
  const canConnectSelection = computed(() => canConnectSelectionNow())
  const canDeleteSelection = computed(() => canDeleteSelectionNow())
  const canDuplicateSelection = computed(() => canDuplicateSelectionNow())
  const canGroupSelection = computed(() => canGroupSelectionNow())
  const canUngroupSelection = computed(() => canUngroupSelectionNow())
  const canAlignSelection = computed(() => canAlignSelectionNow())
  const canDistributeSelection = computed(() => canDistributeSelectionNow())
  const canAutoArrange = computed(() => canAutoArrangeNow())
  const hasLockedSelection = computed(() => hasLockedSelectionNow())
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
  const { minimapMetrics, minimapNodes, minimapNodeStyle, minimapViewportStyle } = useCanvasMinimapPresentation({
    getMinimapSize: () => minimapSize.value,
    getNodes: () => canvasStore.nodes,
    getViewport,
    getViewportSize: () => surfaceViewportSize.value,
  })
  const { connectionPaths, connectionWorldTransform } = useCanvasConnectionPresentation({ getConnections: () => canvasStore.connections, getNodes: () => canvasStore.nodes, getViewport })
  const {
    applyZoomAtPoint, areEdgesVisible, fitGraph, fitSelection, handleViewKeyDown,
    isGridEnabled, isMinimapVisible, maybeAutoFitReadonly, setZoomPercent,
    toggleEdges, toggleGrid, toggleMinimap, zoomIn, zoomOut, zoomPercent,
  } = useCanvasViewControls({
    focusStage: focusCanvasStage,
    getViewport,
    getViewportSize: () => surfaceViewportSize.value,
    isReadOnly: () => options.isReadOnly?.() ?? false,
    updateViewport,
  })
  const {
    nodeAppearances, nodePositions, selectionToolbarStyle, stageNotice, statusBadgeStyle,
    statusIconMap, statusLabel, statusNodes, surfaceNodeRectStyle,
  } = useCanvasStagePresentation({
    canvasStore,
    getViewport,
    getViewportSize: () => surfaceViewportSize.value,
    isReadOnly: () => options.isReadOnly?.() ?? false,
  })
  function findNode(nodeId: string) { return canvasStore.nodes.find((node) => node.id === nodeId) ?? null }
  function findNodeAtWorldPoint(point: Point) {
    const orderedNodes = [...canvasStore.nodes].sort((left, right) => (
      Number(left.type !== 'group') - Number(right.type !== 'group')
    ))
    return orderedNodes.reverse().find((node) => (
      point.x >= node.x && point.x <= node.x + node.width &&
      point.y >= node.y && point.y <= node.y + node.height
    )) ?? null
  }
  function nodeOutputAnchor(nodeId: string, portId?: string) {
    const node = findNode(nodeId)
    return node ? getNodeOutputAnchor(node, getViewport(), portId) : { x: 0, y: 0 }
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
  function focusCanvasStage() { stageRef.value?.focus({ preventScroll: true }) }
  function arrangeSelectionFromToolbar(action: string) {
    if (action.startsWith('align-')) return alignSelection('toolbar', action.slice('align-'.length) as CanvasAlignment)
    if (action.startsWith('distribute-')) return distributeSelection('toolbar', action.slice('distribute-'.length) as CanvasDistribution)
    return autoArrange('toolbar')
  }
  function handleMinimapPointerDown(event: PointerEvent) {
    if (event.button !== 0) return
    focusCanvasStage()
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
    focusCanvasStage()
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
    focusCanvasStage()
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
    focusCanvasStage()
    if (renderer?.isPortTarget(nodeId, event.target)) return
    if (event.origin && event.origin.button !== 0) return
    if (shouldStartPan(event.origin)) return startPan(event.origin)
    const node = findNode(nodeId)
    const point = event.origin ? toSurfacePoint(event.origin.clientX, event.origin.clientY) : null
    if (!node || !point) return
    const hasModifier = Boolean(event.origin?.ctrlKey || event.origin?.metaKey || event.origin?.shiftKey)
    if (hasModifier) canvasStore.selectNode(nodeId, 'toggle')
    else if (!canvasStore.selectedNodeIds.includes(nodeId)) canvasStore.selectNode(nodeId)
    if (options.isReadOnly?.()) return
    if (!isArrangeEligibleNode(node) || canvasStore.selectedNodes.some((selectedNode) => !isArrangeEligibleNode(selectedNode))) return
    if (!canvasStore.selectedNodeIds.includes(nodeId)) return
    const worldPoint = surfaceToWorld(point, getViewport())
    dragState = {
      pointerId: event.origin?.pointerId ?? null,
      startWorldPoint: worldPoint,
      origins: canvasStore.selectedNodes.map(({ id, x, y }) => ({ nodeId: id, x, y })),
      moved: false,
    }
    bindWindowPointerListeners()
  }
  function handleOutputPointerDown(nodeId: string, sourcePort: string, event: LeaferPointerEvent) {
    focusCanvasStage()
    if (shouldStartPan(event.origin, false)) return startPan(event.origin)
    canvasStore.selectNode(nodeId)
    if (options.isReadOnly?.()) return
    const sourceNode = findNode(nodeId)
    if (!sourceNode || !isArrangeEligibleNode(sourceNode)) return
    const anchor = nodeOutputAnchor(nodeId, sourcePort)
    dragState = null
    draftConnection.value = { fromNodeId: nodeId, sourcePort, pointerId: event.origin?.pointerId ?? null, currentX: anchor.x, currentY: anchor.y }
    bindWindowPointerListeners()
  }
  function processWindowPointerMove(event: PointerEvent) {
    if (panState) {
      if (panState.pointerId !== null && event.pointerId !== panState.pointerId) return
      updateViewport({ x: panState.originX + event.clientX - panState.startClientX, y: panState.originY + event.clientY - panState.startClientY })
      return
    }
    if (dragState) {
      if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return
      const point = toSurfacePoint(event.clientX, event.clientY)
      if (!point) return
      const worldPoint = surfaceToWorld(point, getViewport())
      let deltaX = worldPoint.x - dragState.startWorldPoint.x
      let deltaY = worldPoint.y - dragState.startWorldPoint.y
      if (isGridEnabled.value && dragState.origins.length) {
        const snapped = snapDeltaToGrid(dragState.origins[0], { x: deltaX, y: deltaY })
        deltaX = snapped.x
        deltaY = snapped.y
      }
      dragState.moved = dragState.moved || deltaX !== 0 || deltaY !== 0
      for (const origin of dragState.origins) {
        const selectedNode = findNode(origin.nodeId)
        if (!selectedNode) continue
        selectedNode.x = origin.x + deltaX
        selectedNode.y = origin.y + deltaY
        renderer?.updateNodePosition(selectedNode.id)
      }
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
  function handleWindowPointerMove(event: PointerEvent) {
    pointerMoveQueue.schedule(event)
  }
  const pointerMoveQueue = createPointerFrameQueue(processWindowPointerMove)
  function findConnectionTarget(point: Point, sourceNodeId: string) {
    let match: { node: CanvasNode; targetPort: string } | null = null
    let matchedDistance = Number.POSITIVE_INFINITY
    for (const node of canvasStore.nodes) {
      if (node.id === sourceNodeId) continue
      for (const anchor of nodeInputPortAnchors(node)) {
        const surfaceAnchor = worldToSurface(anchor, getViewport())
        const distance = Math.hypot(surfaceAnchor.x - point.x, surfaceAnchor.y - point.y)
        if (distance <= 24 && distance < matchedDistance) {
          match = { node, targetPort: anchor.portId }
          matchedDistance = distance
        }
      }
    }
    return match
  }
  function finalizeDraftConnection(point: Point) {
    const draft = draftConnection.value
    if (!draft) return
    const target = findConnectionTarget(point, draft.fromNodeId)
    if (target) connectNodes('pointer', draft.fromNodeId, target.node.id, draft.sourcePort, target.targetPort)
    draftConnection.value = null
  }
  function handleWindowPointerUp(event: PointerEvent) {
    pointerMoveQueue.flush()
    if (panState && (panState.pointerId === null || event.pointerId === panState.pointerId)) { panState = null; isPanning.value = false }
    if (dragState && (dragState.pointerId === null || event.pointerId === dragState.pointerId)) {
      const origins = dragState.origins
      const didMove = dragState.moved
      dragState = null
      const command = didMove ? createMoveNodesCommand(origins, canvasStore.nodes) : null
      if (command) void canvasStore.dispatchCommand({ source: 'pointer', command }).catch(() => undefined)
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
  function handleSurfaceWheel(event: WheelEvent) {
    event.preventDefault()
    const point = toSurfacePoint(event.clientX, event.clientY)
    if (point) applyZoomAtPoint(getViewport().zoom * Math.exp(-event.deltaY * 0.0015), point)
  }
  function cancelActiveInteraction() {
    const wasActive = Boolean(dragState || panState || draftConnection.value || marquee.value)
    if (dragState) {
      for (const origin of dragState.origins) {
        const node = findNode(origin.nodeId)
        if (!node) continue
        node.x = origin.x
        node.y = origin.y
        renderer?.updateNodePosition(node.id)
      }
    }
    dragState = null
    panState = null
    draftConnection.value = null
    marquee.value = null
    isPanning.value = false
    pointerMoveQueue.clear()
    unbindWindowPointerListeners()
    return wasActive
  }
  const { handleWindowKeyDown, handleWindowKeyUp } = useCanvasStageKeyboard({
    stageRef,
    isSpacePressed,
    isGraphPanelOpen,
    isNodeMenuOpen,
    isReadOnly: () => options.isReadOnly?.() ?? false,
    isContextMenuOpen: () => contextMenu.value.show,
    selectedConnectionId: () => canvasStore.selectedConnectionId,
    cancelActiveInteraction,
    clearConnectionSelection: () => canvasStore.selectConnection(''),
    clearNodeSelection: () => canvasStore.setSelection([]),
    closeContextMenu,
    closeGraphPanel,
    closeNodeMenu,
    openNodeMenu,
    toggleGraphPanel,
    handleViewKeyDown,
    handleCommandKeyDown,
  })
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
    renderer.updateViewport()
    renderer.syncNodes()
    maybeAutoFitReadonly()
    surface.addEventListener('wheel', handleSurfaceWheel, { passive: false })
    window.addEventListener('keydown', handleWindowKeyDown, true)
    window.addEventListener('keyup', handleWindowKeyUp, true)
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
  watch(nodeAppearances, () => renderer?.syncNodes(), { deep: true })
  watch(() => [...canvasStore.selectedNodeIds], () => renderer?.syncNodes())
  watch(nodePositions, (positions, previousPositions = []) => {
    const previousById = new Map(previousPositions.map((position) => [position.id, position]))
    for (const position of positions) {
      const previous = previousById.get(position.id)
      if (previous && (previous.x !== position.x || previous.y !== position.y)) {
        renderer?.updateNodePosition(position.id)
      }
    }
  })
  watch(
    () => [canvasStore.viewport.x, canvasStore.viewport.y, canvasStore.viewport.zoom],
    () => renderer?.updateViewport(),
  )
  onBeforeUnmount(() => {
    pointerMoveQueue.clear()
    unbindWindowPointerListeners()
    canvasSurfaceRef.value?.removeEventListener('wheel', handleSurfaceWheel)
    window.removeEventListener('keydown', handleWindowKeyDown, true)
    window.removeEventListener('keyup', handleWindowKeyUp, true)
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
    canvasStore, canvasSurfaceRef, centerNodeInViewport, connectionPaths, connectionWorldTransform, handleConnectionPointerDown,
    handleMinimapPointerDown, minimapNodeStyle, minimapNodes, minimapRef,
    minimapViewportStyle, stageRef, statusBadgeStyle,
    statusIconMap, statusLabel, statusNodes, stageNotice, surfaceNodeRectStyle, temporaryConnectionPath, marqueeStyle,
    viewportCursor, retryProjectLoad, contextMenu, contextMenuOptions, closeContextMenu, selectionToolbarStyle,
    canConnectSelection, canDuplicateSelection, canGroupSelection, canUngroupSelection, closeGraphPanel, connectSelection,
    canAlignSelection, canAutoArrange, canDeleteSelection, canDistributeSelection, hasLockedSelection,
    createNodeFromMenu, deleteSelection, duplicateSelection, groupSelection, isGraphPanelOpen, isNodeMenuOpen,
    toggleGraphPanel, ungroupSelection, updateNodeMenuOpen,
    arrangeSelectionFromToolbar, autoArrange, toggleLockSelection,
    areEdgesVisible, fitGraph, fitSelection, isGridEnabled, isMinimapVisible, setZoomPercent,
    toggleEdges, toggleGrid, toggleMinimap, zoomIn, zoomOut, zoomPercent,
    handleContextMenuSelect, updateContextMenuShow,
  }
}
