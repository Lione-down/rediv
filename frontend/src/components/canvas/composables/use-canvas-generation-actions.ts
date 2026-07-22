import type { ComputedRef, Ref } from 'vue'
import { request } from '../../../api/request'
import { createGenerationClientRequestId, requestCanvasGeneration } from '../../../modules/canvas/generation-service'
import {
  IMAGE_OPERATIONS,
  type ImageOperationContract,
} from '../../../modules/canvas/image-operations'
import {
  resolveGenerationRequestContext,
  type GenerationCapabilities,
  type GenerationNodeParameters,
  type ImageBatchSnapshot,
  type VideoReferenceBinding,
} from '../../../modules/canvas/generation-parameters'
import { resolveVisualAssetRecipe, type VisualAssetRecipeId } from '../../../modules/canvas/visual-asset-recipes'
import type { ShotControls } from '../../../modules/canvas/shot-controls'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import { getGenerationMediaType } from '../../../modules/canvas/node-registry'
import {
  parseCinematicSkillNodeSettings,
  prepareCinematicGeneration,
  type CinematicGenerationHandoff,
  type PreparedCinematicGeneration,
} from '../../../modules/canvas/cinematic-skills'
import type { CinematicDirectorGenerationHandoff } from '../../../modules/canvas/cinematic-director-preflight'
import { useCanvasImageGenerationBatch } from './use-canvas-image-generation-batch'

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
  isNodeGenerating: (nodeId: string) => boolean
  setGenerationError: (nodeId: string, message: string) => void
  setGenerationSuccess: (nodeId: string, message: string) => void
  foregroundResultNodeId: Ref<string>
  formatError: (error: unknown) => string
  queueResourceReconciliation: () => Promise<number>
  beginRuntimeRequest: (context: GenerationRequestContext, clientRequestId: string) => string | null
  requestRuntimeRecoveryPolling: () => void
  settleRuntimeRequest: (runtimeRequestId: string) => void
  consumeDirectorPreflight: (nodeId: string) => PreparedCinematicGeneration | null
}

interface GenerationExecutionOptions {
  prompt?: string
  imageIds?: string[]
  imageBatch?: ImageBatchSnapshot
  videoReferences?: VideoReferenceBinding[]
  aspectRatio?: string
  referenceMode?: 'text-to-video' | 'image-to-video' | 'keyframes'
  durationSeconds?: number
  recipeId?: VisualAssetRecipeId
  recipeVersion?: 1 | 2
  imageOperation?: ImageOperationContract
  shotControls?: ShotControls
  parameters?: GenerationNodeParameters | null
  cinematicHandoff?: CinematicGenerationHandoff | CinematicDirectorGenerationHandoff
  isCanvasPrepared?: boolean
}

interface ActiveGenerationExecution {
  clientRequestId: string
  context: GenerationRequestContext
  runtimeRequestId: string
}

export function useCanvasGenerationActions(options: CanvasGenerationActionOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()
  const imageGenerationBatch = useCanvasImageGenerationBatch()

  function isExactGenerationContext(context: GenerationRequestContext) {
    return authStore.token === context.authToken &&
      canvasStore.activeProjectId === context.projectId &&
      canvasStore.activeCanvasId === context.canvasId
  }

  function beginExecution(sourceNode: CanvasNode, mediaType: 'image' | 'video') {
    if (options.isReviewOnly.value) return null
    if (options.isNodeGenerating(sourceNode.id)) {
      options.setGenerationError(sourceNode.id, '此节点已有生成任务正在执行。')
      return null
    }
    const context: GenerationRequestContext = {
      authToken: authStore.token,
      projectId: options.projectId.value,
      canvasId: options.canvasId.value,
      nodeId: sourceNode.id,
      mediaType,
    }
    if (authStore.quotas[mediaType] < 1) {
      options.setGenerationError(sourceNode.id, `${mediaType} quota 不足，当前生成已阻止。`)
      return null
    }
    const actionId = createGenerationClientRequestId()
    const runtimeRequestId = options.beginRuntimeRequest(context, actionId)
    if (!runtimeRequestId) {
      options.setGenerationError(sourceNode.id, '此节点已有生成任务正在执行。')
      return null
    }
    options.setGenerationError(sourceNode.id, '')
    options.setGenerationSuccess(sourceNode.id, '')
    return { clientRequestId: actionId, context, runtimeRequestId }
  }

  async function executeGeneration(
    sourceNode: CanvasNode,
    mediaType: 'image' | 'video',
    requestContext: GenerationExecutionOptions,
    execution: ActiveGenerationExecution,
    promptToPersist?: string,
  ) {
    const { clientRequestId, context, runtimeRequestId } = execution
    let shouldPollForRecovery = false
    let succeeded = false
    try {
      if (!requestContext.isCanvasPrepared && requestContext.parameters) {
        await canvasStore.setNodeGenerationParameters(sourceNode.id, requestContext.parameters)
      }
      if (!requestContext.isCanvasPrepared && promptToPersist !== undefined) {
        await canvasStore.setNodeContent(sourceNode.id, promptToPersist)
      }
      if (!requestContext.isCanvasPrepared) {
        await canvasStore.setNodeGenerationState(sourceNode.id, 'running')
        await canvasStore.flushPendingPersistence()
      }
      const response = await requestCanvasGeneration({
        mediaType,
        clientRequestId,
        projectId: context.projectId,
        originCanvasId: context.canvasId,
        canvasNodeId: context.nodeId,
        prompt: requestContext.prompt,
        imageIds: requestContext.imageIds,
        imageBatch: requestContext.imageBatch,
        videoReferences: requestContext.videoReferences,
        aspectRatio: requestContext.aspectRatio,
        referenceMode: requestContext.referenceMode,
        durationSeconds: requestContext.durationSeconds,
        recipeId: requestContext.recipeId,
        recipeVersion: requestContext.recipeVersion,
        imageOperation: requestContext.imageOperation,
        shotControls: requestContext.shotControls,
        cinematicHandoff: requestContext.cinematicHandoff,
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
        options.setGenerationSuccess(sourceNode.id, `${recipe?.title ?? (mediaType === 'video' ? '视频' : '图片')}生成已完成，结果已写入项目资源。`)
      }
      succeeded = true
    } catch (error) {
      if (authStore.token === context.authToken) {
        await resourceStore.refreshIfCurrent(context.projectId).catch(() => undefined)
        const reconciled = await options.queueResourceReconciliation().catch(() => 0)
        if (isExactGenerationContext(context)) {
          options.setGenerationError(sourceNode.id, reconciled
            ? options.formatError(error)
            : '生成请求连接已中断，正在根据任务记录核对结果；请稍后刷新项目资源。')
          shouldPollForRecovery = !reconciled
        }
      }
    } finally {
      if (runtimeRequestId) options.settleRuntimeRequest(runtimeRequestId)
      if (shouldPollForRecovery) options.requestRuntimeRecoveryPolling()
    }
    return succeeded
  }

  async function generate(prompt?: string, targetNodeId?: string) {
    const sourceNode = targetNodeId ? canvasStore.findNodeById(targetNodeId) : options.selectedNode.value
    const mediaType = targetNodeId && sourceNode ? getGenerationMediaType(sourceNode) : options.selectedMediaType.value
    if (!sourceNode || !mediaType || resolveVisualAssetRecipe(sourceNode)) return
    const context = resolveGenerationRequestContext(
      { ...sourceNode, content: prompt ?? sourceNode.content }, mediaType,
      canvasStore.nodes, canvasStore.connections, options.generationCapabilities.value,
    )
    if (context.parameterError) {
      options.setGenerationError(sourceNode.id, context.parameterError)
      return
    }
    const operation = context.imageOperation
    if (operation?.id === 'region') {
      options.setGenerationError(sourceNode.id, '区域标记只保存到画布，不会创建生成任务。')
      return
    }
    if ((!operation || IMAGE_OPERATIONS[operation.id].requiresPrompt) && !context.prompt) {
      options.setGenerationError(sourceNode.id, '请填写提示词或连接至少一个有内容的脚本节点。')
      return
    }
    if (mediaType === 'image' && !context.imageBatch && (context.outputCount ?? 1) > 1) {
      const slotCount = context.outputCount ?? 1
      if (authStore.quotas.image < slotCount) {
        options.setGenerationError(sourceNode.id, `image quota 不足，需要 ${slotCount}，当前剩余 ${authStore.quotas.image}。`)
        return
      }
      let plan
      try {
        plan = await imageGenerationBatch.prepare(sourceNode, slotCount)
      } catch (error) {
        options.setGenerationError(sourceNode.id, options.formatError(error))
        return
      }
      const executions = plan.slots.flatMap((slot) => {
        const node = canvasStore.findNodeById(slot.nodeId)
        if (!node) return []
        const execution = beginExecution(node, 'image')
        return execution ? [{ node, execution, slot }] : []
      })
      await Promise.allSettled(executions.map(({ node, execution, slot }) => executeGeneration(node, 'image', {
        prompt: context.prompt,
        imageIds: context.imageIds,
        imageBatch: slot.batch,
        aspectRatio: context.aspectRatio,
        imageOperation: operation,
        shotControls: context.shotControls,
        parameters: slot.parameters,
      }, execution, prompt)))
      return
    }
    let execution: ActiveGenerationExecution | null = null
    try {
      execution = beginExecution(sourceNode, mediaType)
    } catch (error) {
      options.setGenerationError(sourceNode.id, options.formatError(error))
      return
    }
    if (!execution) return
    const promptToPersist = operation && !IMAGE_OPERATIONS[operation.id].requiresPrompt ? undefined : prompt
    let prepared = options.consumeDirectorPreflight(sourceNode.id)
    try {
      const rawSettings = sourceNode.contentData?.cinematic_skill
      const persistedSettings = rawSettings === undefined ? null : parseCinematicSkillNodeSettings(rawSettings, mediaType)
      if ((persistedSettings?.enabled || prepared) && operation) throw new Error('cinematic Skill 不支持包装 image operation。')
      if (!prepared && persistedSettings?.enabled) {
        if (context.parameters) await canvasStore.setNodeGenerationParameters(sourceNode.id, context.parameters)
        if (promptToPersist !== undefined) await canvasStore.setNodeContent(sourceNode.id, promptToPersist)
        await canvasStore.flushPendingPersistence()
        const generationParameters: Record<string, unknown> = {
          image_ids: context.imageIds,
          ...(mediaType === 'image'
            ? { aspect_ratio: context.aspectRatio }
            : {
                reference_mode: context.referenceMode,
                duration_seconds: context.durationSeconds,
              }),
          ...(context.shotControls ? { shot_controls: context.shotControls } : {}),
        }
        prepared = await prepareCinematicGeneration({
          projectId: options.projectId.value,
          canvasId: options.canvasId.value,
          mediaType,
          userInstruction: context.prompt ?? '',
          rawSettings,
          generationParameters,
        }, request)
      }
    } catch (error) {
      options.setGenerationError(sourceNode.id, options.formatError(error))
      options.settleRuntimeRequest(execution.runtimeRequestId)
      return
    }
    return executeGeneration(sourceNode, mediaType, {
      prompt: prepared?.optimizedPrompt ?? context.prompt,
      imageIds: prepared?.imageIds ?? context.imageIds,
      imageBatch: context.imageBatch,
      videoReferences: prepared ? undefined : context.videoReferences,
      aspectRatio: context.aspectRatio,
      referenceMode: context.referenceMode,
      durationSeconds: context.durationSeconds,
      imageOperation: operation,
      shotControls: context.shotControls,
      parameters: prepared ? null : context.parameters,
      cinematicHandoff: prepared?.handoff,
      isCanvasPrepared: Boolean(prepared),
    }, execution, prepared ? undefined : promptToPersist)
  }

  async function generateRecipe(recipeId: VisualAssetRecipeId) {
    const sourceNode = options.selectedNode.value
    const recipe = sourceNode ? resolveVisualAssetRecipe(sourceNode) : null
    if (!sourceNode || options.selectedMediaType.value !== 'image' || recipe?.id !== recipeId) return
    const context = resolveGenerationRequestContext(
      sourceNode, 'image', canvasStore.nodes, canvasStore.connections, options.generationCapabilities.value,
    )
    if (context.parameterError) {
      options.setGenerationError(sourceNode.id, context.parameterError)
      return
    }
    if (context.imageIds.length !== 1) {
      options.setGenerationError(sourceNode.id, '视觉资产配方需要且仅支持 1 张有效参考图。')
      return
    }
    let execution: ActiveGenerationExecution | null = null
    try {
      execution = beginExecution(sourceNode, 'image')
    } catch (error) {
      options.setGenerationError(sourceNode.id, options.formatError(error))
      return
    }
    if (!execution) return
    await executeGeneration(sourceNode, 'image', {
      recipeId, recipeVersion: recipe.version, imageIds: context.imageIds,
    }, execution)
  }

  function updatePrompt(prompt: string) {
    if (!options.isReviewOnly.value && options.selectedNode.value && !options.isNodeGenerating(options.selectedNode.value.id)) {
      void canvasStore.setNodeContent(options.selectedNode.value.id, prompt)
    }
  }

  function updateGenerationParameters(parameters: GenerationNodeParameters) {
    const node = options.selectedNode.value
    if (!options.isReviewOnly.value && node && !options.isNodeGenerating(node.id)) {
      void canvasStore.setNodeGenerationParameters(node.id, parameters)
    }
  }

  function generateNode(nodeId: string) {
    return generate(undefined, nodeId)
  }

  return { generate, generateNode, generateRecipe, updatePrompt, updateGenerationParameters }
}
