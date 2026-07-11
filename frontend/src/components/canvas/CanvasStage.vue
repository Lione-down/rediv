<script setup lang="ts">
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { Ellipse, Group, Leafer, Rect, Text } from 'leafer-ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasNode } from '../../types/canvas'

const POINTER_DOWN = 'pointer.down'
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3

interface NodeVisuals {
  group: Group
  card: Rect
  input: Ellipse
  output: Ellipse
}

interface DragState {
  nodeId: string
  pointerId: number | null
  offsetX: number
  offsetY: number
}

interface PanState {
  pointerId: number | null
  startClientX: number
  startClientY: number
  originX: number
  originY: number
}

interface DraftConnectionState {
  fromNodeId: string
  pointerId: number | null
  currentX: number
  currentY: number
}

interface Point {
  x: number
  y: number
}

interface ViewportState {
  zoom: number
  x: number
  y: number
}

type StatusVisualState = Extract<NonNullable<CanvasNode['status']>, 'running' | 'success' | 'warning'>

const canvasStore = useCanvasStore()
const stageRef = ref<HTMLElement | null>(null)
const canvasSurfaceRef = ref<HTMLElement | null>(null)
const draftConnection = ref<DraftConnectionState | null>(null)
const surfaceViewportSize = ref({ width: 0, height: 0 })
const isSpacePressed = ref(false)

let leafer: Leafer | null = null
let resizeObserver: ResizeObserver | null = null
let dragState: DragState | null = null
let panState: PanState | null = null
let windowPointerListenersBound = false

const nodeVisualMap = new Map<string, NodeVisuals>()
const interactiveTargets = new WeakSet<object>()

const statusIconMap: Record<StatusVisualState, typeof Loader2 | typeof CheckCircle2 | typeof AlertCircle> = {
  running: Loader2,
  success: CheckCircle2,
  warning: AlertCircle,
}

const sceneSignature = computed(() =>
  JSON.stringify({
    selectedNodeId: canvasStore.selectedNodeId,
    nodes: canvasStore.nodes.map(({ id, type, title, content, status, x, y, width, height }) => ({
      id,
      type,
      title,
      content,
      status,
      x,
      y,
      width,
      height,
    })),
    connections: canvasStore.connections.map(({ id, from, to, active }) => ({ id, from, to, active })),
  }),
)

const viewportSignature = computed(() =>
  JSON.stringify({
    zoom: canvasStore.viewport.zoom,
    x: canvasStore.viewport.x,
    y: canvasStore.viewport.y,
    width: surfaceViewportSize.value.width,
    height: surfaceViewportSize.value.height,
  }),
)

const viewportCursor = computed(() => {
  if (panState) return 'grabbing'
  if (canvasStore.mode === 'hand' || isSpacePressed.value) return 'grab'

  return 'default'
})

const viewportWorldRect = computed(() => {
  const viewport = getViewport()

  return {
    left: (-viewport.x) / viewport.zoom,
    top: (-viewport.y) / viewport.zoom,
    width: surfaceViewportSize.value.width / viewport.zoom,
    height: surfaceViewportSize.value.height / viewport.zoom,
  }
})

const minimapMetrics = computed(() => {
  const padding = 64
  const nodeMinX = canvasStore.nodes.reduce((minX, node) => Math.min(minX, node.x), 0)
  const nodeMinY = canvasStore.nodes.reduce((minY, node) => Math.min(minY, node.y), 0)
  const nodeMaxX = canvasStore.nodes.reduce((maxX, node) => Math.max(maxX, node.x + node.width), 1280)
  const nodeMaxY = canvasStore.nodes.reduce((maxY, node) => Math.max(maxY, node.y + node.height), 720)
  const viewport = viewportWorldRect.value
  const minX = Math.min(nodeMinX, viewport.left) - padding
  const minY = Math.min(nodeMinY, viewport.top) - padding
  const maxX = Math.max(nodeMaxX, viewport.left + viewport.width) + padding
  const maxY = Math.max(nodeMaxY, viewport.top + viewport.height) + padding
  const boundsWidth = Math.max(maxX - minX, 1)
  const boundsHeight = Math.max(maxY - minY, 1)
  const mapWidth = 160
  const mapHeight = 104
  const scale = Math.min(mapWidth / boundsWidth, mapHeight / boundsHeight)
  const offsetX = (mapWidth - boundsWidth * scale) / 2
  const offsetY = (mapHeight - boundsHeight * scale) / 2

  return {
    minX,
    minY,
    scale,
    offsetX,
    offsetY,
  }
})

const minimapViewportStyle = computed(() => {
  const metrics = minimapMetrics.value
  const viewport = viewportWorldRect.value

  return {
    left: `${metrics.offsetX + (viewport.left - metrics.minX) * metrics.scale}px`,
    top: `${metrics.offsetY + (viewport.top - metrics.minY) * metrics.scale}px`,
    width: `${Math.max(viewport.width * metrics.scale, 18)}px`,
    height: `${Math.max(viewport.height * metrics.scale, 14)}px`,
  }
})

const statusNodes = computed(() =>
  canvasStore.nodes.filter(
    (node): node is CanvasNode & { status: StatusVisualState } =>
      node.status === 'running' || node.status === 'success' || node.status === 'warning',
  ),
)

const temporaryConnectionPath = computed(() => {
  if (!draftConnection.value) return ''

  return buildConnectionPath(nodeOutputAnchor(draftConnection.value.fromNodeId), {
    x: draftConnection.value.currentX,
    y: draftConnection.value.currentY,
  })
})

function cssVar(name: string, fallback: string) {
  if (!canvasSurfaceRef.value) return fallback

  const value = getComputedStyle(canvasSurfaceRef.value).getPropertyValue(name).trim()

  return value || fallback
}

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

function getViewport(): ViewportState {
  return {
    zoom: clampZoom(canvasStore.viewport.zoom || 1),
    x: canvasStore.viewport.x || 0,
    y: canvasStore.viewport.y || 0,
  }
}

function updateViewport(nextViewport: Partial<ViewportState>) {
  const current = getViewport()

  canvasStore.viewport = {
    zoom: clampZoom(nextViewport.zoom ?? current.zoom),
    x: nextViewport.x ?? current.x,
    y: nextViewport.y ?? current.y,
  }
}

function updateSurfaceViewportSize() {
  const stage = stageRef.value

  if (!stage) return

  surfaceViewportSize.value = {
    width: Math.max(stage.clientWidth, 1),
    height: Math.max(stage.clientHeight, 1),
  }
}

function syncLeaferSize() {
  if (!leafer || !canvasSurfaceRef.value) return

  leafer.width = Math.max(canvasSurfaceRef.value.clientWidth, 1)
  leafer.height = Math.max(canvasSurfaceRef.value.clientHeight, 1)
}

function worldToSurfacePoint(point: Point) {
  const viewport = getViewport()

  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  }
}

function surfaceToWorldPoint(point: Point) {
  const viewport = getViewport()

  return {
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  }
}

function nodeStrokeColor(nodeId: string, status?: CanvasNode['status']) {
  if (status === 'running') return cssVar('--warning', 'oklch(70% 0.13 78)')
  if (status === 'success') return cssVar('--success', 'oklch(60% 0.12 150)')
  if (status === 'warning') return cssVar('--danger', 'oklch(58% 0.17 27)')
  if (canvasStore.selectedNodeId === nodeId) return cssVar('--accent-select', 'oklch(58% 0.115 252)')

  return cssVar('--border-subtle', 'oklch(88% 0.009 92)')
}

function nodeShadowColor(nodeId: string, status?: CanvasNode['status']) {
  if (status === 'running') return 'oklch(70% 0.13 78 / 0.18)'
  if (status === 'success') return 'oklch(60% 0.12 150 / 0.18)'
  if (status === 'warning') return 'oklch(58% 0.17 27 / 0.18)'
  if (canvasStore.selectedNodeId === nodeId) return 'rgba(75, 122, 255, 0.16)'

  return 'rgba(44, 52, 68, 0.10)'
}

function findNode(nodeId: string) {
  return canvasStore.nodes.find((node) => node.id === nodeId) ?? null
}

function setSelectedNode(nodeId: string | null) {
  canvasStore.selectedNodeId = nodeId ?? ''
}

function currentNodeWorldPosition(nodeId: string) {
  const node = findNode(nodeId)

  if (!node) return { x: 0, y: 0 }

  return { x: node.x, y: node.y }
}

function currentNodePosition(nodeId: string) {
  return worldToSurfacePoint(currentNodeWorldPosition(nodeId))
}

function nodeInputAnchorWorld(nodeId: string) {
  const node = findNode(nodeId)

  if (!node) return { x: 0, y: 0 }

  const position = currentNodeWorldPosition(nodeId)

  return {
    x: position.x,
    y: position.y + node.height / 2,
  }
}

function nodeInputAnchor(nodeId: string) {
  return worldToSurfacePoint(nodeInputAnchorWorld(nodeId))
}

function nodeOutputAnchor(nodeId: string) {
  const node = findNode(nodeId)

  if (!node) return { x: 0, y: 0 }

  const position = currentNodeWorldPosition(nodeId)

  return worldToSurfacePoint({
    x: position.x + node.width,
    y: position.y + node.height / 2,
  })
}

function buildConnectionPath(from: Point, to: Point) {
  return `M ${from.x} ${from.y} C ${from.x + 110} ${from.y}, ${to.x - 110} ${to.y}, ${to.x} ${to.y}`
}

function minimapNodeStyle(node: CanvasNode) {
  const metrics = minimapMetrics.value

  return {
    left: `${metrics.offsetX + (node.x - metrics.minX) * metrics.scale}px`,
    top: `${metrics.offsetY + (node.y - metrics.minY) * metrics.scale}px`,
    width: `${Math.max(node.width * metrics.scale, 12)}px`,
    height: `${Math.max(node.height * metrics.scale, 8)}px`,
  }
}

function surfaceNodeRectStyle(node: CanvasNode) {
  const position = currentNodePosition(node.id)
  const zoom = getViewport().zoom

  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${node.width * zoom}px`,
    height: `${node.height * zoom}px`,
  }
}

function statusBadgeStyle() {
  const zoom = getViewport().zoom

  return {
    left: `${16 * zoom}px`,
    top: `${14 * zoom}px`,
    transform: `scale(${Math.max(0.88, Math.min(zoom, 1.2))})`,
    transformOrigin: 'top left',
  }
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
  const centerX = node.x + node.width / 2
  const centerY = node.y + node.height / 2

  updateViewport({
    x: surfaceViewportSize.value.width / 2 - centerX * viewport.zoom,
    y: surfaceViewportSize.value.height / 2 - centerY * viewport.zoom,
  })
}

function isInteractiveTarget(target: unknown) {
  return Boolean(target && interactiveTargets.has(target as object))
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

function toSurfacePoint(clientX: number, clientY: number) {
  const stage = stageRef.value

  if (!stage) return null

  const rect = stage.getBoundingClientRect()

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

function shouldStartPan(origin?: PointerEvent, allowSpaceDrag = true) {
  if (!origin) return false
  if (origin.button === 1) return true
  if (canvasStore.mode === 'hand') return true
  if (allowSpaceDrag && isSpacePressed.value && origin.button === 0) return true

  return false
}

function startPan(origin?: PointerEvent) {
  if (!origin) return

  dragState = null
  draftConnection.value = null
  panState = {
    pointerId: origin.pointerId ?? null,
    startClientX: origin.clientX,
    startClientY: origin.clientY,
    originX: getViewport().x,
    originY: getViewport().y,
  }

  bindWindowPointerListeners()
}

function applyZoomAtPoint(nextZoom: number, point: Point) {
  const viewport = getViewport()
  const zoom = clampZoom(nextZoom)

  if (Math.abs(zoom - viewport.zoom) < 0.0001) return

  const worldPoint = surfaceToWorldPoint(point)

  updateViewport({
    zoom,
    x: point.x - worldPoint.x * zoom,
    y: point.y - worldPoint.y * zoom,
  })
}

function handleSurfaceWheel(event: WheelEvent) {
  event.preventDefault()

  const point = toSurfacePoint(event.clientX, event.clientY)

  if (!point) return

  const factor = Math.exp(-event.deltaY * 0.0015)

  applyZoomAtPoint(getViewport().zoom * factor, point)
}

function handleWindowKeyDown(event: KeyboardEvent) {
  if (event.key === ' ') isSpacePressed.value = true
}

function handleWindowKeyUp(event: KeyboardEvent) {
  if (event.key === ' ') isSpacePressed.value = false
}

function updateNodeVisualPosition(nodeId: string) {
  const visual = nodeVisualMap.get(nodeId)
  const node = findNode(nodeId)

  if (!visual || !node) return

  const position = currentNodePosition(nodeId)
  const zoom = getViewport().zoom

  visual.group.x = position.x
  visual.group.y = position.y
  visual.group.scaleX = zoom
  visual.group.scaleY = zoom
}

function handleStagePointerDown(event: { target?: unknown; origin?: PointerEvent }) {
  if (isInteractiveTarget(event.target)) return
  if (shouldStartPan(event.origin)) {
    startPan(event.origin)
    return
  }

  setSelectedNode(null)
}

function handleNodePointerDown(nodeId: string, event: { target?: unknown; origin?: PointerEvent }) {
  const visuals = nodeVisualMap.get(nodeId)

  if (!visuals) return
  if (event.target === visuals.input || event.target === visuals.output) return
  if (shouldStartPan(event.origin)) {
    startPan(event.origin)
    return
  }

  const node = findNode(nodeId)
  const point = event.origin ? toSurfacePoint(event.origin.clientX, event.origin.clientY) : null

  if (!node || !point) return

  const worldPoint = surfaceToWorldPoint(point)

  setSelectedNode(nodeId)
  dragState = {
    nodeId,
    pointerId: event.origin?.pointerId ?? null,
    offsetX: worldPoint.x - node.x,
    offsetY: worldPoint.y - node.y,
  }

  bindWindowPointerListeners()
}

function handleOutputPointerDown(nodeId: string, event: { origin?: PointerEvent }) {
  if (shouldStartPan(event.origin, false)) {
    startPan(event.origin)
    return
  }

  const anchor = nodeOutputAnchor(nodeId)

  setSelectedNode(nodeId)
  dragState = null
  draftConnection.value = {
    fromNodeId: nodeId,
    pointerId: event.origin?.pointerId ?? null,
    currentX: anchor.x,
    currentY: anchor.y,
  }

  bindWindowPointerListeners()
}

function handleWindowPointerMove(event: PointerEvent) {
  if (panState) {
    if (panState.pointerId !== null && event.pointerId !== panState.pointerId) return

    updateViewport({
      x: panState.originX + (event.clientX - panState.startClientX),
      y: panState.originY + (event.clientY - panState.startClientY),
    })
    return
  }

  if (dragState) {
    if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return

    const point = toSurfacePoint(event.clientX, event.clientY)
    const node = findNode(dragState.nodeId)

    if (!point || !node) return

    const worldPoint = surfaceToWorldPoint(point)

    node.x = worldPoint.x - dragState.offsetX
    node.y = worldPoint.y - dragState.offsetY
    updateNodeVisualPosition(node.id)
    return
  }

  if (!draftConnection.value) return
  if (draftConnection.value.pointerId !== null && event.pointerId !== draftConnection.value.pointerId) return

  const point = toSurfacePoint(event.clientX, event.clientY)

  if (!point) return

  draftConnection.value = {
    ...draftConnection.value,
    currentX: point.x,
    currentY: point.y,
  }
}

function findConnectionTarget(point: Point, sourceNodeId: string) {
  let matchedNode: CanvasNode | null = null
  let matchedDistance = Number.POSITIVE_INFINITY

  for (const node of canvasStore.nodes) {
    if (node.id === sourceNodeId) continue

    const anchor = nodeInputAnchor(node.id)
    const distance = Math.hypot(anchor.x - point.x, anchor.y - point.y)

    if (distance <= 24 && distance < matchedDistance) {
      matchedNode = node
      matchedDistance = distance
    }
  }

  return matchedNode
}

function connectionExists(fromNodeId: string, toNodeId: string) {
  return canvasStore.connections.some((connection) => connection.from === fromNodeId && connection.to === toNodeId)
}

function finalizeDraftConnection(point: Point) {
  if (!draftConnection.value) return

  const targetNode = findConnectionTarget(point, draftConnection.value.fromNodeId)

  if (targetNode && !connectionExists(draftConnection.value.fromNodeId, targetNode.id)) {
    void canvasStore.createConnection({
      from: draftConnection.value.fromNodeId,
      to: targetNode.id,
      sourcePort: 'out',
      targetPort: 'in',
    }).catch(() => undefined)
  }

  draftConnection.value = null
}

function handleWindowPointerUp(event: PointerEvent) {
  if (panState && (panState.pointerId === null || event.pointerId === panState.pointerId)) {
    panState = null
  }

  if (dragState && (dragState.pointerId === null || event.pointerId === dragState.pointerId)) {
    const releasedNodeId = dragState.nodeId
    dragState = null
    updateNodeVisualPosition(releasedNodeId)
    const releasedNode = findNode(releasedNodeId)
    if (releasedNode) {
      canvasStore.queueNodeMove(releasedNodeId, releasedNode.x, releasedNode.y)
    }
  }

  if (draftConnection.value && (draftConnection.value.pointerId === null || event.pointerId === draftConnection.value.pointerId)) {
    const point = toSurfacePoint(event.clientX, event.clientY)

    if (point) {
      finalizeDraftConnection(point)
    } else {
      draftConnection.value = null
    }
  }

  if (!panState && !dragState && !draftConnection.value) {
    unbindWindowPointerListeners()
  }
}

function renderScene() {
  if (!leafer) return

  const currentLeafer = leafer
  const viewport = getViewport()

  syncLeaferSize()
  currentLeafer.clear()
  currentLeafer.fill = cssVar('--bg-canvas', 'oklch(98% 0.006 92)')
  nodeVisualMap.clear()

  canvasStore.nodes.forEach((node) => {
    const position = currentNodePosition(node.id)
    const group = new Group({
      x: position.x,
      y: position.y,
      scaleX: viewport.zoom,
      scaleY: viewport.zoom,
    })

    const card = new Rect({
      width: node.width,
      height: node.height,
      cornerRadius: 12,
      hit: 'rect',
      fill: 'rgba(255, 255, 255, 0.92)',
      stroke: nodeStrokeColor(node.id, node.status),
      strokeWidth: node.status === 'running' || node.status === 'success' || node.status === 'warning' ? 2 : canvasStore.selectedNodeId === node.id ? 2 : 1,
      shadow: {
        x: 0,
        y: 18,
        blur: 42,
        color: nodeShadowColor(node.id, node.status),
      },
    })

    const input = new Ellipse({
      x: -8,
      y: node.height / 2 - 8,
      width: 16,
      height: 16,
      fill: cssVar('--bg-panel', 'white'),
      stroke: cssVar('--border-strong', 'oklch(80% 0.014 245)'),
      strokeWidth: 1.5,
    })

    const output = new Ellipse({
      x: node.width - 8,
      y: node.height / 2 - 8,
      width: 16,
      height: 16,
      fill: cssVar('--accent-select', 'oklch(58% 0.115 252)'),
      stroke: 'rgba(255, 255, 255, 0.95)',
      strokeWidth: 2,
    })

    const typeText = new Text({
      x: 16,
      y: 14,
      text: node.type.toUpperCase(),
      fill: cssVar('--text-muted', 'oklch(62% 0.014 245)'),
      fontSize: 11,
      fontWeight: '500',
    })

    const titleText = new Text({
      x: 16,
      y: 34,
      width: node.width - 32,
      text: node.title,
      fill: cssVar('--text-primary', 'oklch(18% 0.014 245)'),
      fontSize: 15,
      fontWeight: '600',
    })

    const contentText = new Text({
      x: 16,
      y: 62,
      width: node.width - 32,
      text: node.content,
      fill: cssVar('--text-secondary', 'oklch(46% 0.018 245)'),
      fontSize: 13,
      lineHeight: 22,
      textWrap: 'break',
    })

    group.add([card, input, output, typeText, titleText, contentText])
    currentLeafer.add(group)

    const visuals: NodeVisuals = { group, card, input, output }

    nodeVisualMap.set(node.id, visuals)
    interactiveTargets.add(group)
    interactiveTargets.add(card)
    interactiveTargets.add(input)
    interactiveTargets.add(output)
    interactiveTargets.add(typeText)
    interactiveTargets.add(titleText)
    interactiveTargets.add(contentText)

    ;(group as unknown as { on: (type: string, handler: (event: { target?: unknown; origin?: PointerEvent }) => void) => void }).on(
      POINTER_DOWN,
      (event) => handleNodePointerDown(node.id, event),
    )
    ;(output as unknown as { on: (type: string, handler: (event: { origin?: PointerEvent }) => void) => void }).on(
      POINTER_DOWN,
      (event) => handleOutputPointerDown(node.id, event),
    )
  })
}

function initLeafer() {
  const surface = canvasSurfaceRef.value

  if (!surface) return

  leafer?.destroy()

  const nextLeafer = new Leafer({
    view: surface,
    width: Math.max(surface.clientWidth, 1),
    height: Math.max(surface.clientHeight, 1),
    fill: cssVar('--bg-canvas', 'oklch(98% 0.006 92)'),
  })

  leafer = nextLeafer
  ;(nextLeafer as unknown as { on: (type: string, handler: (event: { target?: unknown; origin?: PointerEvent }) => void) => void }).on(
    POINTER_DOWN,
    handleStagePointerDown,
  )

  renderScene()
}

onMounted(() => {
  updateSurfaceViewportSize()
  initLeafer()
  canvasSurfaceRef.value?.addEventListener('wheel', handleSurfaceWheel, { passive: false })
  window.addEventListener('keydown', handleWindowKeyDown)
  window.addEventListener('keyup', handleWindowKeyUp)

  if (stageRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateSurfaceViewportSize()
      syncLeaferSize()
    })

    resizeObserver.observe(stageRef.value)
  }
})

watch(sceneSignature, () => {
  renderScene()
})

watch(viewportSignature, () => {
  renderScene()
})

onBeforeUnmount(() => {
  unbindWindowPointerListeners()
  canvasSurfaceRef.value?.removeEventListener('wheel', handleSurfaceWheel)
  window.removeEventListener('keydown', handleWindowKeyDown)
  window.removeEventListener('keyup', handleWindowKeyUp)
  resizeObserver?.disconnect()
  resizeObserver = null
  leafer?.destroy()
  leafer = null
  dragState = null
  panState = null
  draftConnection.value = null
  nodeVisualMap.clear()
})
</script>

<template>
  <section ref="stageRef" class="workspace-stage" aria-label="Revid 无限画布工作区">
    <div ref="canvasSurfaceRef" class="canvas-surface" :class="`cursor-${viewportCursor}`">
      <svg class="connection-layer" aria-hidden="true">
        <path
          v-for="connection in canvasStore.connections"
          :key="connection.id"
          :class="{ active: connection.active }"
          :d="buildConnectionPath(nodeOutputAnchor(connection.from), nodeInputAnchor(connection.to))"
        />
        <path v-if="temporaryConnectionPath" class="draft" :d="temporaryConnectionPath" />
      </svg>

      <div
        v-for="node in statusNodes"
        :key="`${node.id}-${node.status}`"
        class="node-status-overlay"
        :class="`is-${node.status}`"
        :style="surfaceNodeRectStyle(node)"
        aria-hidden="true"
      >
        <div class="node-status-badge" :style="statusBadgeStyle()">
          <component :is="statusIconMap[node.status]" :size="14" class="status-icon" />
          <span>{{ statusLabel(node.status) }}</span>
        </div>
      </div>

      <div class="minimap" aria-label="小地图">
        <button
          v-for="node in canvasStore.nodes"
          :key="node.id"
          type="button"
          class="minimap-node"
          :aria-label="`定位到 ${node.title}`"
          :style="minimapNodeStyle(node)"
          @click="centerNodeInViewport(node.id)"
        />
        <div class="minimap-viewport" :style="minimapViewportStyle"></div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.workspace-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(oklch(88% 0.006 92 / 0.45) 1px, transparent 1px),
    linear-gradient(90deg, oklch(88% 0.006 92 / 0.45) 1px, transparent 1px),
    radial-gradient(circle at 42% 38%, oklch(92% 0.024 175 / 0.46), transparent 33%),
    var(--bg-canvas);
  background-size: var(--space-6) var(--space-6), var(--space-6) var(--space-6), auto, auto;
}

.canvas-surface {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 760px;
  background: var(--bg-canvas);
}

.canvas-surface.cursor-grab {
  cursor: grab;
}

.canvas-surface.cursor-grabbing {
  cursor: grabbing;
}

.connection-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.node-status-overlay {
  position: absolute;
  z-index: 2;
  border-radius: 12px;
  pointer-events: none;
  box-shadow: 0 0 0 1px transparent;
}

.node-status-overlay.is-running {
  box-shadow:
    0 0 0 2px color-mix(in oklch, var(--warning) 92%, white 8%),
    0 0 0 10px color-mix(in oklch, var(--warning) 12%, transparent);
  animation: node-pulse 1.8s ease-in-out infinite;
}

.node-status-overlay.is-success {
  box-shadow:
    0 0 0 2px color-mix(in oklch, var(--success) 90%, white 10%),
    0 14px 30px color-mix(in oklch, var(--success) 10%, transparent);
}

.node-status-overlay.is-warning {
  box-shadow:
    0 0 0 2px color-mix(in oklch, var(--danger) 90%, white 10%),
    0 14px 30px color-mix(in oklch, var(--danger) 10%, transparent);
}

.node-status-badge {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: oklch(100% 0.004 92 / 0.94);
  box-shadow: 0 10px 24px oklch(20% 0.02 245 / 0.08);
}

.node-status-overlay.is-running .node-status-badge {
  color: var(--warning);
}

.node-status-overlay.is-success .node-status-badge {
  color: var(--success);
}

.node-status-overlay.is-warning .node-status-badge {
  color: var(--danger);
}

.status-icon {
  flex: none;
}

.node-status-overlay.is-running .status-icon {
  animation: status-spin 1s linear infinite;
}

path {
  fill: none;
  stroke: oklch(37% 0.014 245 / 0.44);
  stroke-width: 1.6;
}

path.active {
  stroke: var(--accent-select);
  stroke-dasharray: 8 10;
  animation: dash 1.4s linear infinite;
}

path.draft {
  stroke: var(--accent-select);
  stroke-width: 2;
  stroke-dasharray: 10 8;
}

.minimap {
  position: absolute;
  z-index: 3;
  right: 20px;
  bottom: 20px;
  width: 160px;
  height: 104px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: oklch(100% 0.004 92 / 0.76);
  box-shadow: var(--shadow-soft);
}

.minimap-node {
  position: absolute;
  border: 0;
  border-radius: 3px;
  background: color-mix(in oklch, var(--accent-select) 72%, white 28%);
  padding: 0;
  cursor: pointer;
}

.minimap-viewport {
  position: absolute;
  border: 1.5px solid color-mix(in oklch, var(--accent-select) 78%, white 22%);
  border-radius: 6px;
  background: color-mix(in oklch, var(--accent-select) 10%, transparent);
  box-shadow: inset 0 0 0 1px oklch(100% 0.01 92 / 0.48);
  pointer-events: none;
}

@keyframes dash {
  to {
    stroke-dashoffset: -36;
  }
}

@keyframes status-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes node-pulse {
  0%,
  100% {
    opacity: 0.9;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 920px) {
  .canvas-surface {
    min-height: calc(100dvh - 260px);
  }

  .minimap {
    right: 14px;
    bottom: 14px;
    width: 128px;
    height: 86px;
  }
}

@media (max-width: 720px) {
  .canvas-surface {
    min-height: calc(100dvh - 280px);
  }

  .minimap {
    display: none;
  }
}

@media (max-width: 480px) {
  .canvas-surface {
    min-height: calc(100dvh - 300px);
  }
}
</style>
