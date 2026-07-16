import type { CanvasNode } from '../../types/canvas'
import { isNodeGroupContainer, isNodeMutationSupported } from './node-registry'

export function resolveCanvasDragNodeIds(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
): string[] | null {
  const requestedIds = [...new Set(nodeIds.filter(Boolean))]
  if (!requestedIds.length) return null
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  if (requestedIds.some((nodeId) => !nodesById.has(nodeId))) return null
  const requestedSet = new Set(requestedIds)
  const rootIds: string[] = []

  for (const nodeId of requestedIds) {
    const node = nodesById.get(nodeId)!
    let parentId = node.parentNodeId
    let isCoveredByRequestedAncestor = false
    const ancestors = new Set([nodeId])
    while (parentId) {
      if (ancestors.has(parentId)) return null
      ancestors.add(parentId)
      const parent = nodesById.get(parentId)
      if (!parent) return null
      if (requestedSet.has(parentId)) {
        isCoveredByRequestedAncestor = true
        break
      }
      parentId = parent.parentNodeId
    }
    if (isCoveredByRequestedAncestor) continue
    if (node.parentNodeId) return null
    rootIds.push(nodeId)
  }

  const childrenByParentId = new Map<string, string[]>()
  for (const node of nodes) {
    if (!node.parentNodeId) continue
    const children = childrenByParentId.get(node.parentNodeId) ?? []
    children.push(node.id)
    childrenByParentId.set(node.parentNodeId, children)
  }
  const resolvedIds: string[] = []
  const resolvedSet = new Set<string>()
  const visiting = new Set<string>()
  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return false
    if (resolvedSet.has(nodeId)) return true
    const node = nodesById.get(nodeId)
    if (!node || node.isLocked || !isNodeMutationSupported(node)) return false
    const children = childrenByParentId.get(nodeId) ?? []
    if (children.length && !isNodeGroupContainer(node)) return false
    visiting.add(nodeId)
    resolvedIds.push(nodeId)
    resolvedSet.add(nodeId)
    for (const childId of children) {
      if (!visit(childId)) return false
    }
    visiting.delete(nodeId)
    return true
  }
  if (rootIds.some((nodeId) => !visit(nodeId))) return null
  return requestedIds.every((nodeId) => resolvedSet.has(nodeId)) ? resolvedIds : null
}
