import { toRaw } from 'vue'
import type { CanvasNode } from '../../../types/canvas'
import { createImageGenerationBatchPlan } from '../../../modules/canvas/image-generation-batch'
import { useCanvasStore } from '../../../store/canvas'

export function useCanvasImageGenerationBatch() {
  const canvasStore = useCanvasStore()

  async function prepare(sourceNode: CanvasNode, slotCount: number) {
    const sourceSnapshot = structuredClone(toRaw(sourceNode))
    const plan = createImageGenerationBatchPlan({
      sourceNode: sourceSnapshot,
      existingNodes: canvasStore.nodes.map((node) => structuredClone(toRaw(node))),
      connections: canvasStore.connections.map((connection) => structuredClone(toRaw(connection))),
      slotCount,
    })
    if (plan.command.nodes.length) {
      await canvasStore.dispatchCommand({ source: 'toolbar', command: plan.command })
    }
    await canvasStore.setNodeGenerationParameters(sourceNode.id, plan.slots[0].parameters)
    await canvasStore.flushPendingPersistence()
    return plan
  }

  return { prepare }
}
