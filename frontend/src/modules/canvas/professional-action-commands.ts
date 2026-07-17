import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import { findFirstUnoccupiedPosition } from './graph-placement'
import { resolveImageGridCrops, type ImageGridCrop } from './image-grid-split'
import { resolveCanvasNodeLayoutSize } from './node-layout'
import { createRegistryNodeDraft, resolveNodeDefinition } from './node-registry'
import type { ProfessionalCanvasActionIntent } from './professional-action-registry'

export interface UploadedImageGridCrop {
  asset: Asset
  crop: ImageGridCrop
}

export interface ImageGridSplitInsertInput {
  projectId: string
  canvasId: string
  sourceNode: CanvasNode
  sourceAsset: Asset
  uploadedCrops: readonly UploadedImageGridCrop[]
  existingNodes: readonly CanvasNode[]
}

const OUTPUT_NODE_SIZE = 320
const OUTPUT_NODE_GAP = 24

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function isSourceValid(input: ImageGridSplitInsertInput) {
  const definition = resolveNodeDefinition(input.sourceNode.type, input.sourceNode.contentData)
  return input.sourceNode.type === 'asset' && definition.kind === 'canonical' &&
    input.sourceNode.contentData?.subtype === 'image' &&
    !input.sourceNode.isLocked && !input.sourceNode.parentNodeId &&
    readString(input.sourceNode.contentData?.asset_id) === input.sourceAsset.id &&
    readString(input.sourceNode.contentData?.project_id) === input.projectId &&
    readString(input.sourceNode.contentData?.url) === input.sourceAsset.url &&
    input.sourceAsset.project_id === input.projectId && input.sourceAsset.type === 'image' &&
    input.sourceAsset.source === 'upload' && input.sourceAsset.status === 'active' &&
    Boolean(input.sourceAsset.url)
}

function cropsMatch(left: ImageGridCrop, right: ImageGridCrop) {
  return left.outputCount === right.outputCount && left.gridSize === right.gridSize &&
    left.index === right.index && left.row === right.row && left.column === right.column &&
    left.x === right.x && left.y === right.y && left.width === right.width &&
    left.height === right.height && left.sourceWidth === right.sourceWidth &&
    left.sourceHeight === right.sourceHeight
}

function validatedCrops(input: ImageGridSplitInsertInput) {
  const first = input.uploadedCrops[0]
  if (!first) return null
  let expected: ImageGridCrop[]
  try {
    expected = resolveImageGridCrops(
      first.crop.sourceWidth,
      first.crop.sourceHeight,
      first.crop.outputCount,
    )
  } catch {
    return null
  }
  if (expected.length !== input.uploadedCrops.length) return null
  const assetIds = new Set<string>()
  for (let index = 0; index < expected.length; index += 1) {
    const uploaded = input.uploadedCrops[index]
    if (!uploaded || !cropsMatch(uploaded.crop, expected[index])) return null
    const asset = uploaded.asset
    if (
      assetIds.has(asset.id) || asset.id === input.sourceAsset.id ||
      asset.project_id !== input.projectId || asset.origin_canvas_id !== input.canvasId ||
      asset.user_id !== input.sourceAsset.user_id || asset.type !== 'image' ||
      asset.source !== 'upload' || asset.status !== 'active' || !asset.url
    ) return null
    assetIds.add(asset.id)
  }
  return expected
}

export function createImageGridSplitInsertCommand(
  input: ImageGridSplitInsertInput,
): InsertGraphCommand | null {
  if (!input.projectId.trim() || !input.canvasId.trim() || !isSourceValid(input)) return null
  const crops = validatedCrops(input)
  if (!crops) return null
  const gridSize = crops[0].gridSize
  const blockSize = gridSize * OUTPUT_NODE_SIZE + (gridSize - 1) * OUTPUT_NODE_GAP
  const sourceSize = resolveCanvasNodeLayoutSize(input.sourceNode)
  const anchor = findFirstUnoccupiedPosition(
    { x: Math.round(input.sourceNode.x + sourceSize.width + 96), y: input.sourceNode.y },
    { width: blockSize, height: blockSize },
    input.existingNodes,
    [input.sourceNode.id],
  )
  const totalDigits = Math.max(2, String(crops.length).length)
  const nodes = input.uploadedCrops.map(({ asset, crop }) => {
    const draft = createRegistryNodeDraft('asset', 'image', {
      x: anchor.x + crop.column * (OUTPUT_NODE_SIZE + OUTPUT_NODE_GAP),
      y: anchor.y + crop.row * (OUTPUT_NODE_SIZE + OUTPUT_NODE_GAP),
    })
    return {
      id: createCanvasEntityId(),
      ...draft,
      title: `${input.sourceNode.title} · 图块 ${String(crop.index).padStart(totalDigits, '0')}/${String(crops.length).padStart(totalDigits, '0')}`,
      contentData: {
        ...draft.contentData,
        asset_id: asset.id,
        project_id: asset.project_id,
        origin_canvas_id: asset.origin_canvas_id,
        url: asset.url,
        source_asset_id: input.sourceAsset.id,
        image_grid_split_schema_version: 1,
        image_grid_split_count: crop.outputCount,
        image_grid_split_index: crop.index,
        image_grid_split_row: crop.row,
        image_grid_split_column: crop.column,
        image_grid_source_width: crop.sourceWidth,
        image_grid_source_height: crop.sourceHeight,
        image_grid_crop_x: crop.x,
        image_grid_crop_y: crop.y,
        image_grid_crop_width: crop.width,
        image_grid_crop_height: crop.height,
        aspect_ratio: crop.width / crop.height,
      },
    }
  })
  return { type: 'insert-graph', nodes, connections: [] }
}

export function createProfessionalNodeInsertCommand(
  intent: ProfessionalCanvasActionIntent,
  position: { x: number; y: number },
  existingNodes: readonly CanvasNode[],
): InsertGraphCommand | null {
  if (intent.type !== 'create-node') return null
  const draft = createRegistryNodeDraft(intent.nodeType, intent.subtype, position)
  const resolvedPosition = findFirstUnoccupiedPosition(position, draft, existingNodes)
  return {
    type: 'insert-graph',
    nodes: [{ id: createCanvasEntityId(), ...draft, ...resolvedPosition }],
    connections: [],
  }
}
