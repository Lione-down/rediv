<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { GenerationCapabilities } from '../../modules/canvas/generation-parameters'
import CanvasWorkflowBatchPanel from './CanvasWorkflowBatchPanel.vue'
import { useCanvasWorkflowOrchestration } from './composables/use-canvas-workflow-orchestration'

const props = defineProps<{
  canvasId: string
  capabilities: GenerationCapabilities | null
  isReviewOnly: boolean
  projectId: string
}>()
const emit = defineEmits<{ close: [] }>()
const {
  advanceMockRun,
  cancelMockRun,
  closeWorkflowBatch,
  error,
  openWorkflowBatch,
  plan,
  resumeMockRun,
  run,
  startMockRun,
} = useCanvasWorkflowOrchestration({
  canvasId: computed(() => props.canvasId),
  capabilities: computed(() => props.capabilities),
  isReviewOnly: computed(() => props.isReviewOnly),
  projectId: computed(() => props.projectId),
})

onMounted(openWorkflowBatch)

function close() {
  closeWorkflowBatch()
  emit('close')
}
</script>

<template>
  <CanvasWorkflowBatchPanel
    :error="error"
    :plan="plan"
    :run="run"
    @advance="advanceMockRun"
    @cancel="cancelMockRun"
    @close="close"
    @resume="resumeMockRun"
    @start="startMockRun"
  />
</template>
