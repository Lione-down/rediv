import { ref, type Ref } from 'vue'
import {
  preflightVideoEdit,
  type VideoEditOperation,
  type VideoEditPreflight,
} from '../../../modules/canvas/video-edit-preflight'
import type { Asset } from '../../../types/asset'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'

interface CanvasVideoEditPreflightOptions {
  assets: () => readonly Asset[]
  canvasId: Readonly<Ref<string>>
  isReviewOnly: Readonly<Ref<boolean>>
  projectId: Readonly<Ref<string>>
}

const TEMPLATE = { id: 'video-edit-preflight', version: 1 } as const

export function useCanvasVideoEditPreflight(options: CanvasVideoEditPreflightOptions) {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()
  const isOpen = ref(false)
  const operation = ref<VideoEditOperation>({ kind: 'trim', start_seconds: 0, end_seconds: 5 })
  const plan = ref<VideoEditPreflight | null>(null)

  function refreshPlan() {
    plan.value = preflightVideoEdit({
      assets: options.assets(),
      canvasId: options.canvasId.value,
      nodes: canvasStore.nodes,
      operation: operation.value,
      projectId: options.projectId.value,
      selectedNodeIds: canvasStore.selectedNodeIds,
      template: TEMPLATE,
      userId: authStore.user?.id ?? '',
    })
  }

  function openVideoEditPreflight() {
    if (options.isReviewOnly.value) return
    operation.value = canvasStore.selectedNodeIds.length > 1
      ? { kind: 'concat' }
      : { kind: 'trim', start_seconds: 0, end_seconds: 5 }
    refreshPlan()
    isOpen.value = true
  }

  function closeVideoEditPreflight() {
    isOpen.value = false
  }

  function updateOperation(next: VideoEditOperation) {
    operation.value = next
    refreshPlan()
  }

  return { closeVideoEditPreflight, isOpen, openVideoEditPreflight, operation, plan, updateOperation }
}
