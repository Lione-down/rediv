import { ref, type Ref } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasCommandHistory } from './canvas-command-history'
import { mapCanvasConnection, mapCanvasNode } from './mappers'
import type { CanvasCommandEnvelope } from './canvas-commands'
import type { CanvasDocumentPatchResponse } from './types'

interface CanvasHistoryMutations {
  executeCommand: (envelope: CanvasCommandEnvelope) => Promise<void> | void
  applyGraph: (nodes: CanvasNode[], connections: CanvasConnection[]) => Promise<void> | void
  applyCommittedMutation: (mutation: CanvasDocumentPatchResponse) => void
}

export function createCanvasHistoryActions(
  mutations: CanvasHistoryMutations,
  nodes: Ref<CanvasNode[]>,
  connections: Ref<CanvasConnection[]>,
  adoptCommittedRevision: (revision: number, applyCommittedGraph: () => void) => void,
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

  function resolveCommittedEnvelope(
    mutation: CanvasDocumentPatchResponse,
    envelope?: CanvasCommandEnvelope,
  ) {
    return envelope ?? (() => {
      const existingNodeIds = new Set(nodes.value.map((node) => node.id))
      const existingConnectionIds = new Set(connections.value.map((connection) => connection.id))
      if (
        mutation.node_deletes.length || mutation.connection_deletes.length ||
        mutation.node_upserts.some((node) => existingNodeIds.has(node.id)) ||
        mutation.connection_upserts.some((connection) => existingConnectionIds.has(connection.id))
      ) throw new Error('采用非创建型服务器变更时必须提供 history envelope。')
      return {
        source: 'toolbar',
        command: {
          type: 'insert-graph',
          nodes: mutation.node_upserts.map(mapCanvasNode),
          connections: mutation.connection_upserts.map(mapCanvasConnection),
        },
      } satisfies CanvasCommandEnvelope
    })()
  }

  function applyCommittedMutation(
    mutation: CanvasDocumentPatchResponse,
    envelope: CanvasCommandEnvelope,
    adopt: (
      envelope: CanvasCommandEnvelope,
      applyCommittedGraph: () => Promise<void> | void,
    ) => Promise<void>,
  ) {
    return adopt(envelope, () => {
      adoptCommittedRevision(mutation.revision, () => {
        mutations.applyCommittedMutation(mutation)
      })
    })
  }

  function adoptCommittedMutation(
    mutation: CanvasDocumentPatchResponse,
    envelope?: CanvasCommandEnvelope,
  ) {
    const resolvedEnvelope = resolveCommittedEnvelope(mutation, envelope)
    return history.adopt(resolvedEnvelope, () => {
      adoptCommittedRevision(mutation.revision, () => {
        mutations.applyCommittedMutation(mutation)
      })
    })
  }

  function runSerialized<T>(operation: (actions: {
    adoptCommittedMutation: (
      mutation: CanvasDocumentPatchResponse,
      envelope?: CanvasCommandEnvelope,
    ) => Promise<void>
    execute: (envelope: CanvasCommandEnvelope) => Promise<void>
  }) => Promise<T> | T) {
    return history.runSerialized(({ adopt, execute }) => operation({
      adoptCommittedMutation: (mutation, envelope) => applyCommittedMutation(
        mutation,
        resolveCommittedEnvelope(mutation, envelope),
        adopt,
      ),
      execute,
    }))
  }

  return {
    canUndo,
    canRedo,
    activate,
    deactivate: history.deactivate,
    clearAll: history.clearAll,
    adoptCommittedMutation,
    runSerialized,
    execute: history.execute,
    undo: history.undo,
    redo: history.redo,
  }
}
