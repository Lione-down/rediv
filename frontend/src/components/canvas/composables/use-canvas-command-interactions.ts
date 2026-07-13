import { useCanvasStore } from '../../../store/canvas'
import {
  createConnectNodesCommand,
  createDeleteSelectionCommand,
  createDuplicateNodesCommand,
  createGroupNodesCommand,
  createUngroupNodesCommand,
  type CanvasCommandSource,
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
    if (canvasStore.selectedNodes.some((node) => node.type === 'group' || node.parentNodeId)) return false
    const command = createDuplicateNodesCommand(canvasStore.selectedNodeIds)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function deleteSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    const command = createDeleteSelectionCommand(
      canvasStore.selectedNodeIds,
      canvasStore.selectedConnectionId ? [canvasStore.selectedConnectionId] : [],
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
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

  function handleCommandKeyDown(event: KeyboardEvent) {
    if (event.repeat || options.isReadOnly() || isCanvasEditableTarget(event.target)) return false
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      if (!duplicateSelection('keyboard')) return false
      event.preventDefault()
      return true
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g') {
      const handled = event.shiftKey ? ungroupSelection('keyboard') : groupSelection('keyboard')
      if (!handled) return false
      event.preventDefault()
      return true
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if (!connectSelection('keyboard')) return false
      event.preventDefault()
      return true
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return false
    if (!deleteSelection('keyboard')) return false
    event.preventDefault()
    return true
  }

  return {
    canConnectSelection: () => canvasStore.selectedNodes.length === 2 && Boolean(createConnectNodesCommand(
      canvasStore.nodes, canvasStore.connections, canvasStore.selectedNodes[0].id, canvasStore.selectedNodes[1].id,
    )),
    canGroupSelection: () => Boolean(createGroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)),
    canDuplicateSelection: () => (
      canvasStore.selectedNodes.length > 0 &&
      canvasStore.selectedNodes.every((node) => node.type !== 'group' && !node.parentNodeId)
    ),
    canUngroupSelection: () => Boolean(createUngroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)),
    connectNodes,
    connectSelection,
    deleteSelection,
    duplicateSelection,
    groupSelection,
    handleCommandKeyDown,
    ungroupSelection,
  }
}
