<script setup lang="ts">
import { NEmpty } from 'naive-ui'
import { ArrowRight, Boxes, LayoutTemplate, RefreshCcw, TriangleAlert } from 'lucide-vue-next'
import type { Template } from '../../../../modules/template/types'
import { formatSpaceDate } from './space-presentation'

defineProps<{
  templates: Template[]
  total: number
  selectedTemplateId: string
  usingTemplateId: string
  hasPendingProject: boolean
  hasLoaded: boolean
  isLoading: boolean
  error: string
  useError: string
}>()

const emit = defineEmits<{
  refresh: []
  select: [template: Template]
  use: [template: Template]
}>()
</script>

<template>
  <section class="templates-panel" aria-labelledby="templates-heading" :aria-busy="isLoading">
    <div class="section-heading">
      <div>
        <p>Templates</p>
        <h2 id="templates-heading">可复用模板</h2>
        <span>{{ hasLoaded ? `共 ${total} 个模板，按创建时间倒序` : '等待模板列表同步' }}</span>
      </div>
      <button
        class="icon-action focus-ring"
        type="button"
        :disabled="isLoading"
        aria-label="刷新模板列表"
        @click="emit('refresh')"
      >
        <RefreshCcw :size="17" :class="{ 'is-spinning': isLoading }" />
      </button>
    </div>

    <div v-if="error" class="section-alert" role="alert">
      <TriangleAlert :size="17" />
      <span>
        {{ error }}
        <small v-if="templates.length">已保留当前可见模板。</small>
      </span>
      <button class="alert-action focus-ring" type="button" @click="emit('refresh')">重试</button>
    </div>

    <div v-if="useError" class="section-alert is-use-error" role="alert">
      <TriangleAlert :size="17" />
      <span>{{ useError }}</span>
    </div>

    <div v-if="isLoading && !hasLoaded && !templates.length" class="template-grid" aria-label="正在加载模板">
      <span v-for="index in 4" :key="index" class="template-skeleton" />
    </div>

    <div v-else-if="templates.length" class="template-grid">
      <article
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        :class="{ 'is-selected': selectedTemplateId === template.id }"
      >
        <div class="template-mark" aria-hidden="true">
          <LayoutTemplate :size="22" />
        </div>
        <div class="template-copy">
          <strong>{{ template.name }}</strong>
          <span>
            <Boxes :size="14" />
            {{ template.node_count }} 个节点
          </span>
          <time :datetime="template.created_at">{{ formatSpaceDate(template.created_at) }}</time>
        </div>
        <div class="template-actions">
          <button
            class="secondary-action focus-ring"
            type="button"
            @click="emit('select', template)"
          >
            查看结构
          </button>
          <button
            class="primary-action focus-ring"
            type="button"
            :disabled="Boolean(usingTemplateId) || hasPendingProject"
            :aria-label="`使用模板 ${template.name} 创建新项目`"
            @click="emit('use', template)"
          >
            {{ hasPendingProject ? '已有项目待打开' : usingTemplateId === template.id ? '创建中' : '使用并创建项目' }}
            <ArrowRight :size="15" />
          </button>
        </div>
      </article>
    </div>

    <div v-else-if="hasLoaded" class="empty-state">
      <NEmpty description="还没有可复用模板。" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.templates-panel {
  min-width: 0;
}

.section-heading,
.section-alert,
.icon-action,
.template-actions,
.template-copy span,
.secondary-action,
.primary-action {
  display: flex;
  align-items: center;
}

.section-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.section-heading p,
.section-heading h2,
.section-heading span,
.template-copy strong,
.template-copy span {
  margin: 0;
}

.section-heading p {
  color: #8f7ae1;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin-top: 4px;
  color: #f0eef6;
  font-size: 22px;
}

.section-heading > div > span {
  display: block;
  margin-top: 5px;
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
}

.icon-action,
.alert-action,
.secondary-action,
.primary-action {
  min-height: 40px;
  border: 1px solid rgba(240, 238, 246, 0.1);
  border-radius: var(--radius-lg);
  color: rgba(240, 238, 246, 0.72);
  background: rgba(240, 238, 246, 0.04);
}

.icon-action {
  width: 40px;
  flex: 0 0 auto;
  justify-content: center;
}

.icon-action:disabled,
.primary-action:disabled {
  cursor: wait;
  opacity: 0.58;
}

.section-alert {
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid rgba(217, 83, 92, 0.25);
  border-radius: var(--radius-lg);
  color: #e06a71;
  background: rgba(217, 83, 92, 0.08);
  font-size: var(--font-size-hint);
}

.section-alert.is-use-error {
  border-color: rgba(212, 160, 60, 0.25);
  color: #d4a03c;
  background: rgba(212, 160, 60, 0.08);
}

.section-alert span {
  min-width: 0;
  flex: 1;
  line-height: 1.6;
}

.section-alert small {
  display: block;
  color: rgba(240, 238, 246, 0.56);
}

.alert-action {
  flex: 0 0 auto;
  padding: 0 11px;
  color: #e06a71;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.template-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-4);
  min-width: 0;
  padding: 20px;
  border: 1px solid rgba(240, 238, 246, 0.07);
  border-radius: 20px;
  background: rgba(240, 238, 246, 0.025);
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

.template-card.is-selected {
  border-color: rgba(123, 97, 214, 0.42);
  background: rgba(99, 71, 194, 0.09);
}

.template-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 15px;
  color: #9b87e8;
  background: rgba(99, 71, 194, 0.16);
}

.template-copy {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 7px;
}

.template-copy strong {
  overflow-wrap: anywhere;
  color: #f0eef6;
  font-size: 15px;
  line-height: 1.45;
}

.template-copy span {
  gap: 6px;
  color: rgba(240, 238, 246, 0.62);
  font-size: 13px;
}

.template-copy time {
  color: rgba(240, 238, 246, 0.56);
  font-size: var(--font-size-hint);
  font-variant-numeric: tabular-nums;
}

.template-actions {
  grid-column: 1 / -1;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.secondary-action,
.primary-action {
  justify-content: center;
  gap: 7px;
  padding: 0 var(--space-3);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.primary-action {
  border-color: transparent;
  color: #f0eef6;
  background: #6347c2;
}

.secondary-action:active,
.primary-action:active {
  transform: scale(0.96);
}

.template-skeleton {
  min-height: 190px;
  border-radius: 20px;
  background: var(--v2-surface-2);
}

.empty-state {
  display: grid;
  min-height: 260px;
  margin-top: var(--space-6);
  place-items: center;
  border: 1px dashed rgba(240, 238, 246, 0.1);
  border-radius: 20px;
  background: rgba(240, 238, 246, 0.018);
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes skeleton {
  to { background-position: -200% 0; }
}

@media (hover: hover) {
  .icon-action:hover:not(:disabled),
  .alert-action:hover,
  .secondary-action:hover {
    border-color: rgba(240, 238, 246, 0.2);
    background: rgba(240, 238, 246, 0.08);
  }

  .primary-action:hover:not(:disabled) {
    background: #7b61d6;
  }

  .template-card:hover {
    border-color: rgba(240, 238, 246, 0.13);
    background: rgba(240, 238, 246, 0.04);
    transform: translateY(-2px);
  }
}

@media (max-width: 760px) {
  .template-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .template-card {
    grid-template-columns: 1fr;
    padding: var(--space-4);
  }

  .template-actions {
    grid-column: 1;
    justify-content: stretch;
  }

  .secondary-action,
  .primary-action {
    flex: 1 1 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .template-card,
  .secondary-action,
  .primary-action {
    transition: none;
  }

  .template-card:hover,
  .secondary-action:active,
  .primary-action:active {
    transform: none;
  }

  .template-skeleton,
  .is-spinning {
    animation: none;
  }
}
</style>
