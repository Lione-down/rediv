import { ref } from 'vue'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'

interface RuntimeNodeDragOptions {
  moveNode: (payload: { nodeId: string; x: number; y: number }) => void
  selectNode: (nodeId: string) => void
  setInteractionState: (state: 'idle' | 'card-drag') => void
  updateTransientNode: (payload: { nodeId: string; x: number; y: number } | null) => void
  viewport: () => PersistedViewport
}

export function useRuntimeNodeDrag(options: RuntimeNodeDragOptions) {
  const dragState = ref<{
    deltaX: number
    deltaY: number
    nodeId: string
    originX: number
    originY: number
    pointerId: number
    startX: number
    startY: number
  } | null>(null)

  function nodeStyle(node: CanvasNode) {
    const drag = dragState.value?.nodeId === node.id ? dragState.value : null
    return {
      left: `${node.x + (drag?.deltaX ?? 0) / options.viewport().zoom}px`,
      top: `${node.y + (drag?.deltaY ?? 0) / options.viewport().zoom}px`,
      width: `${Math.max(220, node.width)}px`,
      height: `${Math.max(140, node.height)}px`,
      zIndex: node.zIndex ?? 0,
    }
  }

  function beginCardDrag(event: PointerEvent, node: CanvasNode, isEditing: boolean) {
    if (event.button !== 0 || node.isLocked || isEditing) return
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)
    options.selectNode(node.id)
    dragState.value = {
      deltaX: 0,
      deltaY: 0,
      nodeId: node.id,
      originX: node.x,
      originY: node.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
    options.setInteractionState('card-drag')
  }

  function moveCard(event: PointerEvent) {
    const drag = dragState.value
    if (!drag || drag.pointerId !== event.pointerId) return
    drag.deltaX = event.clientX - drag.startX
    drag.deltaY = event.clientY - drag.startY
    options.updateTransientNode({
      nodeId: drag.nodeId,
      x: drag.originX + drag.deltaX / options.viewport().zoom,
      y: drag.originY + drag.deltaY / options.viewport().zoom,
    })
  }

  function finishCardDrag(event: PointerEvent) {
    const drag = dragState.value
    if (!drag || drag.pointerId !== event.pointerId) return
    const x = drag.originX + drag.deltaX / options.viewport().zoom
    const y = drag.originY + drag.deltaY / options.viewport().zoom
    dragState.value = null
    options.setInteractionState('idle')
    if (x !== drag.originX || y !== drag.originY) {
      options.moveNode({ nodeId: drag.nodeId, x, y })
    }
    options.updateTransientNode(null)
  }

  function cancelCardDrag(event: PointerEvent) {
    if (dragState.value?.pointerId !== event.pointerId) return
    dragState.value = null
    options.updateTransientNode(null)
    options.setInteractionState('idle')
  }

  return {
    beginCardDrag,
    cancelCardDrag,
    dragState,
    finishCardDrag,
    moveCard,
    nodeStyle,
  }
}
