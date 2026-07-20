import type { Ref } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import { clampZoom, normalizeViewport, type ViewportState } from '../canvas-geometry'

export function useCanvasStageViewport(canvasSurfaceRef: Ref<HTMLElement | null>) {
  const canvasStore = useCanvasStore()

  function cssVar(name: string, fallback: string) {
    if (!canvasSurfaceRef.value) return fallback
    return getComputedStyle(canvasSurfaceRef.value).getPropertyValue(name).trim() || fallback
  }

  function getViewport(): ViewportState {
    return normalizeViewport(canvasStore.viewport)
  }

  function updateViewport(next: Partial<ViewportState>) {
    const current = getViewport()
    canvasStore.updateViewport({
      zoom: clampZoom(next.zoom ?? current.zoom),
      x: next.x ?? current.x,
      y: next.y ?? current.y,
    })
  }

  return { cssVar, getViewport, updateViewport }
}
