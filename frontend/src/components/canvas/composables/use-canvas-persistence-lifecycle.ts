import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useCanvasStore } from '../../../store/canvas'

export function useCanvasPersistenceLifecycle() {
  const canvasStore = useCanvasStore()

  function flushPersistence() {
    return canvasStore.flushPendingPersistence()
  }

  onBeforeRouteLeave(async () => {
    await flushPersistence()
  })

  onBeforeRouteUpdate(async () => {
    await flushPersistence()
  })

  function handlePageHide() {
    void flushPersistence().catch(() => undefined)
  }

  onMounted(() => {
    window.addEventListener('pagehide', handlePageHide)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', handlePageHide)
    void flushPersistence().catch(() => undefined)
  })
}
