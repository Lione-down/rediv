import { ref } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import { getAuthoringConnectionPorts, isNodeMutationSupported } from '../../../modules/canvas/node-registry'
import {
  canCreateGenerationFromSelection,
  createSelectionGenerationCommand,
  type SelectionGenerationMediaType,
} from '../../../modules/canvas/selection-generation'
import {
  canDeleteCanvasNode,
  createAlignNodesCommand,
  createAutoArrangeNodesCommand,
  createConnectNodesCommand,
  createDeleteSelectionCommand,
  createDistributeNodesCommand,
  createDuplicateNodesCommand,
  createGroupNodesCommand,
  createSetNodesLockedCommand,
  createUngroupNodesCommand,
  isConnectionMutationSupported,
  isArrangeEligibleNode,
  type CanvasAlignment,
  type CanvasCommandSource,
  type CanvasDistribution,
} from '../../../modules/canvas/canvas-commands'

interface CanvasCommandInteractionOptions {
  isReadOnly: () => boolean
}

export function isCanvasEditableTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
  ))
}

export function useCanvasCommandInteractions(options: CanvasCommandInteractionOptions) {
  const canvasStore = useCanvasStore()
  const commandFeedback = ref<{ id: number; message: string } | null>(null)
  let commandFeedbackId = 0

  function announceCommandFeedback(message: string) {
    commandFeedback.value = { id: ++commandFeedbackId, message }
  }

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
    if (canvasStore.selectedNodes.some((node) => node.isLocked || !isNodeMutationSupported(node))) return false
    const selectedConnection = canvasStore.connections.find(
      (connection) => connection.id === canvasStore.selectedConnectionId,
    )
    if (selectedConnection && !isConnectionMutationSupported(canvasStore.nodes, selectedConnection)) return false
    const command = createDeleteSelectionCommand(
      canvasStore.selectedNodeIds,
      canvasStore.selectedConnectionId ? [canvasStore.selectedConnectionId] : [],
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function canDeleteNode(nodeId: string) {
    return canDeleteCanvasNode(canvasStore.nodes, canvasStore.connections, nodeId)
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
    const command = createUngroupNodesCommand(
      canvasStore.nodes, canvasStore.selectedNodeIds, canvasStore.connections,
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function connectNodes(
    source: CanvasCommandSource,
    sourceNodeId: string,
    targetNodeId: string,
    sourcePort?: string,
    targetPort?: string,
  ) {
    if (options.isReadOnly()) return false
    const command = createConnectNodesCommand(
      canvasStore.nodes, canvasStore.connections, sourceNodeId, targetNodeId, sourcePort, targetPort,
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function resolveSelectedConnection() {
    if (canvasStore.selectedNodes.length !== 2) return null
    const selectedIds = new Set(canvasStore.selectedNodeIds)
    const [firstNode, secondNode] = canvasStore.nodes.filter((node) => selectedIds.has(node.id))
    const forwardPorts = getAuthoringConnectionPorts(firstNode, secondNode)
    if (forwardPorts) return { sourceNode: firstNode, targetNode: secondNode, ports: forwardPorts }
    const reversePorts = getAuthoringConnectionPorts(secondNode, firstNode)
    return reversePorts ? { sourceNode: secondNode, targetNode: firstNode, ports: reversePorts } : null
  }

  function connectSelection(source: CanvasCommandSource) {
    if (canvasStore.selectedNodes.length !== 2) {
      announceCommandFeedback('请选择两个可连接的节点后重试。')
      return false
    }
    const resolved = resolveSelectedConnection()
    if (!resolved) {
      announceCommandFeedback('所选节点的端口不兼容，请选择端口兼容的节点。')
      return false
    }
    const { sourceNode, targetNode, ports } = resolved
    if (
      sourceNode.type === 'group' || targetNode.type === 'group' ||
      sourceNode.parentNodeId || targetNode.parentNodeId || sourceNode.isLocked || targetNode.isLocked ||
      !isNodeMutationSupported(sourceNode) || !isNodeMutationSupported(targetNode)
    ) {
      announceCommandFeedback('请选择两个可连接的节点后重试。')
      return false
    }
    const isDuplicate = canvasStore.connections.some((connection) => (
      connection.from === sourceNode.id && connection.to === targetNode.id &&
      (connection.sourcePort ?? 'out') === ports.sourcePort &&
      (connection.targetPort ?? 'in') === ports.targetPort
    ))
    if (isDuplicate) {
      announceCommandFeedback('这两个节点已经连接，请选择其他节点。')
      return false
    }
    commandFeedback.value = null
    return connectNodes(source, sourceNode.id, targetNode.id, ports.sourcePort, ports.targetPort)
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
    if (
      options.isReadOnly() || !canvasStore.selectedNodes.length ||
      canvasStore.selectedNodes.some((node) => !isNodeMutationSupported(node))
    ) return false
    const locked = !canvasStore.selectedNodes.some((node) => node.isLocked)
    const command = createSetNodesLockedCommand(canvasStore.nodes, canvasStore.selectedNodeIds, locked)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  async function composeGenerationSelection(source: CanvasCommandSource, mediaType: SelectionGenerationMediaType) {
    if (options.isReadOnly()) return null
    const command = createSelectionGenerationCommand(
      canvasStore.selectedNodes, mediaType, undefined, canvasStore.nodes,
    )
    if (!command) {
      announceCommandFeedback('请选择至少两个可直接用于生成的文本或图片节点。')
      return null
    }
    commandFeedback.value = null
    try {
      await canvasStore.dispatchCommand({ source, command })
      return command.nodes[0].id
    } catch {
      return null
    }
  }

  function handleCommandKeyDown(event: KeyboardEvent) {
    if (event.repeat || isCanvasEditableTarget(event.target)) return false
    const isReadOnly = options.isReadOnly()
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (!isReadOnly) {
        if (event.shiftKey) void canvasStore.redo().catch(() => undefined)
        else void canvasStore.undo().catch(() => undefined)
      }
      return true
    }
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
    canConnectSelection: () => {
      const resolved = resolveSelectedConnection()
      return Boolean(resolved && createConnectNodesCommand(
        canvasStore.nodes, canvasStore.connections, resolved.sourceNode.id, resolved.targetNode.id,
        resolved.ports.sourcePort, resolved.ports.targetPort,
      ))
    },
    canComposeGenerationSelection: () => canCreateGenerationFromSelection(canvasStore.selectedNodes),
    canGroupSelection: () => Boolean(createGroupNodesCommand(canvasStore.nodes, canvasStore.selectedNodeIds)),
    canDuplicateSelection: () => (
      canvasStore.selectedNodes.length > 0 &&
      canvasStore.selectedNodes.every(isArrangeEligibleNode)
    ),
    canDeleteSelection: () => Boolean(
      canvasStore.selectedConnectionId && canvasStore.connections.some((connection) => (
        connection.id === canvasStore.selectedConnectionId &&
        isConnectionMutationSupported(canvasStore.nodes, connection)
      )),
    ) || (
      canvasStore.selectedNodeIds.length > 0 && canvasStore.selectedNodeIds.every(canDeleteNode)
    ),
    canDistributeSelection: () => canvasStore.selectedNodes.length >= 3 && canvasStore.selectedNodes.every(isArrangeEligibleNode),
    canToggleLockSelection: () => (
      canvasStore.selectedNodes.length > 0 && canvasStore.selectedNodes.every(isNodeMutationSupported)
    ),
    canUngroupSelection: () => Boolean(createUngroupNodesCommand(
      canvasStore.nodes, canvasStore.selectedNodeIds, canvasStore.connections,
    )),
    commandFeedback,
    hasLockedSelection: () => canvasStore.selectedNodes.some((node) => node.isLocked),
    alignSelection,
    autoArrange,
    connectNodes,
    connectSelection,
    composeGenerationSelection,
    deleteSelection,
    duplicateSelection,
    distributeSelection,
    groupSelection,
    handleCommandKeyDown,
    toggleLockSelection,
    ungroupSelection,
  }
}
