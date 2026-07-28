import { computed, ref } from 'vue'
import axios from 'axios'
import { useCanvasStore } from '../../store/canvas'
import type { ProjectAsset } from '../canvas/project-resource-types'
import {
  fetchWorkflowTemplates,
  instantiateWorkflowTemplate,
  preflightWorkflowTemplate,
} from './api'
import type {
  WorkflowTemplateAssetBindingInput,
  WorkflowTemplateLifecycleItem,
  WorkflowTemplatePreflightResponse,
  WorkflowTemplateVariable,
} from './types'

export type WorkflowTemplateLibraryCategory = 'built_in' | 'mine' | 'recent' | 'deprecated'

interface WorkflowTemplateFeatureOptions {
  assets: () => readonly ProjectAsset[]
  canvasId: () => string
  isReadOnly: () => boolean
  onComplete: () => void
  projectId: () => string
}

type VariableValue = string | number | boolean | string[]

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map(
    (key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`,
  ).join(',')}}`
}

function normalizeBackendDate(value: string) {
  if (value.endsWith('Z')) return `${value.slice(0, -1)}+00:00`
  if (!/[+-]\d\d:\d\d$/.test(value)) return `${value}+00:00`
  return value
}

async function digestSha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function resolveAssetSourceRevision(asset: ProjectAsset) {
  return digestSha256(canonicalJson({
    id: asset.id,
    media_type: asset.type,
    owner_id: asset.user_id,
    project_id: asset.project_id,
    source: asset.source,
    status: asset.status,
    updated_at: normalizeBackendDate(asset.updated_at),
  }))
}

function defaultVariableValue(variable: WorkflowTemplateVariable): VariableValue {
  if (variable.default !== undefined) return structuredClone(variable.default)
  if (variable.type === 'boolean') return false
  if (variable.type === 'integer') return variable.minimum ?? 0
  if (variable.type === 'bounded_list') return []
  return ''
}

function safeRequestError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : '模板操作失败，请重试。'
  }
  const detail = error.response?.data?.detail
  const code = typeof detail === 'object' && detail && 'code' in detail
    ? String(detail.code)
    : ''
  if (code === 'workflow_template_asset_revision_stale') {
    return '所选素材已变化，请刷新素材后重新预检。'
  }
  if (error.response?.status === 409) return '画布版本已变化，请重试。'
  if (error.response?.status === 422) return '模板配置已过期或无效，请重新检查。'
  return '模板服务暂时不可用，请重试。'
}

export function useWorkflowTemplate(options: WorkflowTemplateFeatureOptions) {
  const canvasStore = useCanvasStore()
  const items = ref<WorkflowTemplateLifecycleItem[]>([])
  const category = ref<WorkflowTemplateLibraryCategory>('built_in')
  const selected = ref<WorkflowTemplateLifecycleItem | null>(null)
  const variableBindings = ref<Record<string, VariableValue>>({})
  const assetSelections = ref<Record<string, string[]>>({})
  const fieldErrors = ref<Record<string, string>>({})
  const alertMessage = ref('')
  const loadError = ref('')
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const costConfirmed = ref(false)
  const preflight = ref<WorkflowTemplatePreflightResponse | null>(null)
  const isConfigurationDirty = ref(true)
  const hasPreflightRun = ref(false)
  let clientMutationId = ''

  const visibleItems = computed(() => {
    const recent = [...items.value]
      .filter((item) => item.lifecycle !== 'retired')
      .sort((left, right) => right.published_at.localeCompare(left.published_at))
      .slice(0, 6)
    if (category.value === 'recent') return recent
    if (category.value === 'deprecated') {
      return items.value.filter((item) => item.lifecycle === 'retired')
    }
    if (category.value === 'mine') {
      return items.value.filter((item) => item.scope === 'private' && item.lifecycle !== 'retired')
    }
    return items.value.filter((item) => item.scope === 'built_in' && item.lifecycle === 'published')
  })

  const matchingAssets = computed(() => {
    const projectId = options.projectId()
    return options.assets().filter((asset) => (
      asset.project_id === projectId && asset.status === 'active'
    ))
  })

  const canInstantiate = computed(() => (
    !options.isReadOnly() &&
    preflight.value?.executable === true &&
    Boolean(preflight.value.fingerprint) &&
    !isConfigurationDirty.value &&
    !isSubmitting.value
  ))

  function invalidatePreflight() {
    isConfigurationDirty.value = true
    clientMutationId = ''
    alertMessage.value = ''
  }

  async function load() {
    isLoading.value = true
    loadError.value = ''
    try {
      const response = await fetchWorkflowTemplates()
      items.value = response.data.items
    } catch (error) {
      loadError.value = safeRequestError(error)
    } finally {
      isLoading.value = false
    }
  }

  function selectTemplate(item: WorkflowTemplateLifecycleItem) {
    selected.value = item
    variableBindings.value = Object.fromEntries(
      item.manifest.variables.map((variable) => [variable.key, defaultVariableValue(variable)]),
    )
    assetSelections.value = Object.fromEntries(
      item.manifest.asset_slots.map((slot) => [slot.slot_id, []]),
    )
    fieldErrors.value = {}
    alertMessage.value = ''
    costConfirmed.value = false
    preflight.value = null
    hasPreflightRun.value = false
    invalidatePreflight()
  }

  function updateVariable(key: string, value: VariableValue) {
    variableBindings.value = { ...variableBindings.value, [key]: value }
    if (fieldErrors.value[key]) {
      const next = { ...fieldErrors.value }
      delete next[key]
      fieldErrors.value = next
    }
    invalidatePreflight()
  }

  function toggleAsset(slotId: string, assetId: string, checked: boolean, maximumItems: number) {
    const current = assetSelections.value[slotId] ?? []
    const next = checked
      ? [...current.filter((id) => id !== assetId), assetId].slice(-maximumItems)
      : current.filter((id) => id !== assetId)
    assetSelections.value = { ...assetSelections.value, [slotId]: next }
    if (fieldErrors.value[slotId]) {
      const errors = { ...fieldErrors.value }
      delete errors[slotId]
      fieldErrors.value = errors
    }
    invalidatePreflight()
  }

  function setCostConfirmed(confirmed: boolean) {
    costConfirmed.value = confirmed
    invalidatePreflight()
  }

  function validate() {
    const template = selected.value
    if (!template) return false
    const errors: Record<string, string> = {}
    for (const variable of template.manifest.variables) {
      const value = variableBindings.value[variable.key]
      if (variable.required && (
        value === '' || value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      )) {
        errors[variable.key] = `请填写${variable.label}`
        continue
      }
      if (variable.type === 'integer' && (
        typeof value !== 'number' || !Number.isInteger(value)
      )) {
        errors[variable.key] = `${variable.label}必须是整数`
      }
      if (variable.type === 'enum' && !variable.options?.includes(String(value))) {
        errors[variable.key] = `${variable.label}不是可用选项`
      }
      if (
        typeof value === 'string' && variable.max_length !== undefined &&
        value.length > variable.max_length
      ) errors[variable.key] = `${variable.label}不能超过 ${variable.max_length} 个字符`
      if (typeof value === 'number' && variable.minimum !== undefined && value < variable.minimum) {
        errors[variable.key] = `${variable.label}不能小于 ${variable.minimum}`
      }
      if (typeof value === 'number' && variable.maximum !== undefined && value > variable.maximum) {
        errors[variable.key] = `${variable.label}不能大于 ${variable.maximum}`
      }
    }
    for (const slot of template.manifest.asset_slots) {
      const count = assetSelections.value[slot.slot_id]?.length ?? 0
      if (slot.required && count < slot.minimum_items) {
        errors[slot.slot_id] = `请选择至少 ${slot.minimum_items} 个${slot.media_type}素材`
      }
      if (count > slot.maximum_items) {
        errors[slot.slot_id] = `最多选择 ${slot.maximum_items} 个素材`
      }
    }
    fieldErrors.value = errors
    alertMessage.value = Object.values(errors)[0] ?? ''
    return Object.keys(errors).length === 0
  }

  async function buildAssetBindings() {
    const bindings: Record<string, WorkflowTemplateAssetBindingInput[]> = {}
    for (const [slotId, assetIds] of Object.entries(assetSelections.value)) {
      bindings[slotId] = await Promise.all(assetIds.map(async (assetId) => {
        const asset = matchingAssets.value.find((candidate) => candidate.id === assetId)
        if (!asset) throw new Error('所选素材已不可用，请重新选择。')
        return {
          asset_id: asset.id,
          source_revision: await resolveAssetSourceRevision(asset),
        }
      }))
    }
    return bindings
  }

  async function runPreflight() {
    const template = selected.value
    if (!template || options.isReadOnly() || !validate()) return
    isSubmitting.value = true
    alertMessage.value = ''
    try {
      const assetBindings = await buildAssetBindings()
      const response = await preflightWorkflowTemplate(template.template_id, template.version, {
        project_id: options.projectId(),
        canvas_id: options.canvasId(),
        variable_bindings: variableBindings.value,
        asset_bindings: assetBindings,
        cost_confirmed: costConfirmed.value,
      })
      preflight.value = response.data
      isConfigurationDirty.value = false
      hasPreflightRun.value = true
      clientMutationId = response.data.executable
        ? `workflow-template-${crypto.randomUUID()}`
        : ''
    } catch (error) {
      alertMessage.value = safeRequestError(error)
      preflight.value = null
      isConfigurationDirty.value = true
      hasPreflightRun.value = true
    } finally {
      isSubmitting.value = false
    }
  }

  async function instantiate() {
    const template = selected.value
    const checked = preflight.value
    if (!template || !checked || !canInstantiate.value || !clientMutationId) return
    isSubmitting.value = true
    alertMessage.value = ''
    try {
      const assetBindings = await buildAssetBindings()
      const response = await canvasStore.commitScopedCanvasMutation(
        options.projectId(),
        options.canvasId(),
        (baseRevision) => instantiateWorkflowTemplate(
          options.projectId(),
          options.canvasId(),
          {
            template_id: template.template_id,
            template_version: template.version,
            variable_bindings: variableBindings.value,
            asset_bindings: assetBindings,
            preflight_fingerprint: checked.fingerprint,
            cost_confirmed: costConfirmed.value,
            base_revision: baseRevision,
            client_mutation_id: clientMutationId,
          },
        ).then((result) => result.data),
      )
      const firstNodeId = Object.values(response.node_id_map)[0]
      if (firstNodeId) canvasStore.setSelection([firstNodeId])
      options.onComplete()
    } catch (error) {
      alertMessage.value = safeRequestError(error)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    alertMessage,
    assetSelections,
    canInstantiate,
    category,
    costConfirmed,
    fieldErrors,
    hasPreflightRun,
    isConfigurationDirty,
    isLoading,
    isSubmitting,
    items,
    load,
    loadError,
    matchingAssets,
    preflight,
    runPreflight,
    selectTemplate,
    selected,
    setCostConfirmed,
    instantiate,
    toggleAsset,
    updateVariable,
    variableBindings,
    visibleItems,
  }
}
