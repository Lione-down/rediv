import { ref, watch, type Ref } from 'vue'
import {
  createWorkflowMockRunController,
  preflightWorkflowBatch,
  type WorkflowMockRun,
  type WorkflowMockStorage,
  type WorkflowPreflight,
} from '../../../modules/canvas/workflow-orchestration'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'

const WORKFLOW_TEMPLATE = { id: 'canvas-generation-batch', version: 1 } as const

function safeSessionStorage(): WorkflowMockStorage {
  return {
    getItem(key) {
      try { return globalThis.sessionStorage?.getItem(key) ?? null } catch { return null }
    },
    removeItem(key) {
      try { globalThis.sessionStorage?.removeItem(key) } catch { /* Local mock recovery is optional. */ }
    },
    setItem(key, value) {
      try { globalThis.sessionStorage?.setItem(key, value) } catch { /* Local mock recovery is optional. */ }
    },
  }
}

interface CanvasWorkflowOrchestrationOptions {
  canvasId: Readonly<Ref<string>>
  capabilities: Readonly<Ref<GenerationCapabilities | null>>
  isReviewOnly: Readonly<Ref<boolean>>
  projectId: Readonly<Ref<string>>
}

export function useCanvasWorkflowOrchestration(options: CanvasWorkflowOrchestrationOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const controller = createWorkflowMockRunController(safeSessionStorage())
  const error = ref('')
  const isOpen = ref(false)
  const plan = ref<WorkflowPreflight | null>(null)
  const run = ref<WorkflowMockRun | null>(null)

  function refreshPlan() {
    plan.value = preflightWorkflowBatch({
      capabilities: options.capabilities.value,
      canvasId: options.canvasId.value,
      connections: canvasStore.connections,
      nodes: canvasStore.nodes,
      projectId: options.projectId.value,
      quotas: authStore.quotas,
      selectedNodeIds: canvasStore.selectedNodeIds,
      template: WORKFLOW_TEMPLATE,
    })
    return plan.value
  }

  function openWorkflowBatch() {
    if (options.isReviewOnly.value) return
    error.value = ''
    const nextPlan = refreshPlan()
    run.value = controller.currentFor(nextPlan) ?? controller.recover(nextPlan)
    isOpen.value = true
  }

  function closeWorkflowBatch() {
    isOpen.value = false
    error.value = ''
  }

  function startMockRun() {
    error.value = ''
    try {
      run.value = controller.start(refreshPlan())
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '无法启动 mock 批处理。'
    }
  }

  function advanceMockRun() {
    run.value = controller.advance()
  }

  function cancelMockRun() {
    run.value = controller.cancel()
  }

  function resumeMockRun() {
    error.value = ''
    try {
      run.value = controller.resume(refreshPlan())
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '无法恢复 mock 批处理。'
    }
  }

  watch([options.projectId, options.canvasId], () => {
    closeWorkflowBatch()
    plan.value = null
    run.value = null
  })

  return {
    advanceMockRun,
    cancelMockRun,
    closeWorkflowBatch,
    error,
    isOpen,
    openWorkflowBatch,
    plan,
    resumeMockRun,
    run,
    startMockRun,
  }
}
