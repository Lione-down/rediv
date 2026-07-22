<script setup lang="ts">
import { computed } from 'vue'
import type { Point } from './canvas-geometry'

const props = defineProps<{
  ports: readonly { anchor: Point; nodeId: string; nodeTitle: string; portId: string }[]
}>()

const visiblePorts = computed(() => {
  const seen = new Set<string>()
  return props.ports.filter((port) => {
    const key = `${port.nodeId}:${port.anchor.x.toFixed(3)}:${port.anchor.y.toFixed(3)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})
</script>

<template>
  <div
    v-for="port in visiblePorts"
    :key="`${port.nodeId}-${port.portId}`"
    class="connection-target-port"
    :data-node-id="port.nodeId"
    :data-port-id="port.portId"
    :style="{ left: `${port.anchor.x}px`, top: `${port.anchor.y}px` }"
    aria-hidden="true"
  />
</template>

<style scoped lang="scss">
.connection-target-port {
  position: absolute;
  z-index: 5;
  width: 20px;
  height: 20px;
  border: 2px solid color-mix(in oklch, var(--success) 78%, white 22%);
  border-radius: 50%;
  background: color-mix(in oklch, var(--success) 28%, var(--bg-panel));
  box-shadow: 0 0 0 5px color-mix(in oklch, var(--success) 13%, transparent);
  pointer-events: none;
  transform: translate(-50%, -50%);
}
</style>
