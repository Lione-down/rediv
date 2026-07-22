import { computed, type Ref } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../../types/canvas'
import { buildConnectionPath } from '../canvas-connection-path'
import { surfaceToWorld, type Point, type ViewportState } from '../canvas-geometry'
import { projectCanvasMaterializedCardFamilies } from '../canvas-materialized-card-projection'
import type { CanvasStageDraftConnectionState } from './canvas-stage-types'

interface CanvasStageCardInteractionOptions {
  draftConnection: Ref<CanvasStageDraftConnectionState | null>
  findNodeAtWorldPoint: (point: Point) => CanvasNode | null
  focusCanvasStage: () => void
  getConnections: () => readonly CanvasConnection[]
  getNodes: () => readonly CanvasNode[]
  getSelectedNodeIds: () => readonly string[]
  getSelectedNodes: () => readonly CanvasNode[]
  getViewport: () => ViewportState
  isReadOnly: () => boolean
  selectNode: (nodeId: string) => void
  toSurfacePoint: (clientX: number, clientY: number) => Point | null
}

export function useCanvasStageCardInteractions(options: CanvasStageCardInteractionOptions) {
  const materializedCardProjection = computed(() => projectCanvasMaterializedCardFamilies(
    options.getNodes(), options.getConnections(), options.getSelectedNodeIds(),
  ))
  const hiddenPresentationNodeIds = computed(() => materializedCardProjection.value.hiddenNodeIds)
  const presentationNodes = computed(() => materializedCardProjection.value.nodes)
  const presentationConnections = computed(() => materializedCardProjection.value.connections)
  const temporaryConnectionPath = computed(() => {
    const draft = options.draftConnection.value
    if (!draft) return ''
    const pointer = surfaceToWorld({ x: draft.currentX, y: draft.currentY }, options.getViewport())
    const origin = surfaceToWorld({ x: draft.startX, y: draft.startY }, options.getViewport())
    return draft.direction === 'output' ? buildConnectionPath(origin, pointer) : buildConnectionPath(pointer, origin)
  })

  function selectNodeBehindOverlay(event: PointerEvent) {
    if (event.button !== 0 || !(event.ctrlKey || event.metaKey || event.shiftKey)) return false
    const point = options.toSurfacePoint(event.clientX, event.clientY)
    if (!point) return false
    const node = options.findNodeAtWorldPoint(surfaceToWorld(point, options.getViewport()))
    if (!node) return false
    options.focusCanvasStage()
    options.selectNode(node.id)
    return true
  }

  return {
    hiddenPresentationNodeIds, presentationConnections, presentationNodes,
    selectNodeBehindOverlay, temporaryConnectionPath,
  }
}
