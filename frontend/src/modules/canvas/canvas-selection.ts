export interface CanvasSelectionState {
  nodeIds: string[]
  primaryNodeId: string
  connectionId: string
}

export type CanvasSelectionAction =
  | { type: 'set-nodes'; nodeIds: readonly string[]; primaryNodeId?: string }
  | { type: 'add-node'; nodeId: string }
  | { type: 'toggle-node'; nodeId: string }
  | { type: 'select-connection'; connectionId: string }
  | { type: 'clear' }

interface CanvasSelectionDomain {
  nodeIds: readonly string[]
  connectionIds: readonly string[]
}

function sameIds(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

export function normalizeCanvasSelection(
  domain: CanvasSelectionDomain,
  nodeIds: readonly string[],
  primaryNodeId = '',
): CanvasSelectionState {
  const availableIds = new Set(domain.nodeIds)
  const seenIds = new Set<string>()
  const normalizedIds = nodeIds.filter((nodeId) => {
    if (!availableIds.has(nodeId) || seenIds.has(nodeId)) return false
    seenIds.add(nodeId)
    return true
  })
  return {
    nodeIds: normalizedIds,
    primaryNodeId: normalizedIds.includes(primaryNodeId)
      ? primaryNodeId
      : (normalizedIds[normalizedIds.length - 1] ?? ''),
    connectionId: '',
  }
}

export function reduceCanvasSelection(
  domain: CanvasSelectionDomain,
  state: CanvasSelectionState,
  action: CanvasSelectionAction,
): CanvasSelectionState {
  if (action.type === 'clear') return { nodeIds: [], primaryNodeId: '', connectionId: '' }
  if (action.type === 'select-connection') {
    const connectionId = domain.connectionIds.includes(action.connectionId) ? action.connectionId : ''
    return { nodeIds: [], primaryNodeId: '', connectionId }
  }
  if (action.type === 'set-nodes') {
    return normalizeCanvasSelection(domain, action.nodeIds, action.primaryNodeId)
  }
  if (!domain.nodeIds.includes(action.nodeId)) {
    return action.type === 'toggle-node'
      ? normalizeCanvasSelection(domain, state.nodeIds, state.primaryNodeId)
      : state
  }
  if (action.type === 'add-node') {
    return normalizeCanvasSelection(domain, [...state.nodeIds, action.nodeId], action.nodeId)
  }
  const isSelected = state.nodeIds.includes(action.nodeId)
  return normalizeCanvasSelection(
    domain,
    isSelected ? state.nodeIds.filter((nodeId) => nodeId !== action.nodeId) : [...state.nodeIds, action.nodeId],
    isSelected ? (state.primaryNodeId === action.nodeId ? '' : state.primaryNodeId) : action.nodeId,
  )
}

export function isSameCanvasSelection(left: CanvasSelectionState, right: CanvasSelectionState) {
  return left.primaryNodeId === right.primaryNodeId &&
    left.connectionId === right.connectionId &&
    sameIds(left.nodeIds, right.nodeIds)
}
