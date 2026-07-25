import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { resolveCanvasCardProjectedResult } from './canvas-card-work-model'

export const MATERIALIZED_RESULT_NODE_ID = 'materialized_result_node_id'

export interface CanvasMaterializedCardProjection {
  nodes: CanvasNode[]
  connections: CanvasConnection[]
  hiddenNodeIds: Set<string>
  projectedResultBySourceId: Map<string, CanvasNode>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasSpecializedGenerationWorkflow(node: CanvasNode) {
  const parameters = node.contentData?.generation_parameters
  const image = isRecord(parameters) && isRecord(parameters.image) ? parameters.image : null
  return Boolean(node.contentData?.generation_recipe_id || image?.operation)
}

function hasSameCardGenerationResult(node: CanvasNode) {
  const assetId = node.contentData?.asset_id
  const resultAssetId = node.contentData?.result_asset_id
  return (
    node.type === 'generation' &&
    typeof assetId === 'string' &&
    assetId.trim() !== '' &&
    assetId === resultAssetId &&
    typeof node.contentData?.last_generation_job_id === 'string' &&
    node.contentData.last_generation_job_id.trim() !== '' &&
    typeof node.contentData?.url === 'string' &&
    node.contentData.url.trim() !== ''
  )
}

export function resolveCanvasMaterializedCardResult(
  source: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
) {
  if (
    source.type !== 'generation' ||
    hasSpecializedGenerationWorkflow(source) ||
    hasSameCardGenerationResult(source)
  ) return null
  const materializedTaskId = source.contentData?.result_materialized_task_id
  if (typeof materializedTaskId !== 'string' || !materializedTaskId.trim()) return null
  const result = resolveCanvasCardProjectedResult(source, nodes, connections)
  return result?.contentData?.source_task_id === materializedTaskId ? result : null
}

export function isMaterializedCardProjection(node: Pick<CanvasNode, 'contentData'>) {
  return typeof node.contentData?.[MATERIALIZED_RESULT_NODE_ID] === 'string'
}

function projectSourceNode(source: CanvasNode, result: CanvasNode): CanvasNode {
  return {
    ...source,
    width: result.width,
    height: result.height,
    contentData: {
      ...source.contentData,
      ...result.contentData,
      title: source.contentData?.title ?? source.title,
      text: source.contentData?.text ?? source.content,
      [MATERIALIZED_RESULT_NODE_ID]: result.id,
    },
  }
}

export function projectCanvasMaterializedCardFamilies(
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
  selectedNodeIds: readonly string[],
): CanvasMaterializedCardProjection {
  const selectedIds = new Set(selectedNodeIds)
  const projectedResultBySourceId = new Map<string, CanvasNode>()
  const hiddenNodeIds = new Set<string>()

  for (const source of nodes) {
    const result = resolveCanvasMaterializedCardResult(source, nodes, connections)
    if (!result || selectedIds.has(result.id)) continue
    projectedResultBySourceId.set(source.id, result)
    hiddenNodeIds.add(result.id)
  }

  const resultToSourceId = new Map(
    [...projectedResultBySourceId].map(([sourceId, result]) => [result.id, sourceId]),
  )
  const projectedNodes = nodes.flatMap((node) => {
    if (hiddenNodeIds.has(node.id)) return []
    const result = projectedResultBySourceId.get(node.id)
    return [result ? projectSourceNode(node, result) : node]
  })
  const projectedConnections = connections.flatMap((connection) => {
    const from = resultToSourceId.get(connection.from) ?? connection.from
    const to = resultToSourceId.get(connection.to) ?? connection.to
    return from === to ? [] : [{ ...connection, from, to }]
  })

  return {
    nodes: projectedNodes,
    connections: projectedConnections,
    hiddenNodeIds,
    projectedResultBySourceId,
  }
}
