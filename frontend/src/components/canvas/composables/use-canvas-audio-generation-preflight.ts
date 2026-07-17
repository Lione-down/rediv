import { computed, ref, type Ref } from 'vue'
import {
  preflightAudioGeneration,
  type AudioGenerationIntent,
  type AudioGenerationPreflight,
} from '../../../modules/canvas/audio-generation'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import type { Asset } from '../../../types/asset'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'

interface CanvasAudioGenerationPreflightOptions {
  assets: () => readonly Asset[]
  capabilities: Readonly<Ref<GenerationCapabilities | null>>
  canvasId: Readonly<Ref<string>>
  isReviewOnly: Readonly<Ref<boolean>>
  projectId: Readonly<Ref<string>>
}

function selectedIntent(nodes: ReturnType<typeof useCanvasStore>['selectedNodes']): AudioGenerationIntent {
  return nodes.length === 1 && nodes[0]?.type === 'script'
    ? 'text-to-audio'
    : 'audio-driven-video'
}

export function useCanvasAudioGenerationPreflight(options: CanvasAudioGenerationPreflightOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const isOpen = ref(false)
  const intent = computed<AudioGenerationIntent>(() => selectedIntent(canvasStore.selectedNodes))
  const plan = ref<AudioGenerationPreflight | null>(null)

  function refreshPlan() {
    plan.value = preflightAudioGeneration({
      assets: options.assets(),
      capabilities: options.capabilities.value?.audio ?? null,
      canvasId: options.canvasId.value,
      intent: intent.value,
      nodes: canvasStore.nodes,
      projectId: options.projectId.value,
      selectedNodeIds: canvasStore.selectedNodeIds,
      userId: authStore.user?.id ?? '',
    })
  }

  function openAudioGenerationPreflight() {
    if (options.isReviewOnly.value) return
    refreshPlan()
    isOpen.value = true
  }

  function closeAudioGenerationPreflight() { isOpen.value = false }

  return { closeAudioGenerationPreflight, intent, isOpen, openAudioGenerationPreflight, plan }
}
