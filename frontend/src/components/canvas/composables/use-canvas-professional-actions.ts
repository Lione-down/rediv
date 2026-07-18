import { computed, nextTick, ref, type ComputedRef } from 'vue'
import { createProfessionalNodeInsertCommand } from '../../../modules/canvas/professional-action-commands'
import {
  resolveProfessionalCanvasAction,
  resolveProfessionalCanvasActions,
  type ImageGridOutputCount,
  type ProfessionalCanvasActionContext,
} from '../../../modules/canvas/professional-action-registry'
import { useCanvasStore } from '../../../store/canvas'
import type { Asset } from '../../../types/asset'
import type { ImageOperationCapabilities } from '../../../modules/canvas/image-operations'

interface CanvasProfessionalActionsOptions {
  assets: () => readonly Asset[]
  canvasId: ComputedRef<string>
  createShotGraph?: () => Promise<unknown>
  createCinematicShotGraph?: () => Promise<unknown>
  createImageOperation?: (operationId: string, operationVersion: number) => Promise<unknown>
  createStoryboardRecipe?: (recipeId: string, recipeVersion: number) => Promise<unknown>
  openAgentSkillPreflight?: () => void
  openAudioGenerationPreflight?: () => void
  openWorkflowBatch?: () => void
  openVideoEditPreflight?: () => void
  getInsertionPoint: () => { x: number; y: number }
  imageOperationCapabilities?: () => ImageOperationCapabilities | null
  isBlocked: () => boolean
  isBusy: () => boolean
  isReadOnly: () => boolean
  isWorkflowView: () => boolean
  projectId: ComputedRef<string>
  splitImageGrid?: (outputCount: ImageGridOutputCount) => Promise<unknown>
  userId: () => string
}

export function useCanvasProfessionalActions(options: CanvasProfessionalActionsOptions) {
  const canvasStore = useCanvasStore()
  const isOpen = ref(false)
  const isExecuting = ref(false)
  const query = ref('')
  const error = ref('')
  let opener: HTMLElement | null = null

  function context(): ProfessionalCanvasActionContext {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    return {
      assets: options.assets(),
      canvasId,
      canvasReady: Boolean(
        canvasStore.hasLoaded &&
        canvasStore.activeProjectId === projectId &&
        canvasStore.activeCanvasId === canvasId
      ),
      imageOperationCapabilities: options.imageOperationCapabilities?.() ?? null,
      isBusy: options.isBusy() || isExecuting.value,
      isReadOnly: options.isReadOnly(),
      isWorkflowView: options.isWorkflowView(),
      projectId,
      selectedNodes: canvasStore.selectedNodes,
      userId: options.userId(),
    }
  }

  const actions = computed(() => resolveProfessionalCanvasActions(context(), query.value)
    .filter((action) => action.eligibility.eligible)
    .filter((action) => action.intent.type !== 'create-shot-graph' || Boolean(options.createShotGraph))
    .filter((action) => action.intent.type !== 'create-cinematic-shot-graph' || Boolean(options.createCinematicShotGraph))
    .filter((action) => action.intent.type !== 'create-image-operation' || Boolean(options.createImageOperation))
    .filter((action) => action.intent.type !== 'create-storyboard-recipe' || Boolean(options.createStoryboardRecipe))
    .filter((action) => action.intent.type !== 'open-agent-skill-preflight' || Boolean(options.openAgentSkillPreflight))
    .filter((action) => action.intent.type !== 'open-audio-generation-preflight' || Boolean(options.openAudioGenerationPreflight))
    .filter((action) => action.intent.type !== 'open-workflow-batch' || Boolean(options.openWorkflowBatch))
    .filter((action) => action.intent.type !== 'open-video-edit-preflight' || Boolean(options.openVideoEditPreflight))
    .filter((action) => action.intent.type !== 'split-image-grid' || Boolean(options.splitImageGrid)))

  function restoreFocus() {
    const target = opener?.isConnected
      ? opener
      : document.querySelector<HTMLElement>('.workspace-stage')
    opener = null
    void nextTick(() => target?.focus({ preventScroll: true }))
  }

  function close() {
    if (!isOpen.value) return
    isOpen.value = false
    query.value = ''
    error.value = ''
    restoreFocus()
  }

  function open(nextOpener: HTMLElement) {
    if (isOpen.value || options.isBlocked()) return
    query.value = ''
    error.value = ''
    if (!resolveProfessionalCanvasActions(context()).some((action) => action.eligibility.eligible)) return
    opener = nextOpener
    isOpen.value = true
  }

  async function execute(actionId: string) {
    if (isExecuting.value) return
    error.value = ''
    const action = resolveProfessionalCanvasAction(context(), actionId)
    if (!action?.eligibility.eligible) {
      error.value = action?.eligibility.reason ?? '该操作当前不可用。'
      return
    }
    if (action.intent.type === 'create-shot-graph') {
      if (!options.createShotGraph) {
        error.value = '脚本分镜能力当前不可用。'
        return
      }
      isExecuting.value = true
      try {
        await options.createShotGraph()
        close()
      } catch (executionError) {
        error.value = executionError instanceof Error ? executionError.message : '脚本分镜创建失败，请重试。'
      } finally {
        isExecuting.value = false
      }
      return
    }
    if (action.intent.type === 'create-cinematic-shot-graph') {
      if (!options.createCinematicShotGraph) {
        error.value = 'Cinematic script Skill 当前不可用。'
        return
      }
      isExecuting.value = true
      try {
        await options.createCinematicShotGraph()
        close()
      } catch (executionError) {
        error.value = executionError instanceof Error ? executionError.message : 'Cinematic script Skill 执行失败，请重试。'
      } finally {
        isExecuting.value = false
      }
      return
    }
    if (action.intent.type === 'create-storyboard-recipe') {
      if (!options.createStoryboardRecipe) {
        error.value = '故事板配方当前不可用。'
        return
      }
      isExecuting.value = true
      try {
        await options.createStoryboardRecipe(action.intent.recipeId, action.intent.recipeVersion)
        close()
      } catch (executionError) {
        error.value = executionError instanceof Error ? executionError.message : '故事板配方创建失败，请重试。'
      } finally {
        isExecuting.value = false
      }
      return
    }
    if (action.intent.type === 'create-image-operation') {
      if (!options.createImageOperation) {
        error.value = '图片操作能力当前不可用。'
        return
      }
      isExecuting.value = true
      try {
        await options.createImageOperation(action.intent.operationId, action.intent.operationVersion)
        close()
      } catch (executionError) {
        error.value = executionError instanceof Error ? executionError.message : '图片操作分支创建失败，请重试。'
      } finally {
        isExecuting.value = false
      }
      return
    }
    if (action.intent.type === 'open-workflow-batch') {
      if (!options.openWorkflowBatch) {
        error.value = '批处理预检当前不可用。'
        return
      }
      options.openWorkflowBatch()
      close()
      return
    }
    if (action.intent.type === 'open-audio-generation-preflight') {
      if (!options.openAudioGenerationPreflight) {
        error.value = '音频生成预检当前不可用。'
        return
      }
      options.openAudioGenerationPreflight()
      close()
      return
    }
    if (action.intent.type === 'open-agent-skill-preflight') {
      if (!options.openAgentSkillPreflight) {
        error.value = 'Agent/Skill context preflight is unavailable.'
        return
      }
      options.openAgentSkillPreflight()
      close()
      return
    }
    if (action.intent.type === 'open-video-edit-preflight') {
      if (!options.openVideoEditPreflight) {
        error.value = '视频编辑预检当前不可用。'
        return
      }
      options.openVideoEditPreflight()
      close()
      return
    }
    if (action.intent.type === 'split-image-grid') {
      if (!options.splitImageGrid) {
        error.value = '图片拆分能力当前不可用。'
        return
      }
      isExecuting.value = true
      try {
        await options.splitImageGrid(action.intent.outputCount)
        close()
      } catch (executionError) {
        error.value = executionError instanceof Error ? executionError.message : '图片拆分失败，请重试。'
      } finally {
        isExecuting.value = false
      }
      return
    }
    const command = createProfessionalNodeInsertCommand(
      action.intent,
      options.getInsertionPoint(),
      canvasStore.nodes,
    )
    if (!command) {
      error.value = '无法创建该节点，请刷新后重试。'
      return
    }
    isExecuting.value = true
    try {
      await canvasStore.dispatchCommand({ source: 'toolbar', command })
      close()
    } catch (executionError) {
      error.value = executionError instanceof Error ? executionError.message : '操作失败，请重试。'
    } finally {
      isExecuting.value = false
    }
  }

  return { actions, close, error, execute, isOpen, open, query }
}
