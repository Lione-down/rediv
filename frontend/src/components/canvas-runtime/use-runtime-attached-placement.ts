import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { resolveCanvasNodeLayoutSize } from '../../modules/canvas/canvas-card-geometry'
import type { PersistedViewport } from '../../modules/canvas/persistence'
import type { CanvasNode } from '../../types/canvas'

export function runtimeReferenceRoleLabel(role: string) {
  if (role === 'first-frame') return '首帧'
  if (role === 'last-frame') return '尾帧'
  return '参考'
}

export function useRuntimeAttachedPlacement(
  getNode: () => CanvasNode,
  getViewport: () => PersistedViewport,
) {
  const windowWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
  const windowHeight = ref(typeof window === 'undefined' ? 900 : window.innerHeight)
  const screenRect = computed(() => {
    const node = getNode()
    const viewport = getViewport()
    const size = resolveCanvasNodeLayoutSize(node)
    return {
      left: viewport.x + node.x * viewport.zoom,
      top: viewport.y + node.y * viewport.zoom,
      width: size.width * viewport.zoom,
      height: size.height * viewport.zoom,
    }
  })
  const toolbarStyle = computed(() => {
    const rect = screenRect.value
    const preferredLeft = rect.left + rect.width + 16
    const left = preferredLeft + 44 <= windowWidth.value - 16
      ? preferredLeft
      : Math.max(16, rect.left - 60)
    return { left: `${left}px`, top: `${Math.max(76, rect.top)}px` }
  })
  const composerStyle = computed(() => {
    const rect = screenRect.value
    const width = Math.min(560, windowWidth.value - 32)
    const left = Math.min(
      Math.max(16, rect.left + rect.width / 2 - width / 2),
      windowWidth.value - width - 16,
    )
    const belowTop = rect.top + rect.height + 12
    const aboveTop = rect.top - 224
    const top = belowTop + 186 <= windowHeight.value - 78 || aboveTop < 76
      ? belowTop
      : aboveTop
    return { left: `${left}px`, top: `${top}px`, width: `${width}px` }
  })

  function updateViewportSize() {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', updateViewportSize))
  onBeforeUnmount(() => window.removeEventListener('resize', updateViewportSize))
  return { composerStyle, toolbarStyle }
}
