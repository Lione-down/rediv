<script setup lang="ts">
import { Film, Image, Route, WandSparkles } from 'lucide-vue-next'

const workflowSteps = [
  {
    title: '镜头脚本',
    detail: 'Prompt 已整理',
    state: 'complete',
    stateLabel: '已完成',
    icon: WandSparkles,
  },
  {
    title: '角色参考',
    detail: '角色视觉锚点',
    state: 'active',
    stateLabel: '进行中',
    icon: Image,
  },
  {
    title: '视频草稿',
    detail: '等待进入生成队列',
    state: 'pending',
    stateLabel: '待处理',
    icon: Film,
  },
] as const
</script>

<template>
  <div class="workflow-preview" aria-label="Revid 创作工作流预览">
    <div class="preview-header">
      <span class="preview-title">
        <span class="live-dot" aria-hidden="true"></span>
        当前工作流
      </span>
      <span class="preview-status">
        <Route :size="13" aria-hidden="true" />
        结构预览
      </span>
    </div>

    <ol class="workflow-list">
      <li
        v-for="step in workflowSteps"
        :key="step.title"
        class="workflow-step"
        :class="`is-${step.state}`"
      >
        <span class="step-icon" aria-hidden="true">
          <component :is="step.icon" :size="17" />
        </span>
        <span class="step-copy">
          <strong>{{ step.title }}</strong>
          <small>{{ step.detail }}</small>
        </span>
        <span class="step-state">{{ step.stateLabel }}</span>
      </li>
    </ol>

    <div class="preview-footer">
      <span class="preview-pulse" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
      </span>
      <span>Prompt、参考图与草稿集中整理</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.workflow-preview {
  width: min(100%, 560px);
  padding: var(--space-4);
  border: 1px solid var(--auth-border);
  border-radius: var(--radius-lg);
  background: var(--auth-app);
}

.preview-header,
.workflow-step {
  display: grid;
  align-items: center;
}

.preview-header {
  grid-template-columns: 1fr auto;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-1) var(--space-4);
  border-bottom: 1px solid var(--auth-border);
}

.preview-title,
.preview-status,
.preview-footer {
  display: flex;
  align-items: center;
}

.preview-title,
.preview-status {
  gap: var(--space-2);
}

.preview-title {
  color: var(--auth-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: #4caf7d;
}

.preview-status {
  color: var(--auth-text-muted);
  font-size: var(--font-size-hint);
}

.workflow-list {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-4) 0;
  padding: 0;
  list-style: none;
}

.workflow-step {
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  min-height: 66px;
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--auth-panel);
}

.workflow-step.is-active {
  border-color: rgba(99, 71, 194, 0.55);
  background: var(--auth-raised);
}

.step-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--auth-text-secondary);
  background: rgba(240, 238, 246, 0.05);
}

.is-active .step-icon {
  color: #b8a8ee;
  background: rgba(99, 71, 194, 0.18);
}

.step-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.step-copy strong {
  font-size: 13px;
  font-weight: 600;
}

.step-copy small,
.step-state,
.preview-footer {
  color: var(--auth-text-muted);
  font-size: var(--font-size-hint);
}

.step-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-state {
  padding: 5px var(--space-2);
  border-radius: var(--radius-pill);
  background: rgba(240, 238, 246, 0.05);
  white-space: nowrap;
}

.is-active .step-state {
  color: #c7bcf2;
  background: rgba(99, 71, 194, 0.2);
}

.preview-footer {
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 34px;
  padding: var(--space-3) var(--space-1) 0;
  border-top: 1px solid var(--auth-border);
}

.preview-pulse {
  display: flex;
  align-items: center;
  gap: 3px;
}

.preview-pulse i {
  display: block;
  width: 3px;
  border-radius: var(--radius-pill);
  background: rgba(169, 151, 236, 0.68);
}

.preview-pulse i:nth-child(1) {
  height: 8px;
}

.preview-pulse i:nth-child(2) {
  height: 14px;
}

.preview-pulse i:nth-child(3) {
  height: 10px;
}

@media (max-width: 760px) {
  .workflow-preview {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .workflow-step {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .step-state {
    display: none;
  }
}
</style>
