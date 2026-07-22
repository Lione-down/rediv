import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import type { GenerationNodeParameters, ImageBatchSnapshot } from './generation-parameters'
import { findFirstUnoccupiedPosition } from './graph-placement'

export interface ImageGenerationBatchSlot {
  nodeId: string
  batch: ImageBatchSnapshot
  parameters: GenerationNodeParameters
}

export interface ImageGenerationBatchPlan {
  batchId: string
  slots: ImageGenerationBatchSlot[]
  command: InsertGraphCommand
}

function imageParameters(node: CanvasNode) {
  const parameters = node.contentData?.generation_parameters
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
    throw new Error('图片 batch 需要已解析的节点生成参数。')
  }
  const image = (parameters as Record<string, unknown>).image
  if (!image || typeof image !== 'object' || Array.isArray(image)) {
    throw new Error('图片 batch 参数无效。')
  }
  return structuredClone(parameters) as GenerationNodeParameters & { image: Record<string, unknown> }
}

function slotParameters(
  base: GenerationNodeParameters & { image: Record<string, unknown> },
  batch: ImageBatchSnapshot,
): GenerationNodeParameters {
  return {
    ...base,
    image: { ...base.image, output_count: batch.slot_count, batch },
  } as GenerationNodeParameters
}

function siblingNode(sourceNode: CanvasNode, nodeId: string, parameters: GenerationNodeParameters, x: number, y: number) {
  const contentData = structuredClone(sourceNode.contentData ?? {})
  contentData.generation_parameters = parameters
  for (const key of ['generation_status', 'generation_task_id', 'result_materialized_task_id']) {
    Reflect.deleteProperty(contentData, key)
  }
  return {
    ...structuredClone(sourceNode),
    id: nodeId,
    x,
    y,
    status: 'idle' as const,
    contentData,
  }
}

export function createImageGenerationBatchPlan(input: {
  sourceNode: CanvasNode
  existingNodes: readonly CanvasNode[]
  connections: readonly CanvasConnection[]
  slotCount: number
  batchId?: string
  createId?: () => string
}): ImageGenerationBatchPlan {
  if (!Number.isInteger(input.slotCount) || input.slotCount < 1 || input.slotCount > 4) {
    throw new Error('图片 batch 数量必须为 1–4。')
  }
  const createId = input.createId ?? createCanvasEntityId
  const batchId = input.batchId ?? crypto.randomUUID()
  const baseParameters = imageParameters(input.sourceNode)
  const incoming = input.connections.filter((connection) => connection.to === input.sourceNode.id)
  const occupied = [...input.existingNodes]
  const slots: ImageGenerationBatchSlot[] = []
  const nodes: CanvasNode[] = []
  const connections: CanvasConnection[] = []
  for (let slotIndex = 1; slotIndex <= input.slotCount; slotIndex += 1) {
    const batch = { batch_id: batchId, slot_index: slotIndex, slot_count: input.slotCount }
    const parameters = slotParameters(baseParameters, batch)
    if (slotIndex === 1) {
      slots.push({ nodeId: input.sourceNode.id, batch, parameters })
      continue
    }
    const nodeId = createId()
    const position = findFirstUnoccupiedPosition(
      { x: input.sourceNode.x, y: input.sourceNode.y + input.sourceNode.height + 24 },
      input.sourceNode,
      occupied,
    )
    const node = siblingNode(input.sourceNode, nodeId, parameters, position.x, position.y)
    nodes.push(node)
    occupied.push(node)
    slots.push({ nodeId, batch, parameters })
    for (const edge of incoming) {
      connections.push({
        ...structuredClone(edge),
        id: createId(),
        to: nodeId,
      })
    }
  }
  return { batchId, slots, command: { type: 'insert-graph', nodes, connections } }
}
