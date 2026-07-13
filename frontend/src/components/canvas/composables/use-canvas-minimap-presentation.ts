import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { CanvasNode } from '../../../types/canvas'
import {
  calculateMinimapMetrics,
  minimapNodeStyle as getMinimapNodeStyle,
  minimapViewportStyle as getMinimapViewportStyle,
  viewportWorldRect,
  type ViewportSize,
  type ViewportState,
} from '../canvas-geometry'

const MINIMAP_INTERVAL_MS = 1000 / 15

interface CanvasMinimapPresentationOptions {
  getMinimapSize: () => ViewportSize
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
  getViewportSize: () => ViewportSize
}

export function useCanvasMinimapPresentation(options: CanvasMinimapPresentationOptions) {
  const minimapNodes = ref<CanvasNode[]>([])
  const sampledViewportRect = ref(viewportWorldRect(options.getViewport(), options.getViewportSize()))
  let lastUpdateAt = Number.NEGATIVE_INFINITY
  let updateTimer: number | null = null

  function updateSnapshot() {
    updateTimer = null
    minimapNodes.value = options.getNodes().map((node) => ({ ...node }))
    sampledViewportRect.value = viewportWorldRect(options.getViewport(), options.getViewportSize())
    lastUpdateAt = performance.now()
  }

  function scheduleUpdate() {
    if (updateTimer !== null) return
    const delay = Math.max(0, MINIMAP_INTERVAL_MS - (performance.now() - lastUpdateAt))
    updateTimer = window.setTimeout(updateSnapshot, delay)
  }

  const minimapMetrics = computed(() => calculateMinimapMetrics(
    minimapNodes.value,
    sampledViewportRect.value,
    options.getMinimapSize(),
  ))
  const minimapNodeStyles = computed(() => new Map(minimapNodes.value.map((node) => [
    node.id,
    getMinimapNodeStyle(node, minimapMetrics.value),
  ])))
  const minimapViewportStyle = computed(() => getMinimapViewportStyle(
    sampledViewportRect.value,
    minimapMetrics.value,
  ))

  watch(
    [
      () => options.getNodes().map(({ id, title, type, x, y, width, height }) => ({ id, title, type, x, y, width, height })),
      () => options.getViewport(),
      () => options.getViewportSize(),
      () => options.getMinimapSize(),
    ],
    scheduleUpdate,
    { deep: true, immediate: true },
  )

  onBeforeUnmount(() => {
    if (updateTimer !== null) window.clearTimeout(updateTimer)
    updateTimer = null
  })

  return {
    minimapMetrics,
    minimapNodes,
    minimapNodeStyle: (node: CanvasNode) => minimapNodeStyles.value.get(node.id),
    minimapViewportStyle,
  }
}
