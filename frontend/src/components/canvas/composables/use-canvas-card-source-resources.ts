import { ref, type ComputedRef, type Ref } from 'vue'
import { getGenerationMediaType } from '../../../modules/canvas/node-registry'
import type { ProjectAsset } from '../../../modules/canvas/project-resource-types'
import { createCardSourceReferenceCommand } from '../../../modules/canvas/resource-commands'
import { useCanvasStore } from '../../../store/canvas'

interface CanvasCardSourceResourceOptions {
  actionError: Ref<string>
  closeResources: () => void
  formatError: (error: unknown) => string
  isReviewOnly: Ref<boolean>
  openResources: (opener: HTMLElement) => void
  projectId: ComputedRef<string>
  uploadAsset: (file: File, type: 'image') => Promise<ProjectAsset | undefined>
}

export function useCanvasCardSourceResources(options: CanvasCardSourceResourceOptions) {
  const canvasStore = useCanvasStore()
  const cardSourceTargetNodeId = ref('')

  function openCardSourceResources(nodeId: string, opener: HTMLElement) {
    const node = canvasStore.findNodeById(nodeId)
    if (!node || options.isReviewOnly.value || node.isLocked || getGenerationMediaType(node) === null) return
    cardSourceTargetNodeId.value = nodeId
    options.openResources(opener)
  }

  function clearCardSourceTarget() {
    cardSourceTargetNodeId.value = ''
  }

  async function attachCardSourceAsset(asset: ProjectAsset, nodeId = cardSourceTargetNodeId.value) {
    if (options.isReviewOnly.value) return false
    const target = canvasStore.findNodeById(nodeId)
    if (!target || target.isLocked || asset.project_id !== options.projectId.value) {
      options.actionError.value = '当前卡片或项目资产上下文已变化，请重试。'
      return false
    }
    const command = createCardSourceReferenceCommand(asset, target, canvasStore.nodes)
    if (!command) {
      options.actionError.value = '该素材不能作为当前卡片的来源。'
      return false
    }
    try {
      await canvasStore.dispatchCommand({ source: 'toolbar', command })
      canvasStore.selectNode(target.id)
      options.closeResources()
      return true
    } catch (error) {
      options.actionError.value = options.formatError(error)
      return false
    }
  }

  async function uploadCardSource(nodeId: string, file: File) {
    if (file.type.split('/')[0] !== 'image') {
      options.actionError.value = '当前生成卡片只支持图片来源。'
      return false
    }
    const asset = await options.uploadAsset(file, 'image')
    return asset ? attachCardSourceAsset(asset, nodeId) : false
  }

  return {
    attachCardSourceAsset, cardSourceTargetNodeId, clearCardSourceTarget,
    openCardSourceResources, uploadCardSource,
  }
}
