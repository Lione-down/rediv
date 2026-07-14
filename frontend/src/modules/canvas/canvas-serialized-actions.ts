import type { CanvasNode } from '../../types/canvas'
import type { CanvasCommandEnvelope } from './canvas-commands'
import type { PersistedGenerationStatus } from './node-registry'
import type { CanvasDocumentPatchResponse } from './types'

export interface CanvasDocumentContext {
  authToken: string
  generation: number
  projectId: string
  canvasId: string
}

export interface ScopedCanvasMutationResponse {
  project_id: string
  canvas_id: string
  mutation: CanvasDocumentPatchResponse
}

interface SerializedHistoryActions {
  adoptCommittedMutation: (
    mutation: CanvasDocumentPatchResponse,
    envelope?: CanvasCommandEnvelope,
  ) => Promise<void>
  execute: (envelope: CanvasCommandEnvelope) => Promise<void>
}

interface CanvasSerializedActionsOptions {
  runSerialized: <T>(
    operation: (actions: SerializedHistoryActions) => Promise<T> | T,
  ) => Promise<T>
  hasLoaded: () => boolean
  getGraphRevision: () => number
  captureDocumentContext: () => CanvasDocumentContext
  isCurrentDocument: (context: CanvasDocumentContext) => boolean
  flushPendingPersistence: () => Promise<void>
  retryAutosave: () => Promise<void>
  applyNodeStatus: (nodeId: string, status: CanvasNode['status']) => void
  applyNodeContent: (nodeId: string, content: string) => void
  applyNodeGenerationState: (
    nodeId: string,
    status: PersistedGenerationStatus,
    taskId?: string,
    isResultMaterialized?: boolean,
  ) => void
}

export function createCanvasSerializedActions(options: CanvasSerializedActionsOptions) {
  function requireContext(expectedProjectId: string, expectedCanvasId: string) {
    const context = options.captureDocumentContext()
    if (
      !options.hasLoaded() || context.projectId !== expectedProjectId ||
      context.canvasId !== expectedCanvasId
    ) throw new Error('Canvas 操作上下文已变化，请重试。')
    return context
  }

  function run<T>(operation: () => Promise<T> | T) {
    return options.runSerialized(() => operation())
  }

  function runDocumentLoad<T>(operation: () => Promise<T> | T, flushCurrent = true) {
    return options.runSerialized(async () => {
      if (flushCurrent && options.hasLoaded()) await options.flushPendingPersistence()
      return operation()
    })
  }

  function flushPendingPersistence() {
    return run(options.flushPendingPersistence)
  }

  function retryAutosave() {
    return run(options.retryAutosave)
  }

  function runScopedCanvasAction<T>(
    expectedProjectId: string,
    expectedCanvasId: string,
    operation: () => Promise<T> | T,
  ) {
    return options.runSerialized(async () => {
      const context = requireContext(expectedProjectId, expectedCanvasId)
      await options.flushPendingPersistence()
      if (!options.isCurrentDocument(context)) throw new Error('Canvas 操作上下文已变化，请重试。')
      const result = await operation()
      if (!options.isCurrentDocument(context)) throw new Error('Canvas 操作上下文已变化，请重试。')
      return result
    })
  }

  function commitScopedCanvasMutation<T extends ScopedCanvasMutationResponse>(
    expectedProjectId: string,
    expectedCanvasId: string,
    requestMutation: (baseRevision: number) => Promise<T>,
  ) {
    return options.runSerialized(async ({ adoptCommittedMutation }) => {
      const context = requireContext(expectedProjectId, expectedCanvasId)
      await options.flushPendingPersistence()
      if (!options.isCurrentDocument(context)) throw new Error('Canvas 操作上下文已变化，请重试。')
      const response = await requestMutation(options.getGraphRevision())
      if (
        !options.isCurrentDocument(context) || response.project_id !== context.projectId ||
        response.canvas_id !== context.canvasId
      ) throw new Error('Canvas 服务器变更上下文不匹配。')
      await adoptCommittedMutation(response.mutation)
      if (!options.isCurrentDocument(context)) throw new Error('Canvas 操作上下文已变化，请重试。')
      return response
    })
  }

  function reconcileGeneration<T>(
    expectedProjectId: string,
    expectedCanvasId: string,
    operation: (actions: {
      execute: (envelope: CanvasCommandEnvelope) => Promise<void>
      setNodeGenerationState: CanvasSerializedActionsOptions['applyNodeGenerationState']
    }) => Promise<T> | T,
  ) {
    return options.runSerialized(async ({ execute }) => {
      const context = requireContext(expectedProjectId, expectedCanvasId)
      const result = await operation({
        execute,
        setNodeGenerationState: options.applyNodeGenerationState,
      })
      if (!options.isCurrentDocument(context)) throw new Error('Canvas 操作上下文已变化，请重试。')
      await options.flushPendingPersistence()
      return result
    })
  }

  function setNodeStatus(nodeId: string, status: CanvasNode['status']) {
    return run(() => options.applyNodeStatus(nodeId, status))
  }

  function setNodeContent(nodeId: string, content: string) {
    return run(() => options.applyNodeContent(nodeId, content))
  }

  function setNodeGenerationState(
    nodeId: string,
    status: PersistedGenerationStatus,
    taskId = '',
    isResultMaterialized = false,
  ) {
    return run(() => options.applyNodeGenerationState(
      nodeId, status, taskId, isResultMaterialized,
    ))
  }

  return {
    run,
    runDocumentLoad,
    flushPendingPersistence,
    retryAutosave,
    runScopedCanvasAction,
    commitScopedCanvasMutation,
    reconcileGeneration,
    setNodeStatus,
    setNodeContent,
    setNodeGenerationState,
  }
}
