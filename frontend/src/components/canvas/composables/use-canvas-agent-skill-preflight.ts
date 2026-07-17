import { computed, ref, type Ref } from 'vue'
import { request } from '../../../api/request'
import {
  CANVAS_CONTEXT_SKILL_ID,
  CANVAS_CONTEXT_SKILL_VERSION,
  loadCanvasAgentSkillCapabilities,
  requestCanvasAgentSkillPreflight,
  type CanvasAgentSkillPreflight,
} from '../../../modules/canvas/agent-skills'
import { useCanvasStore } from '../../../store/canvas'

interface CanvasAgentSkillPreflightOptions {
  canvasId: Readonly<Ref<string>>
  isReviewOnly: Readonly<Ref<boolean>>
  projectId: Readonly<Ref<string>>
}

function messageFor(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Agent/Skill context preflight is unavailable.'
}

export function useCanvasAgentSkillPreflight(options: CanvasAgentSkillPreflightOptions) {
  const canvasStore = useCanvasStore()
  const isOpen = ref(false)
  const isLoading = ref(false)
  const error = ref('')
  const plan = ref<CanvasAgentSkillPreflight | null>(null)
  const selectedNodeIds = computed(() => [...canvasStore.selectedNodeIds])

  async function refreshPlan() {
    if (options.isReviewOnly.value || isLoading.value) return
    error.value = ''
    plan.value = null
    isLoading.value = true
    try {
      await loadCanvasAgentSkillCapabilities(options.projectId.value, options.canvasId.value, request)
      plan.value = await requestCanvasAgentSkillPreflight({
        projectId: options.projectId.value,
        canvasId: options.canvasId.value,
        skillId: CANVAS_CONTEXT_SKILL_ID,
        skillVersion: CANVAS_CONTEXT_SKILL_VERSION,
        selectedNodeIds: selectedNodeIds.value,
      }, request)
    } catch (preflightError) {
      error.value = messageFor(preflightError)
    } finally {
      isLoading.value = false
    }
  }

  function openAgentSkillPreflight() {
    if (options.isReviewOnly.value) return
    isOpen.value = true
    void refreshPlan()
  }

  function closeAgentSkillPreflight() {
    isOpen.value = false
    error.value = ''
    plan.value = null
  }

  return {
    closeAgentSkillPreflight,
    error,
    isLoading,
    isOpen,
    openAgentSkillPreflight,
    plan,
    refreshPlan,
  }
}
