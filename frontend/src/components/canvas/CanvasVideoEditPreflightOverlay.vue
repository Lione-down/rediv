<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Asset } from '../../types/asset'
import CanvasVideoEditPreflightPanel from './CanvasVideoEditPreflightPanel.vue'
import { useCanvasVideoEditPreflight } from './composables/use-canvas-video-edit-preflight'

const props = defineProps<{ assets: readonly Asset[]; canvasId: string; isReviewOnly: boolean; projectId: string }>()
const emit = defineEmits<{ close: [] }>()
const { closeVideoEditPreflight, openVideoEditPreflight, operation, plan, updateOperation } = useCanvasVideoEditPreflight({ assets: () => props.assets, canvasId: computed(() => props.canvasId), isReviewOnly: computed(() => props.isReviewOnly), projectId: computed(() => props.projectId) })
onMounted(openVideoEditPreflight)
function close() { closeVideoEditPreflight(); emit('close') }
</script>

<template><CanvasVideoEditPreflightPanel :operation="operation" :plan="plan" @close="close" @update-operation="updateOperation" /></template>
