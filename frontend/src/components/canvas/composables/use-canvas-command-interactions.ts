import { useCanvasStore } from '../../../store/canvas'
import {
  createAlignNodesCommand,
  createAutoArrangeNodesCommand,
  createConnectNodesCommand,
  createDeleteSelectionCommand,
  createDistributeNodesCommand,
  createDuplicateNodesCommand,
  createGroupNodesCommand,
  createSetNodesLockedCommand,
  createUngroupNodesCommand,
  isArrangeEligibleNode,
  type CanvasAlignment,
  type CanvasCommandSource,
  type CanvasDistribution,
} from '../../../modules/canvas/canvas-commands'

interface CanvasCommandInteractionOptions {
  isReadOnly: () => boolean
}

export function isCanvasEditableTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

export function useCanvasCommandInteractions(options: CanvasCommandInteractionOptions) {
  const canvasStore = useCanvasStore()

  function duplicateSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    if (canvasStore.selectedNodes.some((node) => !isArrangeEligibleNode(node))) return false
    const command = createDuplicateNodesCommand(canvasStore.selectedNodeIds)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function deleteSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    if (canvasStore.selectedNodes.some((node) => node.isLocked)) return false
    const command = createDeleteSelectionCommand(
      canvasStore.selectedNodeIds,
      canvasStore.selectedConnectionId ? [canvasStore.selectedConnectionId] : [],
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function canDeleteNode(nodeId: string) {
    const node = canvasStore.findNodeById(nodeId)
    return Boolean(node && !node.isLocked && (
      node.type !== 'group' || !canvasStore.nodes.some((child) => child.parentNodeId === node.id && child.isLocked)
    ))
  }

  function groupSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    const command = createGroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function ungroupSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    const command = createUngroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function connectNodes(source: CanvasCommandSource, sourceNodeId: string, targetNodeId: string) {
    if (options.isReadOnly()) return false
    const command = createConnectNodesCommand(
      canvasStore.nodes, canvasStore.connections, sourceNodeId, targetNodeId,
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function connectSelection(source: CanvasCommandSource) {
    if (canvasStore.selectedNodes.length !== 2) return false
    return connectNodes(source, canvasStore.selectedNodes[0].id, canvasStore.selectedNodes[1].id)
  }

  function alignSelection(source: CanvasCommandSource, alignment: CanvasAlignment) {
    if (options.isReadOnly()) return false
    const command = createAlignNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds, alignment)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function distributeSelection(source: CanvasCommandSource, distribution: CanvasDistribution) {
    if (options.isReadOnly()) return false
    const command = createDistributeNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds, distribution)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function autoArrange(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    const selectedIds = canvasStore.selectedNodes.filter(isArrangeEligibleNode).map((node) => node.id)
    const nodeIds = selectedIds.length >= 2
      ? selectedIds
      : canvasStore.nodes.filter(isArrangeEligibleNode).map((node) => node.id)
    const command = createAutoArrangeNodesCommand(canvasStore.nodes, canvasStore.connections, nodeIds)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function toggleLockSelection(source: CanvasCommandSource) {
    if (options.isReadOnly() || !canvasStore.selectedNodes.length) return false
    const locked = !canvasStore.selectedNodes.some((node) => node.isLocked)
    const command = createSetNodesLockedCommand(canvasStore.nodes, canvasStore.selectedNodeIds, locked)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function handleCommandKeyDown(event: KeyboardEvent) {
    if (event.repeat || isCanvasEditableTarget(event.target)) return false
    const isReadOnly = options.isReadOnly()
    if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault()
      if (!isReadOnly) autoArrange('keyboard')
      return true
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault()
      if (!isReadOnly) duplicateSelection('keyboard')
      return true
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g') {
      event.preventDefault()
      if (!isReadOnly) {
        if (event.shiftKey) ungroupSelection('keyboard')
        else groupSelection('keyboard')
      }
      return true
    }
    if ((event.ctrlKey || event.metaKey) && (event.key === 'Enter' || event.key.toLowerCase() === 'l')) {
      event.preventDefault()
      if (!isReadOnly) connectSelection('keyboard')
      return true
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return false
    event.preventDefault()
    if (!isReadOnly) deleteSelection('keyboard')
    return true
  }

  return {
    canAlignSelection: () => canvasStore.selectedNodes.length >= 2 && canvasStore.selectedNodes.every(isArrangeEligibleNode),
    canAutoArrange: () => canvasStore.nodes.filter(isArrangeEligibleNode).length >= 2,
    canConnectSelection: () => canvasStore.selectedNodes.length === 2 && Boolean(createConnectNodesCommand(
      canvasStore.nodes, canvasStore.connections, canvasStore.selectedNodes[0].id, canvasStore.selectedNodes[1].id,
    )),
    canGroupSelection: () => Boolean(createGroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)),
    canDuplicateSelection: () => (
      canvasStore.selectedNodes.length > 0 &&
      canvasStore.selectedNodes.every(isArrangeEligibleNode)
    ),
    canDeleteSelection: () => Boolean(canvasStore.selectedConnectionId) || (
      canvasStore.selectedNodeIds.length > 0 && canvasStore.selectedNodeIds.every(canDeleteNode)
    ),
    canDistributeSelection: () => canvasStore.selectedNodes.length >= 3 && canvasStore.selectedNodes.every(isArrangeEligibleNode),
    canToggleLockSelection: () => canvasStore.selectedNodes.length > 0,
    canUngroupSelection: () => Boolean(createUngroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)),
    hasLockedSelection: () => canvasStore.selectedNodes.some((node) => node.isLocked),
    alignSelection,
    autoArrange,
    connectNodes,
    connectSelection,
    deleteSelection,
    duplicateSelection,
    distributeSelection,
    groupSelection,
    handleCommandKeyDown,
    toggleLockSelection,
    ungroupSelection,
  }
}
