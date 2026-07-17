import { expect, test } from '@playwright/test'
import {
  createImageGridSplitInsertCommand,
  createProfessionalNodeInsertCommand,
} from '../../src/modules/canvas/professional-action-commands'
import { resolveImageGridCrops } from '../../src/modules/canvas/image-grid-split'
import type { ProfessionalCanvasActionIntent } from '../../src/modules/canvas/professional-action-registry'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'

const PROJECT_ID = 'project-actions'
const CANVAS_ID = 'canvas-actions'
const USER_ID = 'user-actions'
const SOURCE_URL = 'https://media.revid.test/grid-source.svg'

function sourceAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'asset-source', user_id: USER_ID, project_id: PROJECT_ID,
    origin_canvas_id: 'canvas-origin', canvas_node_id: null, type: 'image', url: SOURCE_URL,
    content_text: '城市夜景', source: 'upload', source_model: null, source_task_id: null,
    status: 'active', created_at: '', updated_at: '', ...overrides,
  }
}

function sourceNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'node-source', type: 'asset', title: '城市夜景', x: 100, y: 100, width: 320, height: 240,
    contentData: {
      subtype: 'image', serialization_version: 1, asset_id: 'asset-source', project_id: PROJECT_ID,
      origin_canvas_id: 'canvas-origin', url: SOURCE_URL, width: 320, height: 240,
    },
    ...overrides,
  }
}

function cropAsset(index: number, overrides: Partial<Asset> = {}): Asset {
  return {
    id: `asset-crop-${index}`, user_id: USER_ID, project_id: PROJECT_ID,
    origin_canvas_id: CANVAS_ID, canvas_node_id: null, type: 'image',
    url: `https://media.revid.test/crop-${index}.png`, content_text: null, source: 'upload',
    source_model: null, source_task_id: null, status: 'active', created_at: '', updated_at: '',
    ...overrides,
  }
}

function commandInput() {
  const crops = resolveImageGridCrops(103, 107, 4)
  return {
    projectId: PROJECT_ID,
    canvasId: CANVAS_ID,
    sourceNode: sourceNode(),
    sourceAsset: sourceAsset(),
    uploadedCrops: crops.map((crop) => ({ asset: cropAsset(crop.index), crop })),
    existingNodes: [sourceNode()],
  }
}

test('grid command creates exact ordered canonical assets in one collision-safe insert graph', () => {
  const input = commandInput()
  const sourceSnapshot = structuredClone(input.sourceNode)
  const command = createImageGridSplitInsertCommand(input)
  expect(command).not.toBeNull()
  expect(command!.type).toBe('insert-graph')
  expect(command!.connections).toEqual([])
  expect(command!.nodes).toHaveLength(4)
  expect(new Set(command!.nodes.map((node) => node.id)).size).toBe(4)
  expect(command!.nodes.map((node) => [node.x, node.y])).toEqual([
    [516, 100], [860, 100], [516, 444], [860, 444],
  ])
  expect(command!.nodes.map((node) => node.title)).toEqual([
    '城市夜景 · 图块 01/04', '城市夜景 · 图块 02/04',
    '城市夜景 · 图块 03/04', '城市夜景 · 图块 04/04',
  ])
  expect(command!.nodes[0]).toMatchObject({
    type: 'asset', width: 320, height: 240,
    contentData: {
      subtype: 'image', serialization_version: 1,
      asset_id: 'asset-crop-1', project_id: PROJECT_ID, origin_canvas_id: CANVAS_ID,
      url: 'https://media.revid.test/crop-1.png', source_asset_id: 'asset-source',
      image_grid_split_schema_version: 1, image_grid_split_count: 4, image_grid_split_index: 1,
      image_grid_split_row: 0, image_grid_split_column: 0,
      image_grid_source_width: 103, image_grid_source_height: 107,
      image_grid_crop_x: 0, image_grid_crop_y: 0,
      image_grid_crop_width: 51, image_grid_crop_height: 53,
      aspect_ratio: 51 / 53,
    },
  })
  expect(input.sourceNode).toEqual(sourceSnapshot)
})
test('grid command moves the whole output block when its first slot is occupied', () => {
  const input = commandInput()
  input.existingNodes.push({
    id: 'blocker', type: 'note', title: 'blocker', x: 516, y: 100, width: 664, height: 664,
    contentData: { subtype: 'annotation', serialization_version: 1 },
  })
  const command = createImageGridSplitInsertCommand(input)!
  expect(command.nodes.map((node) => [node.x, node.y])).toEqual([
    [516, 788], [860, 788], [516, 1132], [860, 1132],
  ])
})

test('grid command fails closed for stale source, crop sequence, ownership, and upload results', () => {
  const invalidInputs = [
    { ...commandInput(), sourceNode: sourceNode({ isLocked: true }) },
    { ...commandInput(), sourceNode: sourceNode({ parentNodeId: 'group-a' }) },
    { ...commandInput(), sourceNode: sourceNode({ contentData: { ...sourceNode().contentData, serialization_version: 2 } }) },
    { ...commandInput(), sourceAsset: sourceAsset({ source: 'generation' }) },
    { ...commandInput(), uploadedCrops: commandInput().uploadedCrops.slice(0, 3) },
    { ...commandInput(), uploadedCrops: commandInput().uploadedCrops.map((item, index) => index === 1 ? { ...item, crop: { ...item.crop, index: 1 } } : item) },
    { ...commandInput(), uploadedCrops: commandInput().uploadedCrops.map((item, index) => index === 1 ? { ...item, asset: cropAsset(1) } : item) },
    { ...commandInput(), uploadedCrops: commandInput().uploadedCrops.map((item, index) => index === 1 ? { ...item, asset: cropAsset(2, { project_id: 'foreign' }) } : item) },
    { ...commandInput(), uploadedCrops: commandInput().uploadedCrops.map((item, index) => index === 1 ? { ...item, asset: cropAsset(2, { origin_canvas_id: 'other-canvas' }) } : item) },
    { ...commandInput(), uploadedCrops: commandInput().uploadedCrops.map((item, index) => index === 1 ? { ...item, asset: cropAsset(2, { url: null }) } : item) },
  ]
  for (const invalid of invalidInputs) expect(createImageGridSplitInsertCommand(invalid)).toBeNull()
})

test('create-node actions become one collision-aware insert graph and other intents are rejected', () => {
  const intent: ProfessionalCanvasActionIntent = { type: 'create-node', nodeType: 'script', subtype: 'script' }
  const command = createProfessionalNodeInsertCommand(intent, { x: 600, y: 300 }, [])
  expect(command).toEqual({
    type: 'insert-graph',
    nodes: [expect.objectContaining({ type: 'script', title: '脚本', x: 600, y: 300 })],
    connections: [],
  })
  expect(createProfessionalNodeInsertCommand({ type: 'split-image-grid', outputCount: 4 }, { x: 0, y: 0 }, [])).toBeNull()
})
