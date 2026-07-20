import { ref } from 'vue'
import type { CanonicalNodeType } from '../../../modules/canvas/node-registry'
import { surfaceToWorld, type Point, type ViewportState } from '../canvas-geometry'

interface CanvasStageOverlayOptions {
  closeContextMenu: () => void
  createRegistryNodeAt: (
    type: CanonicalNodeType,
    point: Point,
    subtype?: string,
  ) => Promise<unknown>
  getViewport: () => ViewportState
  getViewportSize: () => { width: number; height: number }
  onOpenSurface?: () => void
}

export function useCanvasStageOverlays(options: CanvasStageOverlayOptions) {
  const isGraphPanelOpen = ref(false)
  const isNodeMenuOpen = ref(false)

  function closeGraphPanel() { isGraphPanelOpen.value = false }
  function closeNodeMenu() { isNodeMenuOpen.value = false }
  function toggleGraphPanel() {
    isNodeMenuOpen.value = false
    if (!isGraphPanelOpen.value) options.onOpenSurface?.()
    isGraphPanelOpen.value = !isGraphPanelOpen.value
  }
  function openNodeMenu() {
    options.onOpenSurface?.()
    options.closeContextMenu()
    isGraphPanelOpen.value = false
    isNodeMenuOpen.value = true
  }
  function updateNodeMenuOpen(open: boolean) {
    if (open) openNodeMenu()
    else closeNodeMenu()
  }
  function createNodeFromMenu(type: CanonicalNodeType, subtype: string) {
    const size = options.getViewportSize()
    const point = surfaceToWorld({ x: size.width / 2, y: size.height / 2 }, options.getViewport())
    closeNodeMenu()
    void options.createRegistryNodeAt(type, point, subtype)
  }

  return {
    closeGraphPanel,
    closeNodeMenu,
    createNodeFromMenu,
    isGraphPanelOpen,
    isNodeMenuOpen,
    openNodeMenu,
    toggleGraphPanel,
    updateNodeMenuOpen,
  }
}
