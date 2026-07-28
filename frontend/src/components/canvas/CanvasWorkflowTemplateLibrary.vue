<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type {
  WorkflowTemplateLibraryCategory,
} from '../../modules/template/use-workflow-template'
import type { WorkflowTemplateLifecycleItem } from '../../modules/template/types'

const props = defineProps<{
  category: WorkflowTemplateLibraryCategory
  items: readonly WorkflowTemplateLifecycleItem[]
  reviewOnly: boolean
}>()

const emit = defineEmits<{
  select: [item: WorkflowTemplateLifecycleItem]
  updateCategory: [category: WorkflowTemplateLibraryCategory]
}>()

const tabs = [
  { id: 'built_in' as const, label: 'Built-in' },
  { id: 'mine' as const, label: 'My Templates' },
  { id: 'recent' as const, label: 'Recent' },
  { id: 'deprecated' as const, label: 'Deprecated' },
]
const tabButtons = ref<HTMLButtonElement[]>([])

function selectCategory(category: WorkflowTemplateLibraryCategory, focus = false) {
  emit('updateCategory', category)
  if (!focus) return
  void nextTick(() => {
    tabButtons.value[tabs.findIndex((tab) => tab.id === category)]?.focus()
  })
}

function moveTab(direction: 1 | -1) {
  const current = tabs.findIndex((tab) => tab.id === props.category)
  const next = (current + direction + tabs.length) % tabs.length
  selectCategory(tabs[next].id, true)
}

function capabilityLabels(item: WorkflowTemplateLifecycleItem) {
  return [...new Set(item.manifest.steps.flatMap((step) => step.capability_requirements))]
}

function publishedDate(value: string) {
  return value.slice(0, 10)
}
</script>

<template>
  <section class="workflow-template-library" aria-label="模板目录">
    <div
      class="workflow-template-library__tabs"
      role="tablist"
      aria-label="模板分类"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        ref="tabButtons"
        type="button"
        role="tab"
        :aria-selected="category === tab.id"
        :tabindex="category === tab.id ? 0 : -1"
        @click="selectCategory(tab.id)"
        @keydown.left.prevent="moveTab(-1)"
        @keydown.right.prevent="moveTab(1)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="workflow-template-library__list">
      <article v-for="item in items" :key="`${item.template_id}:${item.version}`">
        <header>
          <span>{{ item.manifest.metadata.category }}</span>
          <small>v{{ item.version }} · {{ item.lifecycle }}</small>
        </header>
        <strong>{{ item.manifest.metadata.name }}</strong>
        <p>{{ item.manifest.metadata.description }}</p>
        <dl>
          <div>
            <dt>结构</dt>
            <dd>
              {{ item.manifest.graph.nodes.length }} 节点 ·
              {{ item.manifest.steps.length }} 步骤
            </dd>
          </div>
          <div>
            <dt>归属</dt>
            <dd>{{ item.scope === 'built_in' ? 'Built-in' : 'My template' }}</dd>
          </div>
          <div>
            <dt>Slots</dt>
            <dd>
              {{ item.manifest.asset_slots.filter((slot) => slot.required).length }} required
            </dd>
          </div>
          <div>
            <dt>Capabilities</dt>
            <dd>{{ capabilityLabels(item).join(', ') || 'none' }}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd><time :datetime="item.published_at">{{ publishedDate(item.published_at) }}</time></dd>
          </div>
          <div>
            <dt>工作区</dt>
            <dd>920+ 可编辑</dd>
          </div>
          <div>
            <dt>费用</dt>
            <dd>费用级别由预检确认</dd>
          </div>
        </dl>
        <button
          type="button"
          @click="emit('select', item)"
        >
          {{ reviewOnly ? '查看模板' : '配置模板' }} {{ item.manifest.metadata.name }}
        </button>
      </article>
      <p v-if="items.length === 0" class="workflow-template-library__empty">
        此分类暂无模板。
      </p>
    </div>
  </section>
</template>

<style scoped>
.workflow-template-library {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  border-right: 1px solid var(--v2-border-subtle);
}

.workflow-template-library__tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  padding: var(--v2-space-3);
  border-bottom: 1px solid var(--v2-border-subtle);
}

.workflow-template-library__tabs button {
  min-height: 36px;
  padding: 0 6px;
  border: 0;
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-muted);
  background: transparent;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}

.workflow-template-library__tabs button[aria-selected='true'] {
  color: var(--v2-text-primary);
  background: var(--v2-accent-soft);
}

.workflow-template-library__list {
  display: grid;
  align-content: start;
  gap: var(--v2-space-2);
  min-height: 0;
  padding: var(--v2-space-3);
  overflow: auto;
}

.workflow-template-library__list article {
  display: grid;
  gap: 7px;
  padding: var(--v2-space-3);
  border: 1px solid var(--v2-border-subtle);
  border-radius: var(--v2-radius-md);
  background: var(--v2-surface-1);
}

.workflow-template-library__list header,
.workflow-template-library__list dl div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--v2-space-2);
}

.workflow-template-library__list header span {
  color: var(--v2-accent-hover);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.workflow-template-library__list header small,
.workflow-template-library__list p,
.workflow-template-library__list dt,
.workflow-template-library__list dd {
  color: var(--v2-text-muted);
  font-size: 10px;
}

.workflow-template-library__list strong {
  font-size: var(--v2-font-size-body);
}

.workflow-template-library__list p,
.workflow-template-library__list dl,
.workflow-template-library__list dd {
  margin: 0;
}

.workflow-template-library__list dl {
  display: grid;
  gap: 3px;
}

.workflow-template-library__list button {
  min-height: 36px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.workflow-template-library__empty {
  padding: var(--v2-space-4);
  text-align: center;
}

@media (max-width: 767px) {
  .workflow-template-library {
    border-right: 0;
  }
}
</style>
