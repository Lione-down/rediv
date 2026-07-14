import { computed, ref } from 'vue'
import {
  createConnectionContinuationCommand,
  resolveConnectionContinuationOptions,
  type ConnectionContinuationOption,
} from '../../../modules/canvas/connection-continuation'
import { useCanvasStore } from '../../../store/canvas'
import type { Point } from '../canvas-geometry'

interface ContinuationState {
  sourceNodeId: string
  sourcePort: string
  surfacePoint: Point
  worldPoint: Point
  options: ConnectionContinuationOption[]
}

interface ConnectionContinuationOptions {
  getViewportSize: () => { width: number; height: number }
}

const MENU_WIDTH = 248
const MENU_MARGIN = 12

export function useCanvasConnectionContinuation(options: ConnectionContinuationOptions) {
  const canvasStore = useCanvasStore()
  const connectionContinuation = ref<ContinuationState | null>(null)
  const continuationStyle = computed(() => {
    const state = connectionContinuation.value
    if (!state) return null
    const viewport = options.getViewportSize()
    return {
      left: `${Math.max(MENU_MARGIN, Math.min(state.surfacePoint.x + 12, viewport.width - MENU_WIDTH - MENU_MARGIN))}px`,
      top: `${Math.max(MENU_MARGIN, Math.min(state.surfacePoint.y + 12, viewport.height - 280))}px`,
    }
  })

  function closeConnectionContinuation() {
    connectionContinuation.value = null
  }

  function openConnectionContinuation(
    sourceNodeId: string,
    sourcePort: string,
    surfacePoint: Point,
    worldPoint: Point,
  ) {
    const source = canvasStore.findNodeById(sourceNodeId)
    if (!source) return false
    const compatibleOptions = resolveConnectionContinuationOptions(source, sourcePort)
    if (!compatibleOptions.length) return false
    connectionContinuation.value = {
      sourceNodeId,
      sourcePort,
      surfacePoint,
      worldPoint,
      options: compatibleOptions,
    }
    return true
  }

  async function selectConnectionContinuation(key: string) {
    const state = connectionContinuation.value
    const source = state ? canvasStore.findNodeById(state.sourceNodeId) : null
    const selected = state?.options.find((option) => option.key === key)
    closeConnectionContinuation()
    if (!state || !source || !selected) return
    await canvasStore.dispatchCommand({
      source: 'pointer',
      command: createConnectionContinuationCommand(source, selected, state.worldPoint),
    })
  }

  return {
    closeConnectionContinuation,
    connectionContinuation,
    continuationStyle,
    openConnectionContinuation,
    selectConnectionContinuation,
  }
}
