import { toRaw } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { CanvasCommandEnvelope } from './canvas-commands'

export const CANVAS_HISTORY_LIMIT = 100

export interface CanvasCommandHistoryState {
  canUndo: boolean
  canRedo: boolean
  undoCount: number
  redoCount: number
}

interface CanvasCommandHistoryOptions {
  getNodes: () => readonly CanvasNode[]
  getConnections: () => readonly CanvasConnection[]
  executeCommand: (envelope: CanvasCommandEnvelope) => Promise<void> | void
  applyGraph: (nodes: CanvasNode[], connections: CanvasConnection[]) => Promise<void> | void
  onState?: (state: CanvasCommandHistoryState) => void
  limit?: number
}

interface GraphSnapshot {
  nodes: CanvasNode[]
  connections: CanvasConnection[]
}

interface EntityChange<T extends { id: string }> {
  id: string
  before: T | null
  after: T | null
}

interface HistoryEntry {
  command: CanvasCommandEnvelope
  nodeChanges: EntityChange<CanvasNode>[]
  connectionChanges: EntityChange<CanvasConnection>[]
  beforeNodeOrder: string[]
  afterNodeOrder: string[]
  beforeConnectionOrder: string[]
  afterConnectionOrder: string[]
}

interface HistoryStack {
  undo: HistoryEntry[]
  redo: HistoryEntry[]
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(toRaw(value as object))) as T
}

function captureGraph(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): GraphSnapshot {
  return {
    nodes: nodes.map(cloneValue),
    connections: connections.map(cloneValue),
  }
}

function captureCommandStart(
  envelope: CanvasCommandEnvelope,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
) {
  const snapshot = captureGraph(nodes, connections)
  if (envelope.command.type !== 'move-nodes') return snapshot
  const origins = new Map(envelope.command.moves.map((move) => [move.nodeId, move.from]))
  snapshot.nodes = snapshot.nodes.map((node) => {
    const origin = origins.get(node.id)
    return origin ? { ...node, x: origin.x, y: origin.y } : node
  })
  return snapshot
}

function sameEntity(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function diffEntities<T extends { id: string }>(before: readonly T[], after: readonly T[]) {
  const beforeById = new Map(before.map((entity) => [entity.id, entity]))
  const afterById = new Map(after.map((entity) => [entity.id, entity]))
  const ids = [...new Set([...beforeById.keys(), ...afterById.keys()])]
  return ids.flatMap((id): EntityChange<T>[] => {
    const beforeEntity = beforeById.get(id) ?? null
    const afterEntity = afterById.get(id) ?? null
    if (sameEntity(beforeEntity, afterEntity)) return []
    return [{
      id,
      before: beforeEntity ? cloneValue(beforeEntity) : null,
      after: afterEntity ? cloneValue(afterEntity) : null,
    }]
  })
}

function createEntry(
  envelope: CanvasCommandEnvelope,
  before: GraphSnapshot,
  after: GraphSnapshot,
): HistoryEntry | null {
  const nodeChanges = diffEntities(before.nodes, after.nodes)
  const connectionChanges = diffEntities(before.connections, after.connections)
  if (!nodeChanges.length && !connectionChanges.length) return null
  return {
    command: cloneValue(envelope),
    nodeChanges,
    connectionChanges,
    beforeNodeOrder: before.nodes.map((node) => node.id),
    afterNodeOrder: after.nodes.map((node) => node.id),
    beforeConnectionOrder: before.connections.map((connection) => connection.id),
    afterConnectionOrder: after.connections.map((connection) => connection.id),
  }
}

function applyEntityChanges<T extends { id: string }>(
  current: readonly T[],
  changes: readonly EntityChange<T>[],
  direction: 'undo' | 'redo',
  targetOrder: readonly string[],
) {
  const entities = new Map(current.map((entity) => [entity.id, cloneValue(entity)]))
  for (const change of changes) {
    const target = direction === 'undo' ? change.before : change.after
    if (target) entities.set(change.id, cloneValue(target))
    else entities.delete(change.id)
  }
  const ordered = targetOrder.flatMap((id) => {
    const entity = entities.get(id)
    if (!entity) return []
    entities.delete(id)
    return [entity]
  })
  return [...ordered, ...entities.values()]
}

export function createCanvasCommandHistory(options: CanvasCommandHistoryOptions) {
  const limit = Math.max(1, Math.floor(options.limit ?? CANVAS_HISTORY_LIMIT))
  const stacks = new Map<string, HistoryStack>()
  let activeScope = ''
  let transition = Promise.resolve()

  function activeStack() {
    if (!activeScope) return null
    let stack = stacks.get(activeScope)
    if (!stack) {
      stack = { undo: [], redo: [] }
      stacks.set(activeScope, stack)
    }
    return stack
  }

  function getState(): CanvasCommandHistoryState {
    const stack = activeStack()
    const undoCount = stack?.undo.length ?? 0
    const redoCount = stack?.redo.length ?? 0
    return { canUndo: undoCount > 0, canRedo: redoCount > 0, undoCount, redoCount }
  }

  function notify() {
    options.onState?.(getState())
  }

  function schedule<T>(operation: () => Promise<T> | T) {
    const result = transition.then(operation, operation)
    transition = result.then(() => undefined, () => undefined)
    return result
  }

  function activate(scope: string, activateOptions: { reset?: boolean } = {}) {
    activeScope = scope
    if (activateOptions.reset) stacks.delete(scope)
    activeStack()
    notify()
  }

  function deactivate() {
    activeScope = ''
    notify()
  }

  function clearAll() {
    stacks.clear()
    notify()
  }

  function execute(envelope: CanvasCommandEnvelope) {
    return schedule(async () => {
      const scope = activeScope
      let before: GraphSnapshot | null = null
      if (scope) {
        try {
          before = captureCommandStart(envelope, options.getNodes(), options.getConnections())
        } catch {
          // A history snapshot must never block the typed command itself.
        }
      }
      await options.executeCommand(envelope)
      if (!scope || scope !== activeScope || !before) return
      const entry = createEntry(
        envelope,
        before,
        captureGraph(options.getNodes(), options.getConnections()),
      )
      if (!entry) return
      const stack = activeStack()
      if (!stack) return
      stack.undo.push(entry)
      if (stack.undo.length > limit) stack.undo.splice(0, stack.undo.length - limit)
      stack.redo = []
      notify()
    })
  }

  function applyEntry(entry: HistoryEntry, direction: 'undo' | 'redo') {
    const nodes = applyEntityChanges(
      options.getNodes(),
      entry.nodeChanges,
      direction,
      direction === 'undo' ? entry.beforeNodeOrder : entry.afterNodeOrder,
    )
    const connections = applyEntityChanges(
      options.getConnections(),
      entry.connectionChanges,
      direction,
      direction === 'undo' ? entry.beforeConnectionOrder : entry.afterConnectionOrder,
    )
    return options.applyGraph(nodes, connections)
  }

  function undo() {
    return schedule(async () => {
      const scope = activeScope
      const stack = activeStack()
      const entry = stack?.undo.at(-1)
      if (!scope || !stack || !entry) return false
      await applyEntry(entry, 'undo')
      if (scope !== activeScope) return false
      stack.undo.pop()
      stack.redo.push(entry)
      notify()
      return true
    })
  }

  function redo() {
    return schedule(async () => {
      const scope = activeScope
      const stack = activeStack()
      const entry = stack?.redo.at(-1)
      if (!scope || !stack || !entry) return false
      await applyEntry(entry, 'redo')
      if (scope !== activeScope) return false
      stack.redo.pop()
      stack.undo.push(entry)
      notify()
      return true
    })
  }

  return { activate, deactivate, clearAll, execute, undo, redo, getState }
}
