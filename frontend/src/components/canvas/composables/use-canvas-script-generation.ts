import { isAxiosError } from 'axios'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { request } from '../../../api/request'
import { createGenerationClientRequestId, requestCanvasGeneration } from '../../../modules/canvas/generation-service'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import {
  createScriptAuthoringResultCommand,
  createStoryProductionResultCommand,
  resolveScriptAuthoringEligibility,
  type ScriptAuthoringIntent,
  type ScriptAuthoringLocale,
} from '../../../modules/canvas/script-authoring'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'

interface ScriptGenerationOptions {
  canvasId: ComputedRef<string>
  generationCapabilities: Ref<GenerationCapabilities | null>
  isReviewOnly: Ref<boolean>
  projectId: ComputedRef<string>
}

export interface ScriptGenerationSubmission {
  intent: ScriptAuthoringIntent
  locale: ScriptAuthoringLocale
  modelId: string
  value: string
  referenceAssetIds?: string[]
  outputKind?: 'script' | 'story_production'
  requestedShotCount?: number
}

function errorMessage(error: unknown) {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      const message = (detail as Record<string, unknown>).message
      if (typeof message === 'string' && message.trim()) return message.trim()
    }
    if (Number(error.response?.status) >= 500) {
      return '脚本生成服务暂时不可用，请稍后重试。'
    }
  }
  return error instanceof Error ? error.message : '脚本生成失败，请稍后重试。'
}

function nodeText(node: { content?: string; contentData?: Record<string, unknown> }) {
  const value = node.content ?? node.contentData?.text
  return typeof value === 'string' ? value : ''
}

function connectedPromptNodeIds(canvasStore: ReturnType<typeof useCanvasStore>, targetNodeId: string) {
  const nodesById = new Map(canvasStore.nodes.map((node) => [node.id, node]))
  const seen = new Set<string>()
  return canvasStore.connections.flatMap((connection) => {
    if (
      connection.to !== targetNodeId || connection.sourcePort !== 'out' ||
      connection.targetPort !== 'in' || connection.status === 'deleted' ||
      seen.has(connection.from)
    ) return []
    const source = nodesById.get(connection.from)
    if (
      !source || source.type !== 'script' || source.contentData?.subtype !== 'prompt' ||
      !nodeText(source).trim()
    ) return []
    seen.add(source.id)
    return [source.id]
  })
}

export function useCanvasScriptGeneration(options: ScriptGenerationOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const resourceStore = useProjectResourceStore()
  const active = ref(false)
  const error = ref('')
  const success = ref('')
  let controller: AbortController | null = null

  const capability = computed(() => options.generationCapabilities.value?.text ?? null)

  function cancel() {
    controller?.abort()
    controller = null
  }

  async function generate(submission: ScriptGenerationSubmission) {
    if (active.value || !capability.value || authStore.quotas.text <= 0) return
    const eligibility = resolveScriptAuthoringEligibility({
      canvasReady: canvasStore.hasLoaded,
      intent: submission.intent,
      isReadOnly: false,
      isReviewOnly: options.isReviewOnly.value,
      selectedNodes: canvasStore.selectedNodes,
    })
    if (!eligibility.eligible) {
      error.value = eligibility.reason
      return
    }
    const value = submission.value.trim()
    const limit = submission.intent === 'script_draft'
      ? capability.value.briefMaxLength
      : capability.value.briefMaxLength
    if (!value || value.length > limit) {
      error.value = `请输入 1–${limit} 个字符。`
      return
    }
    const selectedModel = capability.value.models.find((model) => model.id === submission.modelId)
    if (!selectedModel) {
      error.value = '所选脚本模型当前不可用，请重新选择。'
      return
    }

    const source = eligibility.source
    const isStoryProduction = submission.outputKind === 'story_production'
    if (
      isStoryProduction &&
      capability.value.storyDirectorRequestContractVersion !== 1
    ) {
      error.value = '当前 backend runtime 未声明分镜请求 contract，请重启当前 backend 后再试。'
      return
    }
    if (
      isStoryProduction &&
      submission.requestedShotCount !== undefined &&
      (
        !Number.isInteger(submission.requestedShotCount) ||
        submission.requestedShotCount < 1 ||
        submission.requestedShotCount > 25
      )
    ) {
      error.value = '镜头数量必须是 1–25 的整数。'
      return
    }
    const storySourceNodeIds = isStoryProduction
      ? connectedPromptNodeIds(canvasStore, source.id)
      : []
    if (isStoryProduction && !storySourceNodeIds.length && !nodeText(source).trim()) {
      error.value = '请先连接包含故事内容的提示词文本框，再生成分镜。'
      return
    }
    const expectedProjectId = options.projectId.value
    const expectedCanvasId = options.canvasId.value
    const sourceTextAtRequest = nodeText(source)
    error.value = ''
    success.value = ''
    active.value = true
    const requestController = new AbortController()
    controller = requestController
    try {
      await canvasStore.flushPendingPersistence()
      const canvasRevision = canvasStore.graphRevision
      const response = await requestCanvasGeneration({
        mediaType: 'text',
        clientRequestId: createGenerationClientRequestId(),
        modelId: selectedModel.id,
        projectId: expectedProjectId,
        originCanvasId: expectedCanvasId,
        canvasNodeId: source.id,
        scriptAuthoring: {
          intent: submission.intent,
          locale: submission.locale,
          canvasRevision,
          ...(submission.intent === 'script_draft'
            ? { brief: value, referenceAssetIds: submission.referenceAssetIds }
            : { sourceText: sourceTextAtRequest, instruction: value }),
          ...(isStoryProduction ? {
            storyDirector: {
              contractVersion: 1,
              ...(submission.requestedShotCount
                ? { requestedShotCount: submission.requestedShotCount }
                : {}),
              sourceNodeIds: storySourceNodeIds,
            },
          } : {}),
        },
      }, authStore, request, requestController.signal)
      if (response.asset) resourceStore.upsertAsset(response.asset)
      resourceStore.upsertTask(response.generation_task)
      if (!response.content || !response.script_authoring) {
        throw new Error('脚本生成响应缺少可编辑文本或 lineage。')
      }
      const currentSource = canvasStore.findNodeById(source.id)
      if (
        canvasStore.activeProjectId !== expectedProjectId || canvasStore.activeCanvasId !== expectedCanvasId ||
        canvasStore.graphRevision !== canvasRevision || !currentSource || nodeText(currentSource) !== sourceTextAtRequest
      ) {
        error.value = 'Canvas 或源脚本已变化；生成文本已保存在项目资源中，未自动应用。'
        return
      }
      const command = isStoryProduction
        ? createStoryProductionResultCommand({
            source: currentSource,
            sourceTextAtRequest,
            generatedText: response.content,
            storyProduction: response.story_production,
            lineage: response.script_authoring,
          })
        : createScriptAuthoringResultCommand({
            source: currentSource,
            sourceTextAtRequest,
            generatedText: response.content,
            lineage: response.script_authoring,
          })
      if (!command) {
        error.value = '源脚本已变化；生成文本已保存在项目资源中，未自动应用。'
        return
      }
      await canvasStore.dispatchCommand({ source: 'toolbar', command })
      await canvasStore.flushPendingPersistence()
      success.value = isStoryProduction
        ? '分镜已生成并保存到当前脚本卡片，可撤销。'
        : '当前脚本已替换，可撤销。'
    } catch (generationError) {
      if (requestController.signal.aborted) error.value = '脚本生成已取消；不会自动应用迟到结果。'
      else error.value = errorMessage(generationError)
    } finally {
      if (controller === requestController) controller = null
      active.value = false
    }
  }

  watch(
    () => [options.projectId.value, options.canvasId.value],
    () => {
      if (active.value) cancel()
      error.value = ''
      success.value = ''
    },
  )

  return { active, capability, cancel, error, generate, success }
}
