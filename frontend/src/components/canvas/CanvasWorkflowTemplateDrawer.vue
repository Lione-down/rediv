<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'
import type { ProjectAsset } from '../../modules/canvas/project-resource-types'
import { useWorkflowTemplate } from '../../modules/template/use-workflow-template'
import type { WorkflowTemplateVariable } from '../../modules/template/types'
import CanvasWorkflowTemplateLibrary from './CanvasWorkflowTemplateLibrary.vue'

const props = defineProps<{
  assets: readonly ProjectAsset[]
  canvasId: string
  projectId: string
  reviewOnly: boolean
}>()

const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

const feature = useWorkflowTemplate({
  assets: () => props.assets,
  canvasId: () => props.canvasId,
  isReadOnly: () => props.reviewOnly,
  onComplete: () => emit('close'),
  projectId: () => props.projectId,
})

const matchingAssetsByType = computed(() => {
  const grouped = new Map<string, ProjectAsset[]>()
  for (const asset of feature.matchingAssets.value) {
    grouped.set(asset.type, [...(grouped.get(asset.type) ?? []), asset])
  }
  return grouped
})

function textValue(variable: WorkflowTemplateVariable) {
  const value = feature.variableBindings.value[variable.key]
  return Array.isArray(value) ? value.join('\n') : String(value ?? '')
}

function numberValue(variable: WorkflowTemplateVariable) {
  const value = feature.variableBindings.value[variable.key]
  return typeof value === 'number' ? value : Number(value)
}

function booleanValue(variable: WorkflowTemplateVariable) {
  return feature.variableBindings.value[variable.key] === true
}

function updateText(variable: WorkflowTemplateVariable, event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  feature.updateVariable(
    variable.key,
    variable.type === 'bounded_list'
      ? value.split('\n').map((item) => item.trim()).filter(Boolean)
      : value,
  )
}

function updateNumber(variable: WorkflowTemplateVariable, event: Event) {
  feature.updateVariable(variable.key, Number((event.target as HTMLInputElement).value))
}

function updateBoolean(variable: WorkflowTemplateVariable, event: Event) {
  feature.updateVariable(variable.key, (event.target as HTMLInputElement).checked)
}

function isAssetSelected(slotId: string, assetId: string) {
  return feature.assetSelections.value[slotId]?.includes(assetId) ?? false
}

function close() {
  emit('close')
}

function handleDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return
  const focusable = Array.from(dialog.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
  )).filter((element) => element.offsetParent !== null)
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  void feature.load()
  void nextTick(() => closeButton.value?.focus({ preventScroll: true }))
})
</script>

<template>
  <section
    ref="dialog"
    class="workflow-template-surface"
    data-workflow-template-surface
    role="dialog"
    aria-modal="true"
    aria-labelledby="workflow-template-title"
    @keydown="handleDialogKeydown"
  >
    <header class="workflow-template-surface__header">
      <div>
        <span>Workflow Templates</span>
        <h2 id="workflow-template-title">工作流模板库</h2>
      </div>
      <p v-if="reviewOnly">移动端仅支持审阅</p>
      <button
        ref="closeButton"
        type="button"
        aria-label="关闭工作流模板库"
        @click="close"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </header>

    <div class="workflow-template-surface__body">
      <CanvasWorkflowTemplateLibrary
        :category="feature.category.value"
        :items="feature.visibleItems.value"
        :review-only="reviewOnly"
        @select="feature.selectTemplate"
        @update-category="feature.category.value = $event"
      />

      <section class="workflow-template-config" aria-label="模板配置">
        <p v-if="feature.isLoading.value" class="workflow-template-config__message">
          正在加载模板目录…
        </p>
        <p v-else-if="feature.loadError.value" class="workflow-template-config__message" role="alert">
          {{ feature.loadError.value }}
        </p>
        <div v-else-if="!feature.selected.value" class="workflow-template-config__intro">
          <span>Configure before instantiate</span>
          <h3>选择一个模板</h3>
          <p>先检查变量、素材槽、图结构与锁定字段，再运行 provider-free preflight。</p>
        </div>

        <template v-else>
          <header class="workflow-template-config__title">
            <div>
              <span>
                {{ feature.selected.value.scope === 'built_in' ? 'Built-in' : 'Private' }}
                · v{{ feature.selected.value.version }}
              </span>
              <h3>{{ feature.selected.value.manifest.metadata.name }}</h3>
            </div>
            <small>{{ feature.selected.value.lifecycle }}</small>
          </header>

          <div v-if="reviewOnly" class="workflow-template-config__review">
            <p>{{ feature.selected.value.manifest.metadata.description }}</p>
            <dl>
              <div>
                <dt>Graph</dt>
                <dd>{{ feature.selected.value.manifest.graph.nodes.length }} 个节点</dd>
              </div>
              <div>
                <dt>Execution plan</dt>
                <dd>{{ feature.selected.value.manifest.steps.length }} 个步骤</dd>
              </div>
              <div>
                <dt>Locked</dt>
                <dd>{{ feature.selected.value.manifest.override_policy.locked_fields.length }} 个字段</dd>
              </div>
            </dl>
          </div>

          <form v-else @submit.prevent="feature.runPreflight">
            <fieldset>
              <legend>配置变量</legend>
              <label
                v-for="variable in feature.selected.value.manifest.variables"
                :key="variable.key"
                class="workflow-template-field"
              >
                <span>
                  {{ variable.label }}
                  <small v-if="variable.required">必填</small>
                </span>
                <textarea
                  v-if="variable.type === 'multiline' || variable.type === 'bounded_list'"
                  :value="textValue(variable)"
                  :aria-invalid="Boolean(feature.fieldErrors.value[variable.key])"
                  @input="updateText(variable, $event)"
                ></textarea>
                <input
                  v-else-if="variable.type === 'integer'"
                  type="number"
                  :value="numberValue(variable)"
                  :min="variable.minimum"
                  :max="variable.maximum"
                  :aria-invalid="Boolean(feature.fieldErrors.value[variable.key])"
                  @input="updateNumber(variable, $event)"
                />
                <select
                  v-else-if="variable.type === 'enum'"
                  :value="textValue(variable)"
                  :aria-invalid="Boolean(feature.fieldErrors.value[variable.key])"
                  @change="updateText(variable, $event)"
                >
                  <option v-for="option in variable.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
                <input
                  v-else-if="variable.type === 'boolean'"
                  type="checkbox"
                  :checked="booleanValue(variable)"
                  :aria-invalid="Boolean(feature.fieldErrors.value[variable.key])"
                  @change="updateBoolean(variable, $event)"
                />
                <input
                  v-else
                  type="text"
                  :value="textValue(variable)"
                  :maxlength="variable.max_length"
                  :aria-invalid="Boolean(feature.fieldErrors.value[variable.key])"
                  @input="updateText(variable, $event)"
                />
                <small v-if="feature.fieldErrors.value[variable.key]" class="workflow-template-field__error">
                  {{ feature.fieldErrors.value[variable.key] }}
                </small>
              </label>
            </fieldset>

            <fieldset
              v-for="slot in feature.selected.value.manifest.asset_slots"
              :key="slot.slot_id"
            >
              <legend>
                {{ slot.role }} · {{ slot.media_type }}
                <small>{{ slot.minimum_items }}–{{ slot.maximum_items }}</small>
              </legend>
              <label
                v-for="asset in matchingAssetsByType.get(slot.media_type) ?? []"
                :key="asset.id"
                class="workflow-template-asset"
              >
                <input
                  type="checkbox"
                  :checked="isAssetSelected(slot.slot_id, asset.id)"
                  @change="feature.toggleAsset(
                    slot.slot_id,
                    asset.id,
                    ($event.target as HTMLInputElement).checked,
                    slot.maximum_items,
                  )"
                />
                <span>{{ asset.content_text || asset.url || asset.id }}</span>
              </label>
              <p v-if="(matchingAssetsByType.get(slot.media_type) ?? []).length === 0">
                当前项目没有可用于 exact binding 的 active {{ slot.media_type }} 素材。
              </p>
              <small v-if="feature.fieldErrors.value[slot.slot_id]" class="workflow-template-field__error">
                {{ feature.fieldErrors.value[slot.slot_id] }}
              </small>
            </fieldset>

            <section class="workflow-template-config__contract" aria-label="模板合同摘要">
              <span>
                {{ feature.selected.value.manifest.graph.nodes.length }} nodes /
                {{ feature.selected.value.manifest.graph.connections.length }} connections
              </span>
              <span>{{ feature.selected.value.manifest.steps.length }} ordered steps</span>
              <span>
                {{ feature.selected.value.manifest.override_policy.locked_fields.length }}
                locked fields
              </span>
            </section>
            <section class="workflow-template-config__facts" aria-label="拓扑与覆盖规则">
              <div>
                <strong>Topology</strong>
                <p>
                  {{
                    feature.selected.value.manifest.graph.nodes
                      .map((node) => node.local_id)
                      .join(' → ')
                  }}
                </p>
              </div>
              <div>
                <strong>Allowed overrides</strong>
                <p>
                  {{ feature.selected.value.manifest.override_policy.allowed_fields.join(', ') }}
                </p>
              </div>
              <div>
                <strong>Locked fields</strong>
                <p>
                  {{ feature.selected.value.manifest.override_policy.locked_fields.join(', ') }}
                </p>
              </div>
              <div>
                <strong>Capabilities</strong>
                <p>
                  {{
                    [...new Set(feature.selected.value.manifest.steps.flatMap(
                      (step) => step.capability_requirements,
                    ))].join(', ')
                  }}
                </p>
              </div>
            </section>

            <p v-if="feature.alertMessage.value" role="alert">
              {{ feature.alertMessage.value }}
            </p>

            <section
              v-if="feature.preflight.value"
              class="workflow-template-preflight"
              aria-label="预检结果"
            >
              <p role="status">
                {{
                  feature.isConfigurationDirty.value
                    ? '配置已更改，请重新预检'
                    : feature.preflight.value.executable
                      ? '预检通过，可以添加到画布'
                      : '预检需要确认'
                }}
              </p>
              <dl>
                <div>
                  <dt>Graph</dt>
                  <dd>
                    {{ feature.preflight.value.graph_summary.nodes }} nodes ·
                    {{ feature.preflight.value.graph_summary.connections }} connections
                  </dd>
                </div>
                <div>
                  <dt>Capability snapshot</dt>
                  <dd>
                    v{{ feature.preflight.value.capability_snapshot.version ?? 'unknown' }}
                  </dd>
                </div>
                <div>
                  <dt>Quota</dt>
                  <dd>
                    Text {{ feature.preflight.value.quota_estimate.text }} ·
                    Image {{ feature.preflight.value.quota_estimate.image }} ·
                    Video {{ feature.preflight.value.quota_estimate.video }}
                  </dd>
                </div>
                <div>
                  <dt>Cost class</dt>
                  <dd>{{ feature.preflight.value.cost_class }}</dd>
                </div>
              </dl>
              <ul
                v-if="feature.preflight.value.errors.length || feature.preflight.value.warnings.length"
                class="workflow-template-preflight__issues"
              >
                <li v-for="issue in feature.preflight.value.errors" :key="`error:${issue.code}`">
                  {{ issue.code }}
                </li>
                <li v-for="issue in feature.preflight.value.warnings" :key="`warning:${issue.code}`">
                  {{ issue.code }}
                </li>
              </ul>
              <label
                v-if="feature.preflight.value.cost_class === 'requires_confirmation'"
                class="workflow-template-cost-confirmation"
              >
                <input
                  type="checkbox"
                  :checked="feature.costConfirmed.value"
                  @change="feature.setCostConfirmed(($event.target as HTMLInputElement).checked)"
                />
                <span>确认此费用级别</span>
              </label>
            </section>

            <footer>
              <button type="submit" :disabled="feature.isSubmitting.value">
                {{ feature.hasPreflightRun.value ? '重新预检' : '运行预检' }}
              </button>
              <button
                type="button"
                :disabled="!feature.canInstantiate.value"
                @click="feature.instantiate"
              >
                添加到画布
              </button>
            </footer>
          </form>
        </template>
      </section>
    </div>
  </section>
</template>

<style scoped src="./canvas-workflow-template-drawer.scss"></style>
