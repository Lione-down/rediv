import type { ComputedRef, Ref } from 'vue'
import { request } from '../../../api/request'
import { requestCanvasGeneration } from '../../../modules/canvas/generation-service'
import {
  IMAGE_OPERATIONS,
  type ImageOperationContract,
} from '../../../modules/canvas/image-operations'
import {
  resolveGenerationRequestContext,
  type GenerationCapabilities,
  type GenerationNodeParameters,
} from '../../../modules/canvas/generation-parameters'
import { resolveVisualAssetRecipe, type VisualAssetRecipeId } from '../../../modules/canvas/visual-asset-recipes'
import type { ShotControls } from '../../../modules/canvas/shot-controls'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'

interface GenerationRequestContext {
  authToken: string
  canvasId: string
  mediaType: 'image' | 'video'
  nodeId: string
  projectId: string
}

interface CanvasGenerationActionOptions {
  canvasId: ComputedRef<string>
  projectId: ComputedRef<string>
  isReviewOnly: Ref<boolean>
  selectedNode: ComputedRef<CanvasNode | null>
  selectedMediaType: ComputedRef<'image' | 'video' | null>
  generationCapabilities: Ref<GenerationCapabilities | null>
  isGenerating: Ref<boolean>
  generationError: Ref<string>
  generationSuccess: Ref<string>
  foregroundResultNodeId: Ref<string>
  formatError: (error: unknown) => string
  queueResourceReconciliation: () => Promise<number>
  beginRuntimeRequest: (context: GenerationRequestContext) => string
  requestRuntimeRecoveryPolling: () => void
  settleRuntimeRequest: (runtimeRequestId: string) => void
}

interface GenerationExecutionOptions {
  prompt?: string
  imageIds?: string[]
  aspectRatio?: string
  referenceMode?: 'text-to-video' | 'image-to-video' | 'keyframes'
  durationSeconds?: number
  recipeId?: VisualAssetRecipeId
  recipeVersion?: 1 | 2
  imageOperation?: ImageOperationContract
  shotControls?: ShotControls
  parameters?: GenerationNodeParameters | null
}

export function useCanvasGenerationActions(options: CanvasGenerationActionOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()

  function isExactGenerationContext(context: GenerationRequestContext) {
    return authStore.token === context.authToken &&
      canvasStore.activeProjectId === context.projectId &&
      canvasStore.activeCanvasId === context.canvasId
  }

  async function executeGeneration(
    sourceNode: CanvasNode,
    mediaType: 'image' | 'video',
    requestContext: GenerationExecutionOptions,
    promptToPersist?: string,
  ) {
    if (options.isReviewOnly.value || options.isGenerating.value) return
    const context: GenerationRequestContext = {
      authToken: authStore.token,
      projectId: options.projectId.value,
      canvasId: options.canvasId.value,
      nodeId: sourceNode.id,
      mediaType,
    }
    if (authStore.quotas[mediaType] < 1) {
      options.generationError.value = `${mediaType} quota 不足，当前生成已阻止。`
      return
    }
    options.generationError.value = ''
    options.generationSuccess.value = ''
    options.isGenerating.value = true
    let runtimeRequestId = ''
    let shouldPollForRecovery = false
    try {
      if (requestContext.parameters) {
        await canvasStore.setNodeGenerationParameters(sourceNode.id, requestContext.parameters)
      }
      if (promptToPersist !== undefined) await canvasStore.setNodeContent(sourceNode.id, promptToPersist)
      await canvasStore.setNodeGenerationState(sourceNode.id, 'running')
      await canvasStore.flushPendingPersistence()
      runtimeRequestId = options.beginRuntimeRequest(context)
      const response = await requestCanvasGeneration({
        mediaType,
        projectId: context.projectId,
        originCanvasId: context.canvasId,
        canvasNodeId: context.nodeId,
        prompt: requestContext.prompt,
        imageIds: requestContext.imageIds,
        aspectRatio: requestContext.aspectRatio,
        referenceMode: requestContext.referenceMode,
        durationSeconds: requestContext.durationSeconds,
        recipeId: requestContext.recipeId,
        recipeVersion: requestContext.recipeVersion,
        imageOperation: requestContext.imageOperation,
        shotControls: requestContext.shotControls,
      }, authStore, request)
      if (!response.asset) throw new Error('生成已完成，但响应缺少结果资产。')
      resourceStore.upsertAsset(response.asset)
      resourceStore.upsertTask(response.generation_task)
      await options.queueResourceReconciliation()
      if (isExactGenerationContext(context)) {
        options.foregroundResultNodeId.value = canvasStore.nodes.find((node) => (
          node.type === 'result' && node.contentData?.source_task_id === response.generation_task.id
        ))?.id ?? ''
        const recipe = resolveVisualAssetRecipe(sourceNode)
        options.generationSuccess.value = `${recipe?.title ?? (mediaType === 'video' ? '视频' : '图片')}生成已完成，结果已写入项目资源。`
      }
    } catch (error) {
      if (authStore.token === context.authToken) {
        await resourceStore.refreshIfCurrent(context.projectId).catch(() => undefined)
        const reconciled = await options.queueResourceReconciliation().catch(() => 0)
        if (isExactGenerationContext(context)) {
          options.generationError.value = reconciled
            ? options.formatError(error)
            : '生成请求连接已中断，正在根据任务记录核对结果；请稍后刷新项目资源。'
          shouldPollForRecovery = !reconciled
        }
      }
    } finally {
      if (runtimeRequestId) options.settleRuntimeRequest(runtimeRequestId)
      if (shouldPollForRecovery) options.requestRuntimeRecoveryPolling()
      options.isGenerating.value = false
    }
  }

  async function generate(prompt?: string) {
    const sourceNode = options.selectedNode.value
    const mediaType = options.selectedMediaType.value
    if (!sourceNode || !mediaType || resolveVisualAssetRecipe(sourceNode)) return
    const context = resolveGenerationRequestContext(
      { ...sourceNode, content: prompt ?? sourceNode.content }, mediaType,
      canvasStore.nodes, canvasStore.connections, options.generationCapabilities.value,
    )
    if (context.parameterError) {
      options.generationError.value = context.parameterError
      return
    }
    const operation = context.imageOperation
    if (operation?.id === 'region') {
      options.generationError.value = '区域标记只保存到画布，不会创建生成任务。'
      return
    }
    if ((!operation || IMAGE_OPERATIONS[operation.id].requiresPrompt) && !context.prompt) {
      options.generationError.value = '请填写提示词或连接至少一个有内容的脚本节点。'
      return
    }
    await executeGeneration(sourceNode, mediaType, {
      prompt: context.prompt,
      imageIds: context.imageIds,
      aspectRatio: context.aspectRatio,
      referenceMode: context.referenceMode,
      durationSeconds: context.durationSeconds,
      imageOperation: operation,
      shotControls: context.shotControls,
      parameters: context.parameters,
    }, operation && !IMAGE_OPERATIONS[operation.id].requiresPrompt ? undefined : prompt)
  }

  async function generateRecipe(recipeId: VisualAssetRecipeId) {
    const sourceNode = options.selectedNode.value
    const recipe = sourceNode ? resolveVisualAssetRecipe(sourceNode) : null
    if (!sourceNode || options.selectedMediaType.value !== 'image' || recipe?.id !== recipeId) return
    const context = resolveGenerationRequestContext(
      sourceNode, 'image', canvasStore.nodes, canvasStore.connections, options.generationCapabilities.value,
    )
    if (context.parameterError) {
      options.generationError.value = context.parameterError
      return
    }
    if (context.imageIds.length !== 1) {
      options.generationError.value = '视觉资产配方需要且仅支持 1 张有效参考图。'
      return
    }
    await executeGeneration(sourceNode, 'image', {
      recipeId, recipeVersion: recipe.version, imageIds: context.imageIds,
    })
  }

  function updatePrompt(prompt: string) {
    if (!options.isReviewOnly.value && options.selectedNode.value) {
      void canvasStore.setNodeContent(options.selectedNode.value.id, prompt)
    }
  }

  function updateGenerationParameters(parameters: GenerationNodeParameters) {
    const node = options.selectedNode.value
    if (!options.isReviewOnly.value && !options.isGenerating.value && node) {
      void canvasStore.setNodeGenerationParameters(node.id, parameters)
    }
  }

  return { generate, generateRecipe, updatePrompt, updateGenerationParameters }
}
