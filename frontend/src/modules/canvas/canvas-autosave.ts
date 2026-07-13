import { isAxiosError } from 'axios'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { patchCanvasDocument } from './api'
import { getCanvasErrorMessage } from './persistence'
import type {
  CanvasDocumentConnectionUpsert,
  CanvasDocumentNodeUpsert,
  CanvasDocumentPatchPayload,
  CanvasGraphSaveState,
} from './types'

export const AUTOSAVE_DEBOUNCE_MS = 500
const RECOVERY_VERSION = 1

interface CanvasIdentity {
  userId: string
  projectId: string
  canvasId: string
}

interface PersistedGraph {
  node_upserts: CanvasDocumentNodeUpsert[]
  connection_upserts: CanvasDocumentConnectionUpsert[]
}

interface AutosaveBatch {
  payload: CanvasDocumentPatchPayload
  document: PersistedGraph
}

interface AutosaveStatus {
  state: CanvasGraphSaveState
  message: string
  conflictRevision: number | null
  hasRecovery: boolean
  canRetry: boolean
}

interface CanvasAutosaveOptions {
  getIdentity: () => CanvasIdentity | null
  getNodes: () => readonly CanvasNode[]
  getConnections: () => readonly CanvasConnection[]
  onRevision: (revision: number) => void
  onStatus: (status: AutosaveStatus) => void
}

interface ConflictPayload {
  detail?: {
    code?: unknown
    current_revision?: unknown
  }
}

function entityId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function createCanvasEntityId() {
  return entityId()
}

function toNodeUpsert(node: CanvasNode): CanvasDocumentNodeUpsert {
  return {
    id: node.id,
    node_type: node.type,
    content: {
      ...node.contentData,
      title: node.title,
      ...(node.content ? { text: node.content } : {}),
    },
    position_x: node.x,
    position_y: node.y,
    width: Math.round(node.width),
    height: Math.round(node.height),
    z_index: Math.round(node.zIndex ?? 0),
    parent_node_id: node.parentNodeId ?? null,
    is_locked: Boolean(node.isLocked),
    is_collapsed: Boolean(node.isCollapsed),
  }
}

function toConnectionUpsert(connection: CanvasConnection): CanvasDocumentConnectionUpsert {
  return {
    id: connection.id,
    source_node_id: connection.from,
    source_port: connection.sourcePort ?? 'out',
    target_node_id: connection.to,
    target_port: connection.targetPort ?? 'in',
    metadata: { ...connection.metadata },
  }
}

function captureGraph(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): PersistedGraph {
  return {
    node_upserts: nodes.map(toNodeUpsert).sort((left, right) => left.id.localeCompare(right.id)),
    connection_upserts: connections
      .map(toConnectionUpsert)
      .sort((left, right) => left.id.localeCompare(right.id)),
  }
}

function sameEntity(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function diffGraph(base: PersistedGraph, current: PersistedGraph) {
  const baseNodes = new Map(base.node_upserts.map((item) => [item.id, item]))
  const currentNodes = new Map(current.node_upserts.map((item) => [item.id, item]))
  const baseConnections = new Map(base.connection_upserts.map((item) => [item.id, item]))
  const currentConnections = new Map(current.connection_upserts.map((item) => [item.id, item]))
  return {
    node_upserts: current.node_upserts.filter((item) => !sameEntity(baseNodes.get(item.id), item)),
    node_deletes: [...baseNodes.keys()].filter((id) => !currentNodes.has(id)),
    connection_upserts: current.connection_upserts.filter(
      (item) => !sameEntity(baseConnections.get(item.id), item),
    ),
    connection_deletes: [...baseConnections.keys()].filter((id) => !currentConnections.has(id)),
  }
}

function hasMutations(diff: ReturnType<typeof diffGraph>) {
  return Boolean(
    diff.node_upserts.length || diff.node_deletes.length ||
    diff.connection_upserts.length || diff.connection_deletes.length,
  )
}

function recoveryKey(identity: CanvasIdentity) {
  return `revid:canvas-recovery:v1:${identity.userId}:${identity.projectId}:${identity.canvasId}`
}

export function createCanvasAutosave(options: CanvasAutosaveOptions) {
  let revision = 0
  let confirmed: PersistedGraph = { node_upserts: [], connection_upserts: [] }
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight: Promise<void> | null = null
  let retryBatch: AutosaveBatch | null = null
  let hasLoadedRecovery = false
  let status: AutosaveStatus = {
    state: 'saved', message: '', conflictRevision: null, hasRecovery: false, canRetry: false,
  }

  function emit(next: Partial<AutosaveStatus>) {
    status = { ...status, ...next }
    options.onStatus({ ...status })
  }

  function currentGraph() {
    return captureGraph(options.getNodes(), options.getConnections())
  }

  function readRecovery(identity: CanvasIdentity) {
    try {
      return globalThis.localStorage?.getItem(recoveryKey(identity)) ?? null
    } catch {
      return null
    }
  }

  function writeRecovery(batch = retryBatch) {
    const identity = options.getIdentity()
    if (!identity) return
    if (hasLoadedRecovery && !batch) return
    try {
      globalThis.localStorage?.setItem(recoveryKey(identity), JSON.stringify({
        version: RECOVERY_VERSION,
        projectId: identity.projectId,
        canvasId: identity.canvasId,
        baseRevision: revision,
        clientMutationId: batch?.payload.client_mutation_id ?? null,
        document: currentGraph(),
        savedAt: new Date().toISOString(),
      }))
      emit({ hasRecovery: true })
    } catch {
      emit({
        state: 'error',
        message: '无法写入本地恢复副本，请保持此页面打开并重试。',
        hasRecovery: false,
        canRetry: false,
      })
    }
  }

  function clearRecovery() {
    const identity = options.getIdentity()
    if (!identity) return
    try {
      globalThis.localStorage?.removeItem(recoveryKey(identity))
    } catch {
      return
    }
    hasLoadedRecovery = false
    emit({ hasRecovery: false })
  }

  function initialize(nextRevision: number) {
    if (timer) clearTimeout(timer)
    timer = null
    retryBatch = null
    revision = nextRevision
    confirmed = currentGraph()
    const identity = options.getIdentity()
    const hasRecovery = Boolean(identity && readRecovery(identity))
    hasLoadedRecovery = hasRecovery
    emit({
      state: hasRecovery ? 'error' : 'saved',
      message: hasRecovery ? '检测到此画布的本地恢复副本。' : '',
      conflictRevision: null,
      hasRecovery,
      canRetry: false,
    })
  }

  function reset() {
    if (timer) clearTimeout(timer)
    timer = null
    retryBatch = null
    inFlight = null
    hasLoadedRecovery = false
    revision = 0
    confirmed = { node_upserts: [], connection_upserts: [] }
    status = {
      state: 'saved', message: '', conflictRevision: null, hasRecovery: false, canRetry: false,
    }
  }

  function createBatch(): AutosaveBatch | null {
    const document = currentGraph()
    const mutations = diffGraph(confirmed, document)
    if (!hasMutations(mutations)) return null
    return {
      document,
      payload: {
        base_revision: revision,
        client_mutation_id: entityId(),
        ...mutations,
      },
    }
  }

  async function submit(batch: AutosaveBatch) {
    const identity = options.getIdentity()
    if (!identity) throw new Error('Canvas autosave identity is unavailable')
    emit({ state: 'saving', message: '', conflictRevision: null, canRetry: false })
    writeRecovery(batch)
    try {
      const response = await patchCanvasDocument(identity.projectId, identity.canvasId, batch.payload)
      revision = response.data.revision
      options.onRevision(revision)
      confirmed = batch.document
      retryBatch = null
    } catch (error) {
      retryBatch = batch
      const detail = isAxiosError<ConflictPayload>(error) ? error.response?.data?.detail : undefined
      const currentRevision = detail?.current_revision
      if (
        error && isAxiosError(error) && error.response?.status === 409 &&
        typeof detail?.code === 'string' &&
        typeof currentRevision === 'number' && Number.isSafeInteger(currentRevision)
      ) {
        emit({
          state: 'conflict',
          message: '服务器已有更新，本地工作已保留。',
          conflictRevision: currentRevision,
          hasRecovery: true,
          canRetry: false,
        })
      } else {
        emit({
          state: 'error',
          message: getCanvasErrorMessage(error, '画布尚未保存，本地工作已保留，请重试。'),
          conflictRevision: null,
          hasRecovery: true,
          canRetry: true,
        })
      }
      writeRecovery(batch)
      throw error
    }
  }

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer)
    timer = null
    if (status.state === 'conflict') throw new Error(status.message)
    if (inFlight) {
      await inFlight
      return flush()
    }
    const batch = retryBatch ?? createBatch()
    if (!batch) {
      if (hasLoadedRecovery) return
      clearRecovery()
      emit({ state: 'saved', message: '', conflictRevision: null, canRetry: false })
      return
    }
    const request = submit(batch)
    inFlight = request
    try {
      await request
    } finally {
      if (inFlight === request) inFlight = null
    }
    if (createBatch()) return flush()
    clearRecovery()
    emit({ state: 'saved', message: '', conflictRevision: null, canRetry: false })
  }

  function queue() {
    writeRecovery()
    if (status.state === 'error' || status.state === 'conflict') return
    emit({ state: 'saving', message: '', conflictRevision: null, canRetry: false })
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void flush().catch(() => undefined), AUTOSAVE_DEBOUNCE_MS)
  }

  async function retry() {
    if (status.state === 'conflict') throw new Error(status.message)
    return flush()
  }

  return { flush, initialize, preserveRecovery: writeRecovery, queue, reset, retry }
}
