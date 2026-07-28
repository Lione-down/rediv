import { computed, ref } from 'vue'
import { runtimeNodeSize } from '../../modules/canvas-runtime/canvas-runtime-geometry'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'

export type RuntimeContextToolId =
  | 'text'
  | 'script'
  | 'image-generation'
  | 'video-generation'
  | 'video-composition'
  | 'audio-generation'

interface RuntimeCanvasShellOptions {
  clearSelection: () => void
  createNode: (toolId: RuntimeContextToolId, point: { x: number; y: number }) => void
  nodes: () => readonly CanvasNode[]
  setInteractionState: (state: 'idle' | 'canvas-pan') => void
  updateViewport: (viewport: PersistedViewport) => void
  viewport: () => PersistedViewport
}

export function useRuntimeCanvasShell(options: RuntimeCanvasShellOptions) {
  const panState = ref<{
    originX: number
    originY: number
    pointerId: number
    startX: number
    startY: number
  } | null>(null)
  const contextMenu = ref<{
    point: { x: number; y: number }
    position: { left: number; top: number }
  } | null>(null)
  const zoomPercent = computed(() => `${Math.round(options.viewport().zoom * 100)}%`)

  function beginCanvasPan(event: PointerEvent) {
    if ((event.button !== 0 && event.button !== 1) || event.target !== event.currentTarget) return
    contextMenu.value = null
    const world = event.currentTarget as HTMLElement
    world.setPointerCapture(event.pointerId)
    options.clearSelection()
    const viewport = options.viewport()
    panState.value = {
      originX: viewport.x,
      originY: viewport.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
    options.setInteractionState('canvas-pan')
  }

  function moveCanvas(event: PointerEvent) {
    const pan = panState.value
    if (!pan || pan.pointerId !== event.pointerId) return
    options.updateViewport({
      ...options.viewport(),
      x: pan.originX + event.clientX - pan.startX,
      y: pan.originY + event.clientY - pan.startY,
    })
  }

  function finishCanvasPan(event: PointerEvent) {
    if (panState.value?.pointerId !== event.pointerId) return
    panState.value = null
    options.setInteractionState('idle')
  }

  function setZoomAtPoint(nextZoom: number, centerX: number, centerY: number) {
    const viewport = options.viewport()
    if (nextZoom === viewport.zoom) return
    const worldX = (centerX - viewport.x) / viewport.zoom
    const worldY = (centerY - viewport.y) / viewport.zoom
    options.updateViewport({
      zoom: nextZoom,
      x: centerX - worldX * nextZoom,
      y: centerY - worldY * nextZoom,
    })
  }

  function changeZoom(delta: number) {
    const nextZoom = Math.min(
      2,
      Math.max(0.25, Number((options.viewport().zoom + delta).toFixed(2))),
    )
    setZoomAtPoint(nextZoom, window.innerWidth / 2, window.innerHeight / 2)
  }

  function handleCanvasWheel(event: WheelEvent) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const viewport = options.viewport()
    const nextZoom = Math.min(
      2,
      Math.max(0.25, viewport.zoom * Math.exp(-event.deltaY * 0.0015)),
    )
    setZoomAtPoint(nextZoom, event.clientX, event.clientY)
  }

  function openCanvasContextMenu(event: MouseEvent) {
    event.preventDefault()
    const viewport = options.viewport()
    contextMenu.value = {
      point: {
        x: (event.clientX - viewport.x) / viewport.zoom,
        y: (event.clientY - viewport.y) / viewport.zoom,
      },
      position: {
        left: Math.min(Math.max(12, event.clientX), window.innerWidth - 206),
        top: Math.min(Math.max(12, event.clientY), window.innerHeight - 370),
      },
    }
  }

  function createNodeFromContext(toolId: RuntimeContextToolId) {
    const point = contextMenu.value?.point
    contextMenu.value = null
    if (point) options.createNode(toolId, point)
  }

  function fitAll() {
    const nodes = options.nodes()
    if (!nodes.length) {
      options.updateViewport({ x: 0, y: 0, zoom: 1 })
      return
    }
    const bounds = nodes.reduce((current, node) => {
      const size = runtimeNodeSize(node)
      return {
        minX: Math.min(current.minX, node.x),
        minY: Math.min(current.minY, node.y),
        maxX: Math.max(current.maxX, node.x + size.width),
        maxY: Math.max(current.maxY, node.y + size.height),
      }
    }, {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    })
    const availableWidth = Math.max(320, window.innerWidth - 160)
    const availableHeight = Math.max(240, window.innerHeight - 200)
    const contentWidth = Math.max(1, bounds.maxX - bounds.minX)
    const contentHeight = Math.max(1, bounds.maxY - bounds.minY)
    const zoom = Math.min(
      1.25,
      Math.max(0.25, Math.min(availableWidth / contentWidth, availableHeight / contentHeight)),
    )
    options.updateViewport({
      zoom,
      x: 80 + (availableWidth - contentWidth * zoom) / 2 - bounds.minX * zoom,
      y: 100 + (availableHeight - contentHeight * zoom) / 2 - bounds.minY * zoom,
    })
  }

  return {
    beginCanvasPan,
    changeZoom,
    contextMenu,
    createNodeFromContext,
    finishCanvasPan,
    fitAll,
    handleCanvasWheel,
    moveCanvas,
    openCanvasContextMenu,
    zoomPercent,
  }
}
