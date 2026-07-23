import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { request } from '../../../api/request'
import {
  createApplyGenerationJobResultCommand,
  createBindTextGenerationJobCommand,
  readTextCardContentRevision,
} from '../../../modules/canvas/canvas-commands'
import type {
  GenerationJobResult,
} from '../../../modules/canvas/generation-job-api'
import {
  createGenerationClientRequestId,
  submitGenerationJob,
} from '../../../modules/canvas/generation-service'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import type { TextWorkflowMode } from '../../../modules/canvas/script-authoring'
import { useCanvasStore } from '../../../store/canvas'

interface CanvasTextGenerationOptions {
  canvasId: ComputedRef<string>
  capabilities: Ref<GenerationCapabilities | null>
  generationJobResults: Ref<ReadonlyMap<string, GenerationJobResult>>
  isReviewOnly: Ref<boolean>
  projectId: ComputedRef<string>
}

function message(error: unknown) {
  return error instanceof Error ? error.message : '文本生成提交失败，请稍后重试。'
}

export function useCanvasTextGeneration(options: CanvasTextGenerationOptions) {
  const canvasStore = useCanvasStore()
  const errors = ref<ReadonlyMap<string, string>>(new Map())
  const pendingNodeIds = ref<ReadonlySet<string>>(new Set())
  let reconciliation = Promise.resolve()

  function setError(nodeId: string, value: string) {
    const next = new Map(errors.value)
    if (value) next.set(nodeId, value)
    else next.delete(nodeId)
    errors.value = next
  }

  function setPending(nodeId: string, value: boolean) {
    const next = new Set(pendingNodeIds.value)
    if (value) next.add(nodeId)
    else next.delete(nodeId)
    pendingNodeIds.value = next
  }

  async function submit(input: {
    nodeId: string
    prompt: string
    mode: TextWorkflowMode
    modelId: string
  }) {
    if (options.isReviewOnly.value || pendingNodeIds.value.has(input.nodeId)) return
    const node = canvasStore.findNodeById(input.nodeId)
    const capability = options.capabilities.value?.text
    const model = capability?.models.find((candidate) => (
      candidate.id === input.modelId && candidate.workflowModes.includes(input.mode)
    ))
    const prompt = input.prompt.trim()
    if (
      !node || !model || !prompt ||
      !options.projectId.value || !options.canvasId.value ||
      node.contentData?.active_generation_job_id
    ) {
      setError(input.nodeId, '请选择 capability 允许的模型，并确认当前卡片没有进行中的任务。')
      return
    }
    const contentRevision = readTextCardContentRevision(node)
    setError(input.nodeId, '')
    setPending(input.nodeId, true)
    try {
      const receipt = await submitGenerationJob({
        clientRequestId: createGenerationClientRequestId(),
        projectId: options.projectId.value,
        canvasId: options.canvasId.value,
        nodeId: input.nodeId,
        mediaType: 'text',
        modelId: model.id,
        input: {
          prompt,
          mode: input.mode,
          content_revision: contentRevision,
        },
      }, request)
      const command = createBindTextGenerationJobCommand(canvasStore.nodes, input.nodeId, {
        expectedContentRevision: contentRevision,
        jobId: receipt.job_id,
        mode: input.mode,
        modelId: model.id,
      })
      if (!command) {
        setError(input.nodeId, '任务已持久化，但卡片绑定发生冲突；刷新后可继续恢复该任务。')
        return
      }
      await canvasStore.dispatchCommand({ source: 'toolbar', command })
    } catch (error) {
      setError(input.nodeId, message(error))
    } finally {
      setPending(input.nodeId, false)
    }
  }

  async function reconcileResults() {
    for (const result of options.generationJobResults.value.values()) {
      if (result.result.media_type !== 'text') continue
      const node = canvasStore.findNodeById(result.node_id)
      if (!node || node.contentData?.active_generation_job_id !== result.job_id) continue
      const command = createApplyGenerationJobResultCommand(node, result.job_id, result)
      if (!command) {
        setError(
          node.id,
          '生成结果已保留，但当前文本在生成期间发生变化。撤销该编辑可安全恢复并应用结果。',
        )
        continue
      }
      await canvasStore.dispatchCommand({ source: 'toolbar', command })
      setError(node.id, '')
    }
  }

  watch([
    () => [...options.generationJobResults.value.values()]
      .map((result) => `${result.job_id}:${result.version}`).join('|'),
    () => canvasStore.nodes.map((node) => (
      `${node.id}:${String(node.contentData?.active_generation_job_id ?? '')}:${readTextCardContentRevision(node)}`
    )).join('|'),
  ], () => {
    reconciliation = reconciliation.then(reconcileResults, reconcileResults)
  }, { immediate: true, flush: 'post' })

  return {
    errors,
    isPending: (nodeId: string) => pendingNodeIds.value.has(nodeId),
    pendingNodeIds: computed(() => pendingNodeIds.value),
    submit,
  }
}
