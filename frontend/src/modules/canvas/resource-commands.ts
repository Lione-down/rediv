import type { Asset } from '../../types/asset'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import { createRegistryNodeDraft, getDefaultConnectionPorts } from './node-registry'
import type { GenerationTask } from './project-resource-types'

export interface ResourceInsertionPoint {
  x: number
  y: number
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

export function createGeneratedResultCommand(
  sourceNode: CanvasNode,
  asset: Asset,
  task: GenerationTask,
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
