<script setup lang="ts">
import { computed, onMounted } from 'vue'
import CanvasAgentSkillPreflightPanel from './CanvasAgentSkillPreflightPanel.vue'
import { useCanvasAgentSkillPreflight } from './composables/use-canvas-agent-skill-preflight'

const props = defineProps<{ canvasId: string; isReviewOnly: boolean; projectId: string }>()
const emit = defineEmits<{ close: [] }>()
const {
  closeAgentSkillPreflight,
  error,
  isLoading,
  openAgentSkillPreflight,
  plan,
} = useCanvasAgentSkillPreflight({
  canvasId: computed(() => props.canvasId),
  isReviewOnly: computed(() => props.isReviewOnly),
  projectId: computed(() => props.projectId),
})

onMounted(openAgentSkillPreflight)

function close() {
  closeAgentSkillPreflight()
  emit('close')
}
</script>

<template>
  <CanvasAgentSkillPreflightPanel :error="error" :is-loading="isLoading" :plan="plan" @close="close" />
</template>
