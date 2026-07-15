import type { ComputedRef, Ref } from 'vue'
import { createVideoFrameAssetInsertCommand } from '../../../modules/canvas/resource-commands'
import type { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import type { useCanvasStore } from '../../../store/canvas'

interface VideoFrameCaptureOptions {
  actionError: Ref<string>
  canvasId: ComputedRef<string>
  canvasStore: ReturnType<typeof useCanvasStore>
  formatError: (error: unknown) => string
  isReviewOnly: Ref<boolean>
  isUploading: Ref<boolean>
  projectId: ComputedRef<string>
  resourceStore: ReturnType<typeof useProjectResourceStore>
}

export function createVideoFrameCaptureAction(options: VideoFrameCaptureOptions) {
  return async (nodeId: string, file: File, timeSeconds: number, aspectRatio: number) => {
    if (options.isReviewOnly.value || options.isUploading.value) return null
    options.actionError.value = ''
    const expectedProjectId = options.projectId.value
    const expectedCanvasId = options.canvasId.value
    const sourceNode = options.canvasStore.findNodeById(nodeId)
    if (!sourceNode || sourceNode.isLocked || sourceNode.contentData?.subtype !== 'video') {
      options.actionError.value = '当前视频节点已不可用，请重新选择。'
      return null
    }
    options.isUploading.value = true
    try {
      const asset = await options.resourceStore.uploadAsset(expectedProjectId, expectedCanvasId, file, 'image')
      if (
        options.projectId.value !== expectedProjectId || options.canvasId.value !== expectedCanvasId ||
        options.canvasStore.activeProjectId !== expectedProjectId || options.canvasStore.activeCanvasId !== expectedCanvasId ||
        !options.canvasStore.findNodeById(nodeId)
      ) throw new Error('Canvas 操作上下文已变化，请重试。')
      const command = createVideoFrameAssetInsertCommand(sourceNode, asset, timeSeconds, aspectRatio, options.canvasStore.nodes)
      await options.canvasStore.dispatchCommand({ source: 'toolbar', command })
      const insertedNodeId = command.nodes[0].id
      options.canvasStore.selectNode(insertedNodeId)
      return insertedNodeId
    } catch (error) {
      options.actionError.value = options.formatError(error)
      return null
    } finally {
      options.isUploading.value = false
    }
  }
}
