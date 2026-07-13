import { ref, type Ref } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasCommandHistory } from './canvas-command-history'
import type { CanvasCommandEnvelope } from './canvas-commands'

interface CanvasHistoryMutations {
  executeCommand: (envelope: CanvasCommandEnvelope) => Promise<void> | void
  applyGraph: (nodes: CanvasNode[], connections: CanvasConnection[]) => Promise<void> | void
}

export function createCanvasHistoryActions(
  mutations: CanvasHistoryMutations,
  nodes: Ref<CanvasNode[]>,
  connections: Ref<CanvasConnection[]>,
) {
  const canUndo = ref(false)
  const canRedo = ref(false)
  const history = createCanvasCommandHistory({
    getNodes: () => nodes.value,
    getConnections: () => connections.value,
    executeCommand: mutations.executeCommand,
    applyGraph: mutations.applyGraph,
    onState: (state) => {
      canUndo.value = state.canUndo
      canRedo.value = state.canRedo
    },
  })

  function activate(projectId: string, canvasId: string, reset = false) {
    if (projectId && canvasId) history.activate(`${projectId}/${canvasId}`, { reset })
    else history.deactivate()
  }

  return {
    canUndo,
    canRedo,
    activate,
    deactivate: history.deactivate,
    clearAll: history.clearAll,
    execute: history.execute,
    undo: history.undo,
    redo: history.redo,
  }
}
