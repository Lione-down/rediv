import type {
  CanvasDocumentConnectionUpsert,
  CanvasDocumentNodeUpsert,
  CanvasDocumentPatchPayload,
  CanvasRecoveryDocument,
} from './types'

export interface CanvasRecoveryIdentity {
  projectId: string
  canvasId: string
}

export interface CanvasRecoverySnapshot {
  version: 1
  projectId: string
  canvasId: string
  baseRevision: number
  clientMutationId: string | null
  baseDocument: CanvasRecoveryDocument | null
  batchDocument: CanvasRecoveryDocument | null
  desiredDocument: CanvasRecoveryDocument
  payload: CanvasDocumentPatchPayload | null
  savedAt: string
}

const MAX_SAFE_JSON_INTEGER = 9_007_199_254_740_991
const MAX_MUTATIONS_PER_BATCH = 1_000
const COORDINATE_LIMIT = 10_000_000
const NODE_ID_LIMIT = 36
const NODE_TYPE_LIMIT = 50
const PORT_LIMIT = 100
const MUTATION_ID_LIMIT = 64
const Z_INDEX_MIN = -2_147_483_648
const Z_INDEX_MAX = 2_147_483_647
const nodeTypes = new Set([
  'text', 'image', 'video', 'model', 'result', 'refine', 'composite', 'group',
])

const nodeKeys = new Set([
  'id', 'node_type', 'content', 'position_x', 'position_y', 'width', 'height',
  'z_index', 'parent_node_id', 'is_locked', 'is_collapsed',
])
const connectionKeys = new Set([
  'id', 'source_node_id', 'source_port', 'target_node_id', 'target_port', 'metadata',
])
const payloadKeys = new Set([
  'base_revision', 'client_mutation_id', 'node_upserts', 'node_deletes',
  'connection_upserts', 'connection_deletes',
])
const documentKeys = new Set(['node_upserts', 'connection_upserts'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, keys: Set<string>) {
  return Object.keys(value).every((key) => keys.has(key))
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
}

function isIntegerBetween(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isSafeInteger(value) && Number(value) >= minimum && Number(value) <= maximum
}

function isFiniteBetween(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
}

function isUnicodeScalarString(value: string) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (next < 0xdc00 || next > 0xdfff) return false
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) return false
  }
  return true
}

function isCanonicalJson(value: unknown): boolean {
  if (value === null || typeof value === 'boolean') return true
  if (typeof value === 'string') return isUnicodeScalarString(value)
  if (typeof value === 'number') {
    return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value))
  }
  if (Array.isArray(value)) return value.every(isCanonicalJson)
  if (!isRecord(value)) return false
  return Object.entries(value).every(([key, item]) => (
    isUnicodeScalarString(key) && isCanonicalJson(item)
  ))
}

function isNodeUpsert(value: unknown): value is CanvasDocumentNodeUpsert {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, nodeKeys) &&
    isBoundedString(value.id, NODE_ID_LIMIT) &&
    isBoundedString(value.node_type, NODE_TYPE_LIMIT) &&
    nodeTypes.has(value.node_type) &&
    isRecord(value.content) && isCanonicalJson(value.content) &&
    isFiniteBetween(value.position_x, -COORDINATE_LIMIT, COORDINATE_LIMIT) &&
    isFiniteBetween(value.position_y, -COORDINATE_LIMIT, COORDINATE_LIMIT) &&
    isIntegerBetween(value.width, 50, 100_000) &&
    isIntegerBetween(value.height, 50, 100_000) &&
    isIntegerBetween(value.z_index, Z_INDEX_MIN, Z_INDEX_MAX) &&
    (value.parent_node_id === null || isBoundedString(value.parent_node_id, NODE_ID_LIMIT)) &&
    typeof value.is_locked === 'boolean' && typeof value.is_collapsed === 'boolean'
  )
}

function isConnectionUpsert(value: unknown): value is CanvasDocumentConnectionUpsert {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, connectionKeys) &&
    isBoundedString(value.id, NODE_ID_LIMIT) &&
    isBoundedString(value.source_node_id, NODE_ID_LIMIT) &&
    isBoundedString(value.source_port, PORT_LIMIT) &&
    isBoundedString(value.target_node_id, NODE_ID_LIMIT) &&
    isBoundedString(value.target_port, PORT_LIMIT) &&
    isRecord(value.metadata) && isCanonicalJson(value.metadata)
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= MAX_MUTATIONS_PER_BATCH &&
    value.every((item) => isBoundedString(item, NODE_ID_LIMIT))
}

function hasUniqueIds(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id)).size === items.length
}

function validateDocumentGraph(document: CanvasRecoveryDocument) {
  if (!hasUniqueIds(document.node_upserts) || !hasUniqueIds(document.connection_upserts)) {
    throw new Error('本地恢复副本包含重复的画布 ID。')
  }
  const nodes = new Map(document.node_upserts.map((node) => [node.id, node]))
  for (const node of document.node_upserts) {
    if (node.parent_node_id === null) continue
    const parent = nodes.get(node.parent_node_id)
    if (
      node.parent_node_id === node.id || node.node_type === 'group' ||
      !parent || parent.node_type !== 'group'
    ) throw new Error('本地恢复副本包含无效的父子关系。')
  }
  const edgeKeys = new Set<string>()
  for (const connection of document.connection_upserts) {
    if (
      connection.source_node_id === connection.target_node_id ||
      !nodes.has(connection.source_node_id) || !nodes.has(connection.target_node_id)
    ) throw new Error('本地恢复副本包含无效的连接端点。')
    const edgeKey = JSON.stringify([
      connection.source_node_id, connection.source_port,
      connection.target_node_id, connection.target_port,
    ])
    if (edgeKeys.has(edgeKey)) throw new Error('本地恢复副本包含重复连接。')
    edgeKeys.add(edgeKey)
  }
}

function parseDocument(value: unknown): CanvasRecoveryDocument {
  if (!isRecord(value) || !hasOnlyKeys(value, documentKeys)) {
    throw new Error('本地恢复副本格式无效。')
  }
  const nodes = value.node_upserts
  const connections = value.connection_upserts
  if (
    !Array.isArray(nodes) || nodes.length > MAX_MUTATIONS_PER_BATCH || !nodes.every(isNodeUpsert) ||
    !Array.isArray(connections) || connections.length > MAX_MUTATIONS_PER_BATCH ||
    !connections.every(isConnectionUpsert)
  ) throw new Error('本地恢复副本包含无效的画布数据。')
  const document = { node_upserts: nodes, connection_upserts: connections }
  validateDocumentGraph(document)
  return document
}

function parsePayload(value: unknown): CanvasDocumentPatchPayload | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value)) throw new Error('本地恢复副本的保存请求无效。')
  if (
    !hasOnlyKeys(value, payloadKeys) ||
    !isIntegerBetween(value.base_revision, 0, MAX_SAFE_JSON_INTEGER) ||
    !isBoundedString(value.client_mutation_id, MUTATION_ID_LIMIT) ||
    !Array.isArray(value.node_upserts) || value.node_upserts.length > MAX_MUTATIONS_PER_BATCH ||
    !value.node_upserts.every(isNodeUpsert) ||
    !isStringArray(value.node_deletes) ||
    !Array.isArray(value.connection_upserts) ||
    value.connection_upserts.length > MAX_MUTATIONS_PER_BATCH ||
    !value.connection_upserts.every(isConnectionUpsert) ||
    !isStringArray(value.connection_deletes)
  ) throw new Error('本地恢复副本的保存请求无效。')
  const payload = value as unknown as CanvasDocumentPatchPayload
  const nodeUpserts = new Set(payload.node_upserts.map((item) => item.id))
  const nodeDeletes = new Set(payload.node_deletes)
  const connectionUpserts = new Set(payload.connection_upserts.map((item) => item.id))
  const connectionDeletes = new Set(payload.connection_deletes)
  if (
    nodeUpserts.size !== payload.node_upserts.length || nodeDeletes.size !== payload.node_deletes.length ||
    connectionUpserts.size !== payload.connection_upserts.length ||
    connectionDeletes.size !== payload.connection_deletes.length ||
    payload.node_deletes.some((id) => nodeUpserts.has(id)) ||
    payload.connection_deletes.some((id) => connectionUpserts.has(id)) ||
    !(
      payload.node_upserts.length || payload.node_deletes.length ||
      payload.connection_upserts.length || payload.connection_deletes.length
    )
  ) throw new Error('本地恢复副本的保存请求包含重复、冲突或空 mutation。')
  return payload
}

function sameJson(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
      left.every((item, index) => sameJson(item, right[index]))
  }
  if (!isRecord(left) || !isRecord(right)) return false
  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => (
    key === rightKeys[index] && sameJson(left[key], right[key])
  ))
}

function validatePayloadTransition(
  payload: CanvasDocumentPatchPayload,
  baseDocument: CanvasRecoveryDocument,
  batchDocument: CanvasRecoveryDocument,
) {
  const baseNodes = new Map(baseDocument.node_upserts.map((item) => [item.id, item]))
  const batchNodes = new Map(batchDocument.node_upserts.map((item) => [item.id, item]))
  const baseConnections = new Map(baseDocument.connection_upserts.map((item) => [item.id, item]))
  const batchConnections = new Map(batchDocument.connection_upserts.map((item) => [item.id, item]))
  const expected = {
    node_upserts: batchDocument.node_upserts.filter((item) => !sameJson(baseNodes.get(item.id), item)),
    node_deletes: [...baseNodes.keys()].filter((id) => !batchNodes.has(id)),
    connection_upserts: batchDocument.connection_upserts.filter(
      (item) => !sameJson(baseConnections.get(item.id), item),
    ),
    connection_deletes: [...baseConnections.keys()].filter((id) => !batchConnections.has(id)),
  }
  if (
    !sameJson(payload.node_upserts, expected.node_upserts) ||
    !sameJson(payload.node_deletes, expected.node_deletes) ||
    !sameJson(payload.connection_upserts, expected.connection_upserts) ||
    !sameJson(payload.connection_deletes, expected.connection_deletes)
  ) throw new Error('本地恢复副本的保存请求与 batch state transition 不一致。')
}

export function parseCanvasRecoverySnapshot(
  raw: string,
  identity: CanvasRecoveryIdentity,
): CanvasRecoverySnapshot {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('本地恢复副本不是有效的 JSON。')
  }
  if (!isRecord(value) || value.version !== 1) throw new Error('本地恢复副本版本不受支持。')
  if (value.projectId !== identity.projectId || value.canvasId !== identity.canvasId) {
    throw new Error('本地恢复副本与当前画布不匹配。')
  }
  if (!isIntegerBetween(value.baseRevision, 0, MAX_SAFE_JSON_INTEGER)) {
    throw new Error('本地恢复副本的 revision 无效。')
  }
  if (value.clientMutationId !== null && !isBoundedString(value.clientMutationId, MUTATION_ID_LIMIT)) {
    throw new Error('本地恢复副本的 mutation ID 无效。')
  }
  const desiredDocument = parseDocument(value.document)
  const baseDocument = value.baseDocument === null || value.baseDocument === undefined
    ? null
    : parseDocument(value.baseDocument)
  const batchDocument = value.batchDocument === null || value.batchDocument === undefined
    ? null
    : parseDocument(value.batchDocument)
  const payload = parsePayload(value.payload)
  if (
    payload && (
      payload.base_revision !== Number(value.baseRevision) ||
      payload.client_mutation_id !== value.clientMutationId
    )
  ) {
    throw new Error('本地恢复副本的保存请求与 revision 或 mutation ID 不一致。')
  }
  if (payload && Boolean(baseDocument) !== Boolean(batchDocument)) {
    throw new Error('本地恢复副本的 batch base-state 与 post-state 不完整。')
  }
  if (!payload && (baseDocument || batchDocument)) {
    throw new Error('本地恢复副本包含无对应保存请求的 batch state。')
  }
  if (payload && baseDocument && batchDocument) {
    validatePayloadTransition(payload, baseDocument, batchDocument)
  }
  return {
    version: 1,
    projectId: identity.projectId,
    canvasId: identity.canvasId,
    baseRevision: Number(value.baseRevision),
    clientMutationId: value.clientMutationId as string | null,
    baseDocument,
    batchDocument,
    desiredDocument,
    payload,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : '',
  }
}
