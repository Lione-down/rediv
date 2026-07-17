import type { ComputedRef, Ref } from 'vue'
import { createImageOperationBranchCommand } from '../../../modules/canvas/image-operation-commands'
import {
  IMAGE_OPERATIONS,
  resolveImageOperationSources,
  type ImageOperationId,
} from '../../../modules/canvas/image-operations'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import { useCanvasStore } from '../../../store/canvas'
import type { Asset } from '../../../types/asset'

interface CanvasImageOperationsOptions {
  assets: () => readonly Asset[]
  canvasId: ComputedRef<string>
  generationCapabilities: Ref<GenerationCapabilities | null>
  projectId: ComputedRef<string>
  revealNode?: (nodeId: string) => void
  userId: () => string
}

export function useCanvasImageOperations(options: CanvasImageOperationsOptions) {
  const canvasStore = useCanvasStore()

  async function createImageOperation(operationId: string, operationVersion: number) {
    const operation = IMAGE_OPERATIONS[operationId as ImageOperationId]
    const capabilities = options.generationCapabilities.value
    const operationCapabilities = capabilities?.image.operations ?? null
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    if (
      !operation || operation.version !== operationVersion || !capabilities || !operationCapabilities ||
      !canvasStore.hasLoaded || canvasStore.activeProjectId !== projectId || canvasStore.activeCanvasId !== canvasId
    ) throw new Error('当前图片操作 capability 不可用。')
    const sources = resolveImageOperationSources(operation, {
      assets: options.assets(),
      capabilities: operationCapabilities,
      projectId,
      selectedNodes: canvasStore.selectedNodes,
      userId: options.userId(),
    })
    if (!sources) throw new Error('当前选择不支持该图片操作。')
    const command = createImageOperationBranchCommand({
      aspectRatio: capabilities.image.default_aspect_ratio,
      capabilities: operationCapabilities,
      existingNodes: canvasStore.nodes,
      operationId: operation.id,
      selectedNodes: sources.nodes,
    })
    if (!command) throw new Error('图片操作分支创建失败。')
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    const nodeId = command.nodes[0].id
    canvasStore.selectNode(nodeId)
    options.revealNode?.(nodeId)
    return nodeId
  }

  return { createImageOperation }
}
