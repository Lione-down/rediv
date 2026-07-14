<script setup lang="ts">
import {
  WORKFLOW_STARTERS,
  type WorkflowStarterId,
} from './canvas-workflow-starters'

withDefaults(defineProps<{ readonly?: boolean; busy?: boolean }>(), {
  readonly: false,
  busy: false,
})

const emit = defineEmits<{
  dismiss: []
  start: [starterId: WorkflowStarterId]
}>()
</script>

<template>
  <section class="canvas-empty-guide" role="region" aria-label="空白画布起点" aria-live="polite">
    <div class="empty-guide-copy">
      <span>{{ readonly ? '只读审阅' : '空白画布' }}</span>
      <h2>{{ readonly ? '这个画布还是空白的' : '从一个创作方向开始' }}</h2>
      <p>{{ readonly ? '当前没有可审阅的节点。' : '选择一个轻量起点，或保留完全空白的画布。' }}</p>
    </div>

    <div v-if="!readonly" class="workflow-starters" aria-label="工作流起点">
      <button
        v-for="starter in WORKFLOW_STARTERS"
        :key="starter.id"
        type="button"
        :aria-label="`使用${starter.title}工作流`"
        :disabled="busy"
        @click="emit('start', starter.id as WorkflowStarterId)"
      >
        <span class="starter-marker" aria-hidden="true">{{ starter.marker }}</span>
        <span class="starter-copy">
          <strong>{{ starter.title }}</strong>
          <small>{{ starter.detail }}</small>
        </span>
      </button>
    </div>

    <button
      v-if="!readonly"
      class="keep-blank-action"
      type="button"
      :disabled="busy"
      @click="emit('dismiss')"
    >
      保持空白画布
    </button>
  </section>
</template>

<style scoped lang="scss">
.canvas-empty-guide {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 20px;
  padding: 96px 24px 112px;
  color: var(--text-primary);
  text-align: center;
  pointer-events: none;
}

.empty-guide-copy {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.empty-guide-copy > span {
  color: var(--v2-accent, var(--accent-select));
  font-size: 12px;
  font-weight: 550;
}

.empty-guide-copy h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  text-wrap: balance;
}

.empty-guide-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.7;
  text-wrap: pretty;
}

.workflow-starters {
  display: grid;
  grid-template-columns: repeat(2, 176px);
  gap: 12px;
  pointer-events: auto;
}

.workflow-starters button {
  display: grid;
  width: 176px;
  height: 56px;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-standard, var(--border-subtle));
  border-radius: var(--v2-radius-sm, var(--radius-md));
  color: var(--text-primary);
  text-align: left;
  background: var(--bg-panel);
  cursor: pointer;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), border-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

.starter-marker {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: var(--v2-radius-xs, 4px);
  color: var(--v2-accent, var(--accent-select));
  font-size: 11px;
  font-weight: 600;
  background: var(--v2-accent-soft);
}

.starter-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.starter-copy strong,
.starter-copy small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
}

.starter-copy strong { font-size: 13px; font-weight: 550; }
.starter-copy small { color: var(--text-muted); font-size: 11px; }

.keep-blank-action {
  min-width: 120px;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--v2-radius-sm, var(--radius-md));
  color: var(--text-secondary);
  font: inherit;
  font-size: 13px;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transition: color var(--v2-duration-fast, 120ms), background-color var(--v2-duration-fast, 120ms), transform var(--v2-duration-fast, 120ms);
}

button:active { transform: scale(var(--v2-press-scale, 0.96)); }
button:focus-visible {
  outline: 2px solid var(--v2-focus-ring, var(--accent-select));
  outline-offset: 2px;
}
button:disabled { cursor: wait; opacity: 0.56; }

@media (hover: hover) {
  .workflow-starters button:hover {
    border-color: var(--border-strong);
    color: var(--v2-accent-hover, var(--accent-select));
    background: var(--bg-panel-subtle);
  }
  .keep-blank-action:hover { color: var(--text-primary); background: var(--bg-panel-subtle); }
}

@media (max-width: 520px) {
  .canvas-empty-guide { padding-inline: 16px; }
  .workflow-starters { grid-template-columns: 176px; }
}

@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
  button:active { transform: none; }
}
</style>
