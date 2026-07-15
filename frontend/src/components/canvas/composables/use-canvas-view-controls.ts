import { computed, ref, watch } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import {
  clampZoom,
  fitViewportToNodes,
  surfaceToWorld,
  type Point,
  type ViewportInsets,
  type ViewportSize,
  type ViewportState,
} from '../canvas-geometry'

const ZOOM_PRESETS = [0.1, 0.25, 0.5, 1, 2, 4, 8] as const

interface CanvasViewControlsOptions {
  focusStage: () => void
  getViewport: () => ViewportState
  getViewportSize: () => ViewportSize
  isReadOnly: () => boolean
  updateViewport: (viewport: Partial<ViewportState>) => void
}

interface CanvasViewPreferences {
  edges: boolean
  grid: boolean
  minimap: boolean
}

const DEFAULT_PREFERENCES: CanvasViewPreferences = { edges: true, grid: true, minimap: true }

export function useCanvasViewControls(options: CanvasViewControlsOptions) {
  const canvasStore = useCanvasStore()
  const isGridEnabled = ref(true)
  const areEdgesVisible = ref(true)
  const isMinimapVisible = ref(true)
  const preferencesByCanvas = new Map<string, CanvasViewPreferences>()
  const readonlyAutoFitCanvases = new Set<string>()
  const zoomPercent = computed(() => Math.round(options.getViewport().zoom * 100))

  function savePreferences(canvasId: string) {
    if (!canvasId) return
    preferencesByCanvas.set(canvasId, {
      edges: areEdgesVisible.value,
      grid: isGridEnabled.value,
      minimap: isMinimapVisible.value,
    })
  }

  function loadPreferences(canvasId: string) {
    const preferences = preferencesByCanvas.get(canvasId) ?? DEFAULT_PREFERENCES
    areEdgesVisible.value = preferences.edges
    isGridEnabled.value = preferences.grid
    isMinimapVisible.value = preferences.minimap
  }

  function applyZoomAtPoint(nextZoom: number, point?: Point) {
    const viewport = options.getViewport()
    const size = options.getViewportSize()
    const anchor = point ?? { x: size.width / 2, y: size.height / 2 }
    const zoom = clampZoom(nextZoom)
    if (Math.abs(zoom - viewport.zoom) < 0.0001) return false
    const worldPoint = surfaceToWorld(anchor, viewport)
    options.updateViewport({ zoom, x: anchor.x - worldPoint.x * zoom, y: anchor.y - worldPoint.y * zoom })
    return true
  }

  function stepZoom(direction: 1 | -1) {
    const current = options.getViewport().zoom
    const presets = direction > 0 ? ZOOM_PRESETS : [...ZOOM_PRESETS].reverse()
    const next = presets.find((preset) => direction > 0 ? preset > current + 0.0001 : preset < current - 0.0001)
    options.focusStage()
    return applyZoomAtPoint(next ?? (direction > 0 ? 8 : 0.1))
  }

  function setZoomPercent(percent: number) {
    if (!Number.isFinite(percent)) return false
    options.focusStage()
    return applyZoomAtPoint(percent / 100)
  }

  function fitNodes(nodes: readonly CanvasNode[], shouldFocus = true, insets: Partial<ViewportInsets> = {}) {
    const viewport = fitViewportToNodes(nodes, options.getViewportSize(), 48, insets)
    if (!viewport) return false
    options.updateViewport(viewport)
    if (shouldFocus) options.focusStage()
    return true
  }

  function fitGraph() { return fitNodes(canvasStore.nodes) }
  function fitSelection() { return fitNodes(canvasStore.selectedNodes) }

  function toggleGrid() { isGridEnabled.value = !isGridEnabled.value; options.focusStage() }
  function toggleEdges() { areEdgesVisible.value = !areEdgesVisible.value; options.focusStage() }
  function toggleMinimap() { isMinimapVisible.value = !isMinimapVisible.value; options.focusStage() }

  function maybeAutoFitReadonly() {
    const canvasId = canvasStore.activeCanvasId
    const viewport = options.getViewport()
    if (
      !options.isReadOnly() || !canvasId || !canvasStore.hasLoaded || !canvasStore.nodes.length ||
      readonlyAutoFitCanvases.has(canvasId) || viewport.zoom !== 1 || viewport.x !== 0 || viewport.y !== 0
    ) return false
    const fitted = fitNodes(canvasStore.nodes, false)
    if (fitted) readonlyAutoFitCanvases.add(canvasId)
    return fitted
  }

  function handleViewKeyDown(event: KeyboardEvent) {
    if (event.repeat || !(event.ctrlKey || event.metaKey)) return false
    if (event.key === '0') {
      event.preventDefault()
      fitGraph()
      return true
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      stepZoom(1)
      return true
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      stepZoom(-1)
      return true
    }
    return false
  }

  watch(() => canvasStore.activeCanvasId, (canvasId, previousCanvasId) => {
    savePreferences(previousCanvasId)
    loadPreferences(canvasId)
  }, { flush: 'sync' })
  watch(
    () => [canvasStore.activeCanvasId, canvasStore.hasLoaded, canvasStore.nodes.length],
    () => maybeAutoFitReadonly(),
    { flush: 'post' },
  )

  return {
    applyZoomAtPoint, areEdgesVisible, fitGraph, fitNodes, fitSelection, handleViewKeyDown,
    isGridEnabled, isMinimapVisible, maybeAutoFitReadonly, setZoomPercent,
    toggleEdges, toggleGrid, toggleMinimap, zoomIn: () => stepZoom(1),
    zoomOut: () => stepZoom(-1), zoomPercent,
  }
}
