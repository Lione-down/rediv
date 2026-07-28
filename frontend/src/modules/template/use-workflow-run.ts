import axios from 'axios'
import { computed, onScopeDispose, ref, watch } from 'vue'
import {
  cancelWorkflowRun,
  fetchLatestWorkflowRun,
  fetchWorkflowRun,
  preflightWorkflowRun,
  startWorkflowRun,
} from './api'
import type {
  WorkflowRun,
  WorkflowTemplatePreflightResponse,
} from './types'


interface WorkflowRunScope {
  canvasId: () => string
  instanceId: () => string
  isReadOnly: () => boolean
  projectId: () => string
}

const ACTIVE_STATUSES = new Set(['ready', 'submitting', 'queued', 'running', 'persisting'])

function safeRunError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : '工作流运行失败，请重试。'
  }
  const detail = error.response?.data?.detail
  const code = typeof detail === 'object' && detail && 'code' in detail
    ? String(detail.code)
    : ''
  if (code === 'workflow_run_preflight_stale') {
    return '工作流内容或素材已变化，请重新检查。'
  }
  if (error.response?.status === 409) return '工作流状态已变化，请刷新后重试。'
  if (error.response?.status === 422) return '工作流运行请求无效，请重新检查。'
  return '工作流运行服务暂时不可用，请重试。'
}

export function resolveWorkflowRunInstanceId(content: Record<string, unknown> | undefined) {
  const lineage = content?.workflow_template_lineage
  if (!lineage || typeof lineage !== 'object' || Array.isArray(lineage)) return ''
  const record = lineage as Record<string, unknown>
  return record.contract_version === 1 && typeof record.instance_id === 'string'
    ? record.instance_id
    : ''
}

export function useWorkflowRun(scope: WorkflowRunScope) {
  const costConfirmed = ref(false)
  const error = ref('')
  const isSubmitting = ref(false)
  const preflight = ref<WorkflowTemplatePreflightResponse | null>(null)
  const run = ref<WorkflowRun | null>(null)
  let clientRunId = ''
  let loadSequence = 0
  let pollTimer: ReturnType<typeof setTimeout> | undefined

  const isAvailable = computed(() => Boolean(
    scope.projectId() && scope.canvasId() && scope.instanceId(),
  ))
  const canStart = computed(() => Boolean(
    !scope.isReadOnly() &&
    !isSubmitting.value &&
    costConfirmed.value &&
    preflight.value?.executable &&
    preflight.value.fingerprint,
  ))
  const canCancel = computed(() => Boolean(
    !scope.isReadOnly() &&
    run.value &&
    ACTIVE_STATUSES.has(run.value.status) &&
    !isSubmitting.value,
  ))

  function clearPoll() {
    if (pollTimer !== undefined) clearTimeout(pollTimer)
    pollTimer = undefined
  }

  function schedulePoll() {
    clearPoll()
    if (!run.value || !ACTIVE_STATUSES.has(run.value.status)) return
    pollTimer = setTimeout(() => {
      void refreshRun()
    }, 1500)
  }

  async function recoverLatest() {
    const sequence = ++loadSequence
    clearPoll()
    run.value = null
    preflight.value = null
    costConfirmed.value = false
    error.value = ''
    clientRunId = ''
    if (!isAvailable.value) return
    try {
      const response = await fetchLatestWorkflowRun(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
      )
      if (sequence !== loadSequence) return
      run.value = response.data
      schedulePoll()
    } catch (requestError) {
      if (sequence !== loadSequence) return
      if (axios.isAxiosError(requestError) && requestError.response?.status === 404) return
      error.value = safeRunError(requestError)
    }
  }

  async function refreshRun() {
    const current = run.value
    if (!current || !isAvailable.value) return
    try {
      const response = await fetchWorkflowRun(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        current.run_id,
      )
      if (run.value?.run_id !== current.run_id) return
      run.value = response.data
      schedulePoll()
    } catch (requestError) {
      error.value = safeRunError(requestError)
      clearPoll()
    }
  }

  function setCostConfirmed(value: boolean) {
    costConfirmed.value = value
    preflight.value = null
    clientRunId = ''
    error.value = ''
  }

  async function check() {
    if (!isAvailable.value || scope.isReadOnly() || isSubmitting.value) return
    isSubmitting.value = true
    error.value = ''
    try {
      const response = await preflightWorkflowRun(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        costConfirmed.value,
      )
      preflight.value = response.data
      clientRunId = response.data.executable
        ? `workflow-run-${crypto.randomUUID()}`
        : ''
    } catch (requestError) {
      preflight.value = null
      clientRunId = ''
      error.value = safeRunError(requestError)
    } finally {
      isSubmitting.value = false
    }
  }

  async function start() {
    if (!canStart.value || !preflight.value || !clientRunId) return
    isSubmitting.value = true
    error.value = ''
    try {
      const response = await startWorkflowRun(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        {
          client_run_id: clientRunId,
          preflight_fingerprint: preflight.value.fingerprint,
          cost_confirmed: costConfirmed.value,
        },
      )
      run.value = response.data
      schedulePoll()
    } catch (requestError) {
      error.value = safeRunError(requestError)
    } finally {
      isSubmitting.value = false
    }
  }

  async function cancel() {
    if (!canCancel.value || !run.value) return
    isSubmitting.value = true
    error.value = ''
    try {
      const response = await cancelWorkflowRun(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        run.value.run_id,
      )
      run.value = response.data
      clearPoll()
    } catch (requestError) {
      error.value = safeRunError(requestError)
    } finally {
      isSubmitting.value = false
    }
  }

  watch(
    () => [scope.projectId(), scope.canvasId(), scope.instanceId()],
    () => void recoverLatest(),
    { immediate: true },
  )
  onScopeDispose(clearPoll)

  return {
    canCancel,
    canStart,
    check,
    costConfirmed,
    error,
    isAvailable,
    isSubmitting,
    preflight,
    run,
    setCostConfirmed,
    start,
    cancel,
  }
}
