import type { Ref } from 'vue'
import { createReorderGenerationInputCommand } from '../../../modules/canvas/canvas-commands'
import {
  createResultGenerationBranchCommand,
  type ResultBranchMediaType,
} from '../../../modules/canvas/resource-commands'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'

export function useCanvasNodeActions(options: {
  isReviewOnly: Readonly<Ref<boolean>>
  revealNode?: (nodeId: string) => void
  selectedNode: Readonly<Ref<CanvasNode | null>>
}) {
  const canvasStore = useCanvasStore()

  function reorderGenerationInput(connectionId: string, direction: -1 | 1) {
    const command = createReorderGenerationInputCommand(
      canvasStore.nodes, canvasStore.connections, connectionId, direction,
    )
    if (command) void canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  }

  async function branchFromResult(mediaType: ResultBranchMediaType) {
    const sourceNode = options.selectedNode.value
    if (!sourceNode || options.isReviewOnly.value) return
    const command = createResultGenerationBranchCommand(sourceNode, mediaType, canvasStore.nodes)
    if (!command) return
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    canvasStore.selectNode(command.nodes[0].id)
    options.revealNode?.(command.nodes[0].id)
  }

  return { branchFromResult, reorderGenerationInput }
}
