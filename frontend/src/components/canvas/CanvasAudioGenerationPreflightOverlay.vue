<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { GenerationCapabilities } from '../../modules/canvas/generation-parameters'
import type { Asset } from '../../types/asset'
import CanvasAudioGenerationPreflightPanel from './CanvasAudioGenerationPreflightPanel.vue'
import { useCanvasAudioGenerationPreflight } from './composables/use-canvas-audio-generation-preflight'

const props = defineProps<{ assets: readonly Asset[]; capabilities: GenerationCapabilities | null; canvasId: string; isReviewOnly: boolean; projectId: string }>()
const emit = defineEmits<{ close: [] }>()
const { closeAudioGenerationPreflight, openAudioGenerationPreflight, plan } = useCanvasAudioGenerationPreflight({ assets: () => props.assets, capabilities: computed(() => props.capabilities), canvasId: computed(() => props.canvasId), isReviewOnly: computed(() => props.isReviewOnly), projectId: computed(() => props.projectId) })
onMounted(openAudioGenerationPreflight)
function close() { closeAudioGenerationPreflight(); emit('close') }
</script>

<template><CanvasAudioGenerationPreflightPanel :plan="plan" @close="close" /></template>
