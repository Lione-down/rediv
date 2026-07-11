<script setup lang="ts">
import { ArrowRight, CircleCheck, X } from 'lucide-vue-next'

defineProps<{
  projectName: string
  navigationError: string
  isOpening: boolean
}>()

const emit = defineEmits<{
  open: []
  dismiss: []
}>()
</script>

<template>
  <section class="project-notice" role="status" aria-live="polite">
    <span class="notice-icon" aria-hidden="true">
      <CircleCheck :size="20" />
    </span>
    <span class="notice-copy">
      <strong>{{ projectName }} 已创建</strong>
      <small>
        {{ navigationError || '新项目已经保存，可以继续打开 Workspace。' }}
      </small>
    </span>
    <button
      class="dismiss-action focus-ring"
      type="button"
      :disabled="isOpening"
      aria-label="关闭已创建项目提示"
      @click="emit('dismiss')"
    >
      <X :size="16" />
    </button>
    <button
      class="open-action focus-ring"
      type="button"
      :disabled="isOpening"
      @click="emit('open')"
    >
      {{ isOpening ? '正在打开' : '打开项目' }}
      <ArrowRight :size="15" />
    </button>
  </section>
</template>

<style scoped lang="scss">
.project-notice,
.notice-icon,
.open-action,
.dismiss-action {
  display: flex;
  align-items: center;
}

.project-notice {
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  border: 1px solid rgba(76, 175, 125, 0.22);
  border-radius: var(--radius-lg);
  color: #f0eef6;
  background: rgba(76, 175, 125, 0.08);
}

.notice-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  justify-content: center;
  border-radius: 13px;
  color: #72c99c;
  background: rgba(76, 175, 125, 0.12);
}

.notice-copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
}

.notice-copy strong,
.notice-copy small {
  overflow-wrap: anywhere;
}

.notice-copy strong {
  font-size: 13px;
}

.notice-copy small {
  color: rgba(240, 238, 246, 0.58);
  font-size: var(--font-size-hint);
  line-height: 1.55;
}

.open-action,
.dismiss-action {
  min-height: 40px;
  justify-content: center;
  border: 1px solid rgba(240, 238, 246, 0.1);
  border-radius: var(--radius-lg);
  color: #f0eef6;
  background: rgba(240, 238, 246, 0.05);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.open-action {
  gap: 7px;
  padding: 0 var(--space-3);
}

.dismiss-action {
  width: 40px;
  flex: 0 0 auto;
}

.open-action:active,
.dismiss-action:active {
  transform: scale(0.96);
}

.open-action:disabled,
.dismiss-action:disabled {
  cursor: wait;
  opacity: 0.58;
}

@media (hover: hover) {
  .open-action:hover,
  .dismiss-action:hover {
    border-color: rgba(240, 238, 246, 0.2);
    background: rgba(240, 238, 246, 0.09);
  }
}

@media (max-width: 620px) {
  .project-notice {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .open-action {
    grid-column: 2 / -1;
    grid-row: 2;
    justify-self: start;
  }

  .dismiss-action {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .open-action,
  .dismiss-action {
    transition: none;
  }

  .open-action:active,
  .dismiss-action:active {
    transform: none;
  }
}
</style>
