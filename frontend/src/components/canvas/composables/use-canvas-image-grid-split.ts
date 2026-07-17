import type { ComputedRef, Ref } from 'vue'
import { createImageGridSplitInsertCommand, type UploadedImageGridCrop } from '../../../modules/canvas/professional-action-commands'
import {
  resolveProjectImageSplitTarget,
  type ImageGridOutputCount,
  type ProfessionalCanvasActionContext,
} from '../../../modules/canvas/professional-action-registry'
import { openImageGridCropSession, type ImageGridCropSession } from '../../../modules/canvas/image-grid-split'
import type { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import type { useCanvasStore } from '../../../store/canvas'

interface CanvasImageGridSplitOptions {
  actionError: Ref<string>
  canvasId: ComputedRef<string>
  canvasStore: ReturnType<typeof useCanvasStore>
  formatError: (error: unknown) => string
  isReviewOnly: Ref<boolean>
  isUploading: Ref<boolean>
  projectId: ComputedRef<string>
  resourceStore: ReturnType<typeof useProjectResourceStore>
}

export function createCanvasImageGridSplitAction(options: CanvasImageGridSplitOptions) {
  function actionContext(
    expectedProjectId: string,
    expectedCanvasId: string,
    expectedUserId: string,
  ): ProfessionalCanvasActionContext {
    return {
      assets: options.resourceStore.assets,
      canvasId: expectedCanvasId,
      canvasReady: Boolean(
        options.canvasStore.hasLoaded && options.resourceStore.hasLoaded &&
        options.canvasStore.activeProjectId === expectedProjectId &&
        options.canvasStore.activeCanvasId === expectedCanvasId &&
        options.resourceStore.projectId === expectedProjectId
      ),
      isBusy: false,
      isReadOnly: options.isReviewOnly.value,
      isWorkflowView: true,
      projectId: expectedProjectId,
      selectedNodes: options.canvasStore.selectedNodes,
      userId: expectedUserId,
    }
  }

  function currentTarget(
    expectedProjectId: string,
    expectedCanvasId: string,
    expectedUserId: string,
    expectedNodeId: string,
    expectedAssetId: string,
  ) {
    if (
      options.projectId.value !== expectedProjectId || options.canvasId.value !== expectedCanvasId ||
      options.isReviewOnly.value
    ) throw new Error('Canvas 操作上下文已变化，请重试。')
    const context = actionContext(expectedProjectId, expectedCanvasId, expectedUserId)
    if (!context.canvasReady) throw new Error('Canvas 操作上下文已变化，请重试。')
    const target = resolveProjectImageSplitTarget(context)
    if (target?.node.id !== expectedNodeId || target.asset.id !== expectedAssetId) {
      throw new Error('所选项目图片已变化，请重新选择。')
    }
    return target
  }

  return async (outputCount: ImageGridOutputCount) => {
    if (options.isReviewOnly.value || options.isUploading.value) return null
    options.actionError.value = ''
    const expectedProjectId = options.projectId.value
    const expectedCanvasId = options.canvasId.value
    const selectedNode = options.canvasStore.selectedNodes.length === 1
      ? options.canvasStore.selectedNodes[0]
      : null
    const selectedAssetId = typeof selectedNode?.contentData?.asset_id === 'string'
      ? selectedNode.contentData.asset_id
      : ''
    const selectedAsset = options.resourceStore.assets.find((asset) => asset.id === selectedAssetId)
    const expectedUserId = selectedAsset?.user_id ?? ''
    let session: ImageGridCropSession | null = null
    options.isUploading.value = true
    try {
      const initialTarget = currentTarget(
        expectedProjectId,
        expectedCanvasId,
        expectedUserId,
        selectedNode?.id ?? '',
        selectedAssetId,
      )
      session = await openImageGridCropSession(initialTarget.asset.url!, outputCount)
      const uploadedCrops: UploadedImageGridCrop[] = []
      for (const crop of session.crops) {
        currentTarget(expectedProjectId, expectedCanvasId, expectedUserId, initialTarget.node.id, initialTarget.asset.id)
        const file = await session.createFile(crop)
        currentTarget(expectedProjectId, expectedCanvasId, expectedUserId, initialTarget.node.id, initialTarget.asset.id)
        const asset = await options.resourceStore.uploadAsset(
          expectedProjectId,
          expectedCanvasId,
          file,
          'image',
        )
        if (
          asset.project_id !== expectedProjectId || asset.origin_canvas_id !== expectedCanvasId ||
          asset.user_id !== expectedUserId || asset.type !== 'image' || asset.source !== 'upload' ||
          asset.status !== 'active' || !asset.url
        ) throw new Error('上传后的图片素材上下文不匹配。')
        currentTarget(expectedProjectId, expectedCanvasId, expectedUserId, initialTarget.node.id, initialTarget.asset.id)
        uploadedCrops.push({ asset, crop })
      }
      const finalTarget = currentTarget(
        expectedProjectId,
        expectedCanvasId,
        expectedUserId,
        initialTarget.node.id,
        initialTarget.asset.id,
      )
      const command = createImageGridSplitInsertCommand({
        projectId: expectedProjectId,
        canvasId: expectedCanvasId,
        sourceNode: finalTarget.node,
        sourceAsset: finalTarget.asset,
        uploadedCrops,
        existingNodes: options.canvasStore.nodes,
      })
      if (!command) throw new Error('无法创建图片切片节点，请刷新后重试。')
      await options.canvasStore.dispatchCommand({ source: 'toolbar', command })
      return command.nodes.map((node) => node.id)
    } catch (error) {
      options.actionError.value = options.formatError(error)
      return null
    } finally {
      session?.close()
      options.isUploading.value = false
    }
  }
}
