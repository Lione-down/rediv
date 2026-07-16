import type { Asset } from '../../types/asset'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import type { GenerationNodeParameters } from './generation-parameters'
import { findFirstUnoccupiedPosition } from './graph-placement'
import { createRegistryNodeDraft, getAuthoringConnectionPorts, getDefaultConnectionPorts, isNodeMutationSupported } from './node-registry'
import type { GenerationTask } from './project-resource-types'
import { VISUAL_ASSET_RECIPES, type VisualAssetRecipeId } from './visual-asset-recipes'

export interface ResourceInsertionPoint {
  x: number
  y: number
}

export type ResultBranchMediaType = 'image' | 'video'

export function canBranchFromImageResult(node: CanvasNode) {
  const assetId = node.contentData?.asset_id
  return node.type === 'result' && node.contentData?.subtype === 'image' &&
    typeof assetId === 'string' && Boolean(assetId.trim()) &&
    !node.isLocked && !node.parentNodeId && isNodeMutationSupported(node)
}

export function createResultGenerationBranchCommand(
  sourceNode: CanvasNode,
  mediaType: ResultBranchMediaType,
  existingNodes: readonly CanvasNode[] = [],
): InsertGraphCommand | null {
  if (!canBranchFromImageResult(sourceNode)) return null
  const draft = createRegistryNodeDraft('generation', mediaType, {
    x: sourceNode.x + sourceNode.width + 96,
    y: sourceNode.y,
  })
  const position = findFirstUnoccupiedPosition(draft, draft, existingNodes, [sourceNode.id])
  const generationNode: CanvasNode = { id: createCanvasEntityId(), ...draft, ...position }
  if (mediaType === 'video') {
    const parameters: GenerationNodeParameters = {
      schema_version: 1,
      video: {
        duration_seconds: 5,
        reference_mode: 'image-to-video',
        primary_reference_node_id: sourceNode.id,
      },
    }
    generationNode.contentData = {
      ...generationNode.contentData,
      generation_parameters: parameters,
    }
  }
  const ports = getAuthoringConnectionPorts(sourceNode, generationNode, 'out', 'media')
  if (!ports) return null
  return {
    type: 'insert-graph',
    nodes: [generationNode],
    connections: [{
      id: createCanvasEntityId(),
      from: sourceNode.id,
      to: generationNode.id,
      sourcePort: ports.sourcePort,
      targetPort: ports.targetPort,
      status: 'active',
      active: true,
      metadata: { input_order: 1 },
    }],
  }
}

export function createVisualAssetRecipeBranchCommand(
  sourceNode: CanvasNode,
  recipeId: VisualAssetRecipeId,
  existingNodes: readonly CanvasNode[] = [],
): InsertGraphCommand | null {
  if (!canBranchFromImageResult(sourceNode)) return null
  const recipe = VISUAL_ASSET_RECIPES[recipeId]
  const command = createResultGenerationBranchCommand(sourceNode, 'image', existingNodes)
  if (!command) return null
  const generationNode = command.nodes[0]
  generationNode.title = recipe.title
  generationNode.content = undefined
  generationNode.contentData = {
    ...generationNode.contentData,
    generation_recipe_id: recipe.id,
    generation_recipe_version: recipe.version,
  }
  return command
}

function assetTitle(asset: Asset) {
  if (asset.content_text?.trim()) return asset.content_text.trim()
  if (asset.source === 'generation') return asset.type === 'video' ? '视频生成结果' : '图片生成结果'
  if (asset.type === 'audio') return '音频素材'
  if (asset.type === 'video') return '视频素材'
  if (asset.type === 'image') return '图片素材'
  return '提示词素材'
}

export function createAssetInsertCommand(
  asset: Asset,
  position: ResourceInsertionPoint,
): InsertGraphCommand {
  const canonicalType = asset.type === 'prompt' ? 'script' : 'asset'
  const subtype = asset.type === 'prompt' ? 'prompt' : asset.type
  const draft = createRegistryNodeDraft(canonicalType, subtype, position)
  const node: CanvasNode = {
    id: createCanvasEntityId(),
    ...draft,
    title: assetTitle(asset),
    content: asset.content_text ?? undefined,
    contentData: {
      ...draft.contentData,
      asset_id: asset.id,
      project_id: asset.project_id,
      origin_canvas_id: asset.origin_canvas_id,
      source_task_id: asset.source_task_id,
      source_model: asset.source_model,
      url: asset.url,
    },
  }
  return { type: 'insert-graph', nodes: [node], connections: [] }
}

export function createVideoFrameAssetInsertCommand(
  sourceNode: CanvasNode,
  asset: Asset,
  captureTimeSeconds: number,
  aspectRatio: number,
  existingNodes: readonly CanvasNode[] = [],
): InsertGraphCommand {
  if (asset.type !== 'image' || !asset.url) throw new Error('视频帧资产必须是可用图片。')
  if (!Number.isFinite(captureTimeSeconds) || captureTimeSeconds < 0) throw new Error('视频帧时间无效。')
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) throw new Error('视频帧比例无效。')
  const draft = createRegistryNodeDraft('asset', 'image', {
    x: sourceNode.x + sourceNode.width + 96,
    y: sourceNode.y,
  })
  const position = findFirstUnoccupiedPosition(draft, draft, existingNodes, [sourceNode.id])
  const node: CanvasNode = {
    id: createCanvasEntityId(),
    ...draft,
    ...position,
    title: `视频帧 ${captureTimeSeconds.toFixed(2)}s`,
    contentData: {
      ...draft.contentData,
      asset_id: asset.id,
      project_id: asset.project_id,
      origin_canvas_id: asset.origin_canvas_id,
      source_video_node_id: sourceNode.id,
      source_video_time_seconds: captureTimeSeconds,
      url: asset.url,
      aspect_ratio: aspectRatio,
    },
  }
  return { type: 'insert-graph', nodes: [node], connections: [] }
}

export function createGeneratedResultCommand(
  sourceNode: CanvasNode,
  asset: Asset,
  task: GenerationTask,
  existingNodes: readonly CanvasNode[] = [],
): InsertGraphCommand {
  const subtype = task.media_type
  const draft = createRegistryNodeDraft('result', subtype, {
    x: sourceNode.x + sourceNode.width + 96,
    y: sourceNode.y,
  })
  const resultNode: CanvasNode = {
    id: createCanvasEntityId(),
    ...draft,
    title: assetTitle(asset),
    status: 'success',
    content: asset.content_text ?? undefined,
    contentData: {
      ...draft.contentData,
      asset_id: asset.id,
      project_id: asset.project_id,
      origin_canvas_id: asset.origin_canvas_id,
      source_task_id: task.id,
      source_model: asset.source_model,
      url: asset.url,
    },
  }
  Object.assign(resultNode, findFirstUnoccupiedPosition(resultNode, resultNode, existingNodes, [sourceNode.id]))
  const ports = getDefaultConnectionPorts(sourceNode, resultNode, 'out', 'in')
  if (!ports) throw new Error('生成节点与结果节点端口不兼容。')
  const connection: CanvasConnection = {
    id: createCanvasEntityId(),
    from: sourceNode.id,
    to: resultNode.id,
    sourcePort: ports.sourcePort,
    targetPort: ports.targetPort,
    status: 'active',
    active: true,
    metadata: { source_task_id: task.id },
  }
  return { type: 'insert-graph', nodes: [resultNode], connections: [connection] }
}

export function hasResultForTask(nodes: readonly CanvasNode[], taskId: string) {
  return nodes.some((node) => node.type === 'result' && node.contentData?.source_task_id === taskId)
}
