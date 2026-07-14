<script setup lang="ts">
import { ArrowRight, FolderKanban, FolderPlus, RefreshCcw, TriangleAlert } from 'lucide-vue-next'
import type { Project } from '../../../../modules/project/types'

defineProps<{
  projects: Project[]
  total: number
  hasLoaded: boolean
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  create: []
  open: [project: Project]
  refresh: []
}>()

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatProjectDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '创建时间未知' : dateFormatter.format(date)
}
</script>

<template>
  <section class="projects-panel" aria-label="项目列表" :aria-busy="isLoading">
    <div class="section-heading">
      <div>
        <p>Projects</p>
        <h2>你的项目</h2>
      </div>
      <div class="heading-actions">
        <span v-if="hasLoaded" class="total-count">共 {{ total }} 个</span>
        <button
          class="icon-action focus-ring"
          type="button"
          aria-label="刷新项目列表"
          :disabled="isLoading"
          @click="emit('refresh')"
        >
          <RefreshCcw :size="16" :class="{ 'is-spinning': isLoading }" />
        </button>
        <button class="create-action focus-ring" type="button" @click="emit('create')">
          <FolderPlus :size="16" />
          新建项目
        </button>
      </div>
    </div>

    <div v-if="error" class="section-alert" role="alert">
      <TriangleAlert :size="17" />
      <span>
        {{ error }}
        <small v-if="projects.length">已保留当前可用的项目数据。</small>
      </span>
      <button class="alert-action focus-ring" type="button" @click="emit('refresh')">重试</button>
    </div>

    <div v-if="isLoading && !hasLoaded && !projects.length" class="project-skeletons" aria-label="正在加载项目">
      <span v-for="index in 3" :key="index" class="project-skeleton" />
    </div>

    <div v-else-if="projects.length" class="project-list">
      <article v-for="project in projects" :key="project.id" class="project-row">
        <div class="project-icon" aria-hidden="true">
          <FolderKanban :size="20" />
        </div>
        <div class="project-copy">
          <h3>{{ project.name }}</h3>
          <p class="project-id">{{ project.id }}</p>
          <time :datetime="project.created_at">{{ formatProjectDate(project.created_at) }}</time>
        </div>
        <button
          class="open-action focus-ring"
          type="button"
          :aria-label="`进入项目 ${project.name}`"
          @click="emit('open', project)"
        >
          进入工作流
          <ArrowRight :size="16" />
        </button>
      </article>
    </div>

    <div v-else-if="hasLoaded" class="empty-state">
      <span class="empty-state__icon"><FolderKanban :size="24" /></span>
      <h3>还没有项目</h3>
      <p>创建第一个项目后，工作流会使用它的真实 ID 保存内容。</p>
      <button class="create-action focus-ring" type="button" @click="emit('create')">
        <FolderPlus :size="16" />
        创建第一个项目
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.projects-panel {
  min-width: 0;
  padding: var(--space-6);
  border-radius: 24px;
  background: var(--bg-panel);
  box-shadow: var(--shadow-soft);
}

.section-heading,
.heading-actions,
.create-action,
.icon-action,
.section-alert,
.open-action {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: var(--space-4);
}

.section-heading p,
.section-heading h2,
.project-copy h3,
.project-copy p,
.empty-state h3,
.empty-state p {
  margin: 0;
}

.section-heading p {
  color: var(--accent-generate-hover);
  font-size: var(--font-size-hint);
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin-top: 5px;
  font-size: var(--font-size-page-heading);
  line-height: var(--line-height-page-heading);
}

.heading-actions {
  gap: var(--space-2);
}

.total-count {
  color: var(--text-muted);
  font-size: var(--font-size-hint);
  font-variant-numeric: tabular-nums;
}

.create-action,
.icon-action,
.alert-action,
.open-action {
  min-height: 40px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.create-action,
.open-action {
  justify-content: center;
  gap: var(--space-2);
  padding: 0 14px;
}

.create-action {
  color: var(--text-primary);
  border-color: transparent;
  background: var(--accent-generate);
}

.icon-action {
  width: 40px;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--bg-panel);
}

.icon-action:disabled {
  cursor: wait;
  opacity: 0.6;
}

.create-action:active,
.icon-action:active,
.alert-action:active,
.open-action:active {
  transform: scale(0.96);
}

.section-alert {
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  color: var(--danger);
  background: color-mix(in oklab, var(--v2-danger) 10%, var(--v2-surface-1));
}

.section-alert span {
  min-width: 0;
  flex: 1;
}

.section-alert small {
  display: block;
  margin-top: var(--space-1);
  color: var(--text-secondary);
}

.alert-action {
  flex: 0 0 auto;
  padding: 0 var(--space-3);
  color: var(--danger);
  background: transparent;
}

.project-skeletons,
.project-list {
  display: grid;
  gap: var(--space-3);
  margin-top: 20px;
}

.project-skeleton {
  height: 102px;
  border-radius: 18px;
  background: var(--bg-panel-subtle);
  animation: pulse 1.2s ease-in-out infinite alternate;
}

.project-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  background: var(--v2-surface-2);
}

.project-icon,
.empty-state__icon {
  display: grid;
  place-items: center;
  color: var(--accent-generate-hover);
  background: var(--v2-accent-soft);
}

.project-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
}

.project-copy {
  min-width: 0;
}

.project-copy h3 {
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.45;
}

.project-copy p,
.project-copy time {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: var(--font-size-hint);
}

.project-id {
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.open-action {
  color: var(--text-primary);
  background: var(--bg-panel);
}

.empty-state {
  display: grid;
  justify-items: start;
  margin-top: 20px;
  padding: var(--space-8);
  border: 1px dashed var(--border-strong);
  border-radius: 18px;
  background: var(--v2-surface-2);
}

.empty-state__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
}

.empty-state h3 {
  margin-top: var(--space-4);
  font-size: 18px;
}

.empty-state p {
  max-width: 52ch;
  margin-top: var(--space-2);
  color: var(--text-secondary);
  line-height: 1.7;
}

.empty-state .create-action {
  margin-top: var(--space-4);
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  to { opacity: 0.55; }
}

@media (hover: hover) {
  .create-action:hover {
    background: var(--v2-accent-hover);
  }

  .icon-action:hover,
  .open-action:hover {
    border-color: var(--border-strong);
    background: var(--bg-panel-subtle);
  }
}

@media (max-width: 640px) {
  .projects-panel {
    padding: var(--space-4);
    border-radius: 20px;
  }

  .section-heading {
    align-items: flex-start;
  }

  .total-count {
    display: none;
  }

  .section-heading > .heading-actions > .create-action {
    width: 40px;
    padding: 0;
    font-size: 0;
  }

  .project-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .open-action {
    grid-column: 1 / -1;
    width: 100%;
  }

  .section-alert {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .alert-action {
    grid-column: 2;
    justify-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .create-action,
  .icon-action,
  .alert-action,
  .open-action {
    transition: none;
  }

  .create-action:active,
  .icon-action:active,
  .alert-action:active,
  .open-action:active {
    transform: none;
  }

  .is-spinning,
  .project-skeleton {
    animation: none;
  }
}
</style>
