import { isAxiosError } from 'axios'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { patchCanvasDocument } from './api'
import { mapCanvasRecoveryGraph } from './mappers'
import { getCanvasErrorMessage } from './persistence'
import { toCanvasDocumentNodeUpsert } from './node-serialization'
import { parseCanvasRecoverySnapshot } from './canvas-recovery'
import type {
  CanvasDocumentConnectionUpsert,
  CanvasDocumentPatchPayload,
  CanvasGraphSaveState,
  CanvasRecoveryDocument,
} from './types'

export const AUTOSAVE_DEBOUNCE_MS = 500
const RECOVERY_VERSION = 1

interface CanvasIdentity {
  userId: string
  projectId: string
  canvasId: string
}

type PersistedGraph = CanvasRecoveryDocument

interface AutosaveBatch {
  baseDocument: PersistedGraph
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
  onRecovery: (nodes: CanvasNode[], connections: CanvasConnection[]) => void
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
    node_upserts: nodes.map(toCanvasDocumentNodeUpsert).sort((left, right) => left.id.localeCompare(right.id)),
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

function applyGraphPatch(base: PersistedGraph, payload: CanvasDocumentPatchPayload): PersistedGraph {
  const nodes = new Map(base.node_upserts.map((item) => [item.id, item]))
  const connections = new Map(base.connection_upserts.map((item) => [item.id, item]))
  for (const id of payload.connection_deletes) connections.delete(id)
  for (const id of payload.node_deletes) nodes.delete(id)
  for (const item of payload.node_upserts) nodes.set(item.id, item)
  for (const item of payload.connection_upserts) connections.set(item.id, item)
  return {
    node_upserts: [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id)),
    connection_upserts: [...connections.values()].sort(
      (left, right) => left.id.localeCompare(right.id),
    ),
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
  let activeBatch: AutosaveBatch | null = null
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

  function writeRecovery(batch = retryBatch ?? activeBatch) {
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
        baseDocument: batch?.baseDocument ?? null,
        batchDocument: batch?.document ?? null,
        document: currentGraph(),
        payload: batch?.payload ?? null,
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

  function discardRecovery() {
    retryBatch = null
    clearRecovery()
    emit({
      state: 'saved', message: '', conflictRevision: null, hasRecovery: false, canRetry: false,
    })
  }

  function initialize(nextRevision: number) {
    if (timer) clearTimeout(timer)
    timer = null
    activeBatch = null
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
    activeBatch = null
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
      baseDocument: confirmed,
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
    activeBatch = batch
    const request = submit(batch)
    inFlight = request
    try {
      await request
    } finally {
      if (inFlight === request) inFlight = null
      if (activeBatch === batch) activeBatch = null
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

  function adoptCommittedRevision(nextRevision: number, applyCommittedGraph: () => void) {
    if (!Number.isSafeInteger(nextRevision) || nextRevision < revision) {
      throw new Error('服务器画布 revision 无效。')
    }
    if (
      inFlight || activeBatch || retryBatch || hasLoadedRecovery ||
      status.state !== 'saved' || hasMutations(diffGraph(confirmed, currentGraph()))
    ) throw new Error('采用服务器画布变更前必须先完成本地保存。')
    if (timer) clearTimeout(timer)
    timer = null
    applyCommittedGraph()
    confirmed = currentGraph()
    revision = nextRevision
    options.onRevision(revision)
    clearRecovery()
    emit({
      state: 'saved', message: '', conflictRevision: null, hasRecovery: false, canRetry: false,
    })
  }

  async function retry() {
    if (status.state === 'conflict') throw new Error(status.message)
    return flush()
  }

  function failRecovery(cause: unknown): never {
    const error = cause instanceof Error ? cause : new Error('本地恢复副本无效。')
    emit({ state: 'error', message: error.message, hasRecovery: true, canRetry: false })
    throw error
  }

  async function restoreRecovery() {
    const identity = options.getIdentity()
    if (!identity) throw new Error('Canvas recovery identity is unavailable')
    const raw = readRecovery(identity)
    if (!raw) throw new Error('未找到此画布的本地恢复副本。')
    let snapshot
    try {
      snapshot = parseCanvasRecoverySnapshot(raw, identity)
    } catch (error) {
      failRecovery(error)
    }
    const desiredDocument = snapshot.desiredDocument
    const batchDocument = snapshot.batchDocument ?? (
      snapshot.payload ? applyGraphPatch(confirmed, snapshot.payload) : null
    )
    const mutations = diffGraph(confirmed, desiredDocument)
    const batchMutations = batchDocument
      ? diffGraph(confirmed, batchDocument)
      : null
    if (
      snapshot.payload && revision === snapshot.baseRevision && (
        !batchMutations ||
        !sameEntity(snapshot.payload.node_upserts, batchMutations.node_upserts) ||
        !sameEntity(snapshot.payload.node_deletes, batchMutations.node_deletes) ||
        !sameEntity(snapshot.payload.connection_upserts, batchMutations.connection_upserts) ||
        !sameEntity(snapshot.payload.connection_deletes, batchMutations.connection_deletes)
      )
    ) failRecovery(new Error('本地恢复副本的保存请求与画布内容不一致。'))
    const recovered = mapCanvasRecoveryGraph(desiredDocument)
    options.onRecovery(recovered.nodes, recovered.connections)
    const payload = snapshot.payload ?? (hasMutations(mutations) ? {
      base_revision: snapshot.baseRevision,
      client_mutation_id: snapshot.clientMutationId ?? entityId(),
      ...mutations,
    } : null)
    if (!payload) {
      clearRecovery()
      emit({ state: 'saved', message: '', conflictRevision: null, canRetry: false })
      return
    }
    retryBatch = {
      baseDocument: snapshot.baseDocument ?? confirmed,
      payload,
      document: batchDocument ?? desiredDocument,
    }
    hasLoadedRecovery = false
    emit({
      state: 'error',
      message: '本地副本已恢复，正在重试保存。',
      conflictRevision: null,
      hasRecovery: true,
      canRetry: true,
    })
    return flush()
  }

  return {
    discardRecovery,
    adoptCommittedRevision,
    flush,
    initialize,
    preserveRecovery: writeRecovery,
    queue,
    reset,
    restoreRecovery,
    retry,
  }
}
