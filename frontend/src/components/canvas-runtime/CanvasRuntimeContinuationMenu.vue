<script setup lang="ts">
import { ArrowLeft, ArrowRight, X } from 'lucide-vue-next'
import type {
  ConnectionContinuationDirection,
  ConnectionContinuationOption,
} from '../../modules/canvas/connection-continuation'

defineProps<{
  direction: ConnectionContinuationDirection
  options: readonly ConnectionContinuationOption[]
  position: { left: number; top: number }
}>()

const emit = defineEmits<{
  close: []
  select: [option: ConnectionContinuationOption]
}>()
</script>

<template>
  <section
    class="runtime-continuation-menu"
    data-runtime-continuation-menu
    role="dialog"
    aria-label="继续连接"
    :style="{ left: `${position.left}px`, top: `${position.top}px` }"
    @pointerdown.stop
  >
    <header>
      <span>
        <ArrowRight v-if="direction === 'downstream'" :size="15" aria-hidden="true" />
        <ArrowLeft v-else :size="15" aria-hidden="true" />
        继续连接
      </span>
      <button type="button" aria-label="关闭继续连接" @click="emit('close')">
        <X :size="15" aria-hidden="true" />
      </button>
    </header>
    <p>{{ direction === 'downstream' ? '创建下游工作流' : '创建上游工作流' }}</p>
    <div role="group" aria-label="兼容工作流">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        :aria-label="`创建${option.label}`"
        @click="emit('select', option)"
      >
        <span aria-hidden="true">{{ option.icon }}</span>
        <strong>{{ option.label }}</strong>
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.runtime-continuation-menu {
  position: absolute;
  z-index: 40;
  display: grid;
  width: 248px;
  gap: 7px;
  padding: 9px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-lg);
  color: var(--v2-text-primary);
  background: var(--v2-surface-2);
  box-shadow: var(--v2-shadow-prominent);
}

header {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: space-between;
}

header span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

header button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-muted);
  background: transparent;
  cursor: pointer;
}

p {
  margin: 0;
  color: var(--v2-text-muted);
  font-size: 9px;
}

div {
  display: grid;
  gap: 3px;
}

div > button {
  display: grid;
  min-height: 38px;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  padding: 4px 7px;
  border: 0;
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-secondary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

div > button:hover {
  color: var(--v2-text-primary);
  background: var(--v2-surface-3);
}

div > button span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  color: var(--v2-accent-hover);
  background: var(--v2-accent-soft);
  font-size: 8px;
}

div > button strong {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

button:focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}
</style>
