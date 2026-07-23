import type { CanvasNode } from '../../types/canvas'
import { isNodeMutationSupported, resolveNodeDefinition } from './node-registry'

export const MAX_SCRIPT_REFERENCE_ASSETS = 8

export interface UpdateScriptReferenceAssetsCommand {
  type: 'update-script-reference-assets'
  nodeId: string
  referenceAssetIds: string[]
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function readScriptReferenceAssetIds(node: CanvasNode | null | undefined) {
  if (!node || !Array.isArray(node.contentData?.reference_asset_ids)) return []
  return [...new Set(node.contentData.reference_asset_ids.flatMap((value) => {
    const assetId = stringValue(value)
    return assetId ? [assetId] : []
  }))].slice(0, MAX_SCRIPT_REFERENCE_ASSETS)
}

export function isScriptRoleReferenceCandidate(node: CanvasNode) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  return (
    (node.type === 'asset' || node.type === 'result') &&
    node.contentData?.subtype === 'image' &&
    definition.kind === 'canonical' &&
    Boolean(stringValue(node.contentData?.asset_id))
  )
}

export function createUpdateScriptReferenceAssetsCommand(
  nodes: readonly CanvasNode[],
  nodeId: string,
  referenceAssetIds: readonly string[],
): UpdateScriptReferenceAssetsCommand | null {
  const target = nodes.find((node) => node.id === nodeId)
  if (
    !target || target.type !== 'script' || target.contentData?.subtype !== 'script' ||
    target.isLocked || target.parentNodeId || !isNodeMutationSupported(target)
  ) return null

  const normalized = [...new Set(referenceAssetIds.flatMap((value) => {
    const assetId = stringValue(value)
    return assetId ? [assetId] : []
  }))]
  if (normalized.length > MAX_SCRIPT_REFERENCE_ASSETS) return null

  const eligibleIds = new Set(nodes.flatMap((node) => (
    isScriptRoleReferenceCandidate(node) ? [stringValue(node.contentData?.asset_id)] : []
  )))
  if (normalized.some((assetId) => !eligibleIds.has(assetId))) return null
  if (JSON.stringify(readScriptReferenceAssetIds(target)) === JSON.stringify(normalized)) return null
  return { type: 'update-script-reference-assets', nodeId, referenceAssetIds: normalized }
}

export function createAddScriptReferenceAssetCommand(
  nodes: readonly CanvasNode[],
  nodeId: string,
  sourceNodeId: string,
) {
  const target = nodes.find((node) => node.id === nodeId)
  const source = nodes.find((node) => node.id === sourceNodeId)
  if (!target || !source || !isScriptRoleReferenceCandidate(source)) return null
  const assetId = stringValue(source.contentData?.asset_id)
  const current = readScriptReferenceAssetIds(target)
  if (!assetId || current.includes(assetId) || current.length >= MAX_SCRIPT_REFERENCE_ASSETS) return null
  return createUpdateScriptReferenceAssetsCommand(nodes, nodeId, [...current, assetId])
}
