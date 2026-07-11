import { onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useCanvasStore } from '../../../store/canvas'

export function useCanvasPersistenceLifecycle() {
  const canvasStore = useCanvasStore()

  onBeforeRouteLeave(async () => {
    await canvasStore.flushPendingMoves()
  })

  onBeforeRouteUpdate(async () => {
    await canvasStore.flushPendingMoves()
  })

  onBeforeUnmount(() => {
    void canvasStore.flushPendingMoves().catch(() => undefined)
  })
}
