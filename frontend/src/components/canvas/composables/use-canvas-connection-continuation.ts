import { computed, ref } from 'vue'
import {
  createConnectionContinuationCommand,
  resolveConnectionContinuationOptions,
  type ConnectionContinuationDirection,
  type ConnectionContinuationOption,
} from '../../../modules/canvas/connection-continuation'
import { useCanvasStore } from '../../../store/canvas'
import type { Point } from '../canvas-geometry'

export interface ContinuationState {
  originNodeId: string
  originPort: string
  direction: ConnectionContinuationDirection
  isForegroundAction: boolean
  surfacePoint: Point
  worldPoint: Point
  options: ConnectionContinuationOption[]
}

interface ConnectionContinuationOptions {
  getViewportSize: () => { width: number; height: number }
}

const MENU_WIDTH = 248
const MENU_MAX_HEIGHT = 340
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
      top: `${Math.max(MENU_MARGIN, Math.min(state.surfacePoint.y + 12, viewport.height - MENU_MAX_HEIGHT - MENU_MARGIN))}px`,
    }
  })

  function closeConnectionContinuation() {
    connectionContinuation.value = null
  }

  function openConnectionContinuation(
    originNodeId: string,
    originPort: string,
    direction: ConnectionContinuationDirection,
    surfacePoint: Point,
    worldPoint: Point,
    isForegroundAction = false,
  ) {
    const origin = canvasStore.findNodeById(originNodeId)
    if (!origin) return false
    const compatibleOptions = resolveConnectionContinuationOptions(origin, originPort, direction)
    if (!compatibleOptions.length) return false
    connectionContinuation.value = {
      originNodeId,
      originPort,
      direction,
      isForegroundAction,
      surfacePoint,
      worldPoint,
      options: compatibleOptions,
    }
    return true
  }

  async function selectConnectionContinuation(key: string) {
    const state = connectionContinuation.value
    const origin = state ? canvasStore.findNodeById(state.originNodeId) : null
    const selected = state?.options.find((option) => option.key === key)
    closeConnectionContinuation()
    if (!state || !origin || !selected) return null
    const command = createConnectionContinuationCommand(
      origin, selected, state.worldPoint, state.direction, undefined,
      state.isForegroundAction ? canvasStore.nodes : [],
    )
    await canvasStore.dispatchCommand({
      source: 'pointer',
      command,
    })
    if (!state.isForegroundAction) return null
    canvasStore.selectNode(command.nodes[0].id)
    return command.nodes[0].id
  }

  return {
    closeConnectionContinuation,
    connectionContinuation,
    continuationStyle,
    openConnectionContinuation,
    selectConnectionContinuation,
  }
}
