import axios from 'axios'
import { computed, ref, watch } from 'vue'
import { useCanvasStore } from '../../store/canvas'
import type { CanvasCommandEnvelope } from '../canvas/canvas-commands'
import {
  cloneWorkflowTemplateInstance,
  detachWorkflowTemplateInstance,
  getWorkflowTemplateInstanceState,
  previewWorkflowTemplateVersionDiff,
  upgradeWorkflowTemplateInstance,
} from './api'
import type {
  WorkflowTemplateInstanceLifecycleResponse,
  WorkflowTemplateLocalOverride,
  WorkflowTemplateVersionDiff,
} from './types'

interface WorkflowTemplateLifecycleScope {
  canvasId: () => string
  currentVersion: () => number
  instanceId: () => string
  isDetached: () => boolean
  isReadOnly: () => boolean
  projectId: () => string
}

type LifecycleAction = 'upgrade' | 'clone' | 'detach'

function safeLifecycleError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : '模板实例操作失败，请重试。'
  }
  const detail = error.response?.data?.detail
  const code = typeof detail === 'object' && detail && 'code' in detail
    ? String(detail.code)
    : ''
  if (code === 'workflow_template_upgrade_incompatible') {
    return '目标版本不兼容，当前实例未发生变更。'
  }
  if (code === 'workflow_template_instance_run_active') {
    return '工作流仍在运行，完成或取消后才能修改模板实例。'
  }
  if (error.response?.status === 409) return '画布或模板实例已变化，请刷新差异后重试。'
  if (error.response?.status === 422) return '模板实例请求已过期或无效，请重新审阅。'
  return '模板实例服务暂时不可用，请重试。'
}

function lifecycleEnvelope(
  instanceId: string,
  action: LifecycleAction,
): CanvasCommandEnvelope {
  return {
    source: 'toolbar',
    command: {
      type: 'apply-workflow-template-lifecycle',
      instanceId,
      action,
    },
  }
}

export function useWorkflowTemplateLifecycle(scope: WorkflowTemplateLifecycleScope) {
  const canvasStore = useCanvasStore()
  const diff = ref<WorkflowTemplateVersionDiff | null>(null)
  const currentVersion = ref(0)
  const localOverrides = ref<WorkflowTemplateLocalOverride[]>([])
  const isDetached = ref(false)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref('')
  let loadSequence = 0
  let activeInstanceId = ''
  const mutationIds: Partial<Record<LifecycleAction, string>> = {}

  const isAvailable = computed(() => Boolean(
    scope.projectId() && scope.canvasId() && scope.instanceId() && currentVersion.value > 0,
  ))
  const canUpgrade = computed(() => Boolean(
    !scope.isReadOnly() &&
    !isDetached.value &&
    !isSubmitting.value &&
    diff.value?.compatible &&
    diff.value.target_version > currentVersion.value,
  ))
  const canMutate = computed(() => Boolean(
    !scope.isReadOnly() && !isDetached.value && !isSubmitting.value,
  ))

  function mutationId(action: LifecycleAction) {
    mutationIds[action] ||= `workflow-template-${action}-${crypto.randomUUID()}`
    return mutationIds[action]!
  }

  function clearMutationId(action: LifecycleAction) {
    delete mutationIds[action]
  }

  async function load() {
    const sequence = ++loadSequence
    const nextInstanceId = scope.instanceId()
    if (activeInstanceId !== nextInstanceId) {
      activeInstanceId = nextInstanceId
      localOverrides.value = []
    }
    currentVersion.value = scope.currentVersion()
    isDetached.value = scope.isDetached()
    diff.value = null
    error.value = ''
    if (!isAvailable.value) return
    isLoading.value = true
    try {
      const stateResponse = await getWorkflowTemplateInstanceState(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
      )
      if (sequence !== loadSequence) return
      currentVersion.value = stateResponse.data.template_version
      localOverrides.value = stateResponse.data.local_overrides
      isDetached.value = stateResponse.data.state === 'detached'
      if (isDetached.value) return
      try {
        const response = await previewWorkflowTemplateVersionDiff(
          scope.projectId(),
          scope.canvasId(),
          scope.instanceId(),
          currentVersion.value + 1,
        )
        if (sequence !== loadSequence) return
        diff.value = response.data
        localOverrides.value = response.data.local_overrides
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) return
        throw requestError
      }
    } catch (requestError) {
      if (sequence !== loadSequence) return
      error.value = safeLifecycleError(requestError)
    } finally {
      if (sequence === loadSequence) isLoading.value = false
    }
  }

  async function commit(
    action: LifecycleAction,
    request: (
      baseRevision: number,
      clientMutationId: string,
    ) => Promise<{ data: WorkflowTemplateInstanceLifecycleResponse }>,
  ) {
    if (!canMutate.value) return null
    isSubmitting.value = true
    error.value = ''
    try {
      const response = await canvasStore.commitScopedCanvasMutation(
        scope.projectId(),
        scope.canvasId(),
        (baseRevision) => request(baseRevision, mutationId(action)).then((result) => result.data),
        lifecycleEnvelope(scope.instanceId(), action),
      )
      clearMutationId(action)
      activeInstanceId = response.instance_id
      currentVersion.value = response.template_version
      localOverrides.value = response.local_overrides
      isDetached.value = response.state === 'detached'
      return response
    } catch (requestError) {
      error.value = safeLifecycleError(requestError)
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  async function upgrade() {
    const preview = diff.value
    if (!canUpgrade.value || !preview) return
    const response = await commit('upgrade', (baseRevision, clientMutationId) => (
      upgradeWorkflowTemplateInstance(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        {
          target_version: preview.target_version,
          base_revision: baseRevision,
          client_mutation_id: clientMutationId,
          diff_fingerprint: preview.fingerprint,
        },
      )
    ))
    if (response) await load()
  }

  async function clone() {
    const response = await commit('clone', (baseRevision, clientMutationId) => (
      cloneWorkflowTemplateInstance(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        {
          base_revision: baseRevision,
          client_mutation_id: clientMutationId,
        },
      )
    ))
    const selectedNodeId = response
      ? response.node_id_map.script ?? Object.values(response.node_id_map)[0]
      : ''
    if (selectedNodeId) canvasStore.setSelection([selectedNodeId])
  }

  async function detach() {
    await commit('detach', (baseRevision, clientMutationId) => (
      detachWorkflowTemplateInstance(
        scope.projectId(),
        scope.canvasId(),
        scope.instanceId(),
        {
          base_revision: baseRevision,
          client_mutation_id: clientMutationId,
        },
      )
    ))
  }

  watch(
    () => [
      scope.projectId(),
      scope.canvasId(),
      scope.instanceId(),
      scope.currentVersion(),
      scope.isDetached(),
    ],
    () => void load(),
    { immediate: true },
  )

  return {
    canMutate,
    canUpgrade,
    clone,
    currentVersion,
    detach,
    diff,
    error,
    isAvailable,
    isDetached,
    isLoading,
    isSubmitting,
    localOverrides,
    load,
    upgrade,
  }
}
