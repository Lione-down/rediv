<script setup lang="ts">
import type { Point } from './canvas-geometry'

defineProps<{
  ports: readonly { anchor: Point; nodeId: string; nodeTitle: string; portId: string }[]
}>()
</script>

<template>
  <div
    v-for="port in ports"
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
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in oklch, var(--success) 78%, white 22%);
  border-radius: 50%;
  background: color-mix(in oklch, var(--success) 28%, var(--bg-panel));
  box-shadow: 0 0 0 5px color-mix(in oklch, var(--success) 13%, transparent);
  pointer-events: none;
  transform: translate(-50%, -50%);
}
</style>
