import type { CanvasNode } from '../../types/canvas'
import type { InsertGraphCommand } from './canvas-commands'
import {
  IMAGE_OPERATIONS,
  createDefaultImageOperationContract,
  type ImageOperationCapabilities,
  type ImageOperationId,
  type ProviderImageOperationId,
} from './image-operations'
import { canBranchFromImageResult, createResultGenerationBranchCommand } from './resource-commands'
import { createSelectionGenerationCommand } from './selection-generation'

export interface ImageOperationBranchOptions {
  aspectRatio?: string
  capabilities: ImageOperationCapabilities
  existingNodes?: readonly CanvasNode[]
  operationId: ImageOperationId
  selectedNodes: readonly CanvasNode[]
}

function isAvailable(operationId: ImageOperationId, capabilities: ImageOperationCapabilities) {
  const operation = IMAGE_OPERATIONS[operationId]
  return capabilities.supported_operations.includes(operationId) && (
    operation.execution === 'local' ||
    capabilities.provider_operations.includes(operationId as ProviderImageOperationId)
  )
}

function exactImageResults(nodes: readonly CanvasNode[]) {
  return nodes.length > 0 && new Set(nodes.map((node) => node.id)).size === nodes.length &&
    nodes.every((node) => canBranchFromImageResult(node))
}

export function createImageOperationBranchCommand(
  options: ImageOperationBranchOptions,
): InsertGraphCommand | null {
  const operation = IMAGE_OPERATIONS[options.operationId]
  if (!operation || !isAvailable(options.operationId, options.capabilities) || !exactImageResults(options.selectedNodes)) return null
  const maxSources = operation.id === 'fusion'
    ? Math.min(operation.sourceCount[1], options.capabilities.max_fusion_images)
    : operation.sourceCount[1]
  if (options.selectedNodes.length < operation.sourceCount[0] || options.selectedNodes.length > maxSources) return null

  const existingNodes = options.existingNodes ?? options.selectedNodes
  const command = operation.id === 'fusion'
    ? createSelectionGenerationCommand(options.selectedNodes, 'image', undefined, existingNodes)
    : createResultGenerationBranchCommand(options.selectedNodes[0], 'image', existingNodes)
  if (!command || command.nodes.length !== 1) return null

  let contract
  try {
    contract = createDefaultImageOperationContract(options.operationId, options.capabilities)
  } catch {
    return null
  }
  const generationNode = command.nodes[0]
  generationNode.title = operation.title
  generationNode.content = undefined
  generationNode.contentData = {
    ...generationNode.contentData,
    generation_parameters: {
      schema_version: 1,
      image: {
        aspect_ratio: options.aspectRatio ?? '4:3',
        operation: contract,
      },
    },
  }
  return command
}
