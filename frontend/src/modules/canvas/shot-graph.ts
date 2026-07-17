import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import { findFirstUnoccupiedPosition } from './graph-placement'
import { resolveCanvasNodeLayoutSize } from './node-layout'
import { createRegistryNodeDraft, getAuthoringConnectionPorts, resolveNodeDefinition } from './node-registry'
import { parseShotSchemaDocument, type ShotSchemaDocument } from './shot-schema'
import {
  createShotStoryboardGroupContent,
  resolveStoryboardGroupLayout,
  type StoryboardGroupSettings,
} from './storyboard-group'

export interface ShotGraphInsertInput {
  sourceNode: CanvasNode
  schema: ShotSchemaDocument
  existingNodes: readonly CanvasNode[]
}

const GRID_GAP = 24
const SECTION_GAP = 72

function sourceText(node: CanvasNode) {
  const value = node.content ?? node.contentData?.text
  return typeof value === 'string' ? value.trim() : ''
}

function validSource(node: CanvasNode) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const text = sourceText(node)
  return node.type === 'script' && definition.kind === 'canonical' &&
    node.contentData?.subtype === 'script' && !node.isLocked && !node.parentNodeId &&
    Boolean(text) && text.length <= 12000
}

function sameSource(left: CanvasNode, right: CanvasNode) {
  return left.id === right.id && left.type === right.type && left.title === right.title &&
    left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height &&
    left.isLocked === right.isLocked && left.parentNodeId === right.parentNodeId &&
    left.content === right.content &&
    JSON.stringify(left.contentData ?? null) === JSON.stringify(right.contentData ?? null)
}

function connect(source: CanvasNode, target: CanvasNode, inputOrder: number): CanvasConnection | null {
  const ports = getAuthoringConnectionPorts(source, target)
  if (!ports || ports.targetPort !== 'prompt') return null
  return {
    id: createCanvasEntityId(),
    from: source.id,
    to: target.id,
    sourcePort: ports.sourcePort,
    targetPort: ports.targetPort,
    status: 'active',
    active: true,
    metadata: { input_order: inputOrder },
  }
}

export function createShotGraphInsertCommand(input: ShotGraphInsertInput): InsertGraphCommand | null {
  let schema: ShotSchemaDocument
  try {
    schema = parseShotSchemaDocument(input.schema)
  } catch {
    return null
  }
  const currentSource = input.existingNodes.find((node) => node.id === input.sourceNode.id)
  if (
    !currentSource || !validSource(input.sourceNode) || !validSource(currentSource) ||
    !sameSource(input.sourceNode, currentSource) || schema.source_script_node_id !== currentSource.id
  ) return null

  const columns = Math.min(5, Math.ceil(Math.sqrt(schema.shot_count))) as StoryboardGroupSettings['columns']
  const groupId = createCanvasEntityId()
  const promptNodes: CanvasNode[] = []
  const generationNodes: CanvasNode[] = []

  for (const shot of schema.shots) {
    const promptDraft = createRegistryNodeDraft('script', 'prompt', { x: 0, y: 0 })
    promptNodes.push({
      id: createCanvasEntityId(),
      ...promptDraft,
      title: shot.title,
      content: shot.image_prompt,
      contentData: {
        ...promptDraft.contentData,
        text: shot.image_prompt,
        shot_schema_version: 1,
        shot_id: shot.shot_id,
        shot_index: shot.index,
        shot_title: shot.title,
        shot_narrative: shot.narrative,
      },
    })
    const generationDraft = createRegistryNodeDraft('generation', 'image', { x: 0, y: 0 })
    generationNodes.push({
      id: createCanvasEntityId(),
      ...generationDraft,
      title: `${shot.title} · 图片生成`,
      parentNodeId: groupId,
      contentData: {
        ...generationDraft.contentData,
        shot_schema_version: 1,
        shot_id: shot.shot_id,
        shot_index: shot.index,
        shot_title: shot.title,
        generation_parameters: {
          schema_version: 1,
          image: { aspect_ratio: schema.aspect_ratio },
        },
      },
    })
  }

  const settings: StoryboardGroupSettings = {
    aspect_ratio: schema.aspect_ratio,
    columns,
    show_numbers: true,
  }
  const groupContent = createShotStoryboardGroupContent(
    generationNodes.map((node) => node.id),
    settings,
  )
  const preliminaryLayout = resolveStoryboardGroupLayout(generationNodes, groupContent, { x: 0, y: 0 })
  const promptSize = resolveCanvasNodeLayoutSize(promptNodes[0])
  const promptRows = Math.ceil(promptNodes.length / columns)
  const promptGridWidth = columns * promptSize.width + (columns - 1) * GRID_GAP
  const promptGridHeight = promptRows * promptSize.height + (promptRows - 1) * GRID_GAP
  const blockSize = {
    width: Math.max(promptGridWidth, preliminaryLayout.group.width),
    height: promptGridHeight + SECTION_GAP + preliminaryLayout.group.height,
  }
  const sourceSize = resolveCanvasNodeLayoutSize(currentSource)
  const anchor = findFirstUnoccupiedPosition(
    { x: currentSource.x + sourceSize.width + 96, y: currentSource.y },
    blockSize,
    input.existingNodes,
    [currentSource.id],
  )
  promptNodes.forEach((node, offset) => {
    node.x = anchor.x + (offset % columns) * (promptSize.width + GRID_GAP)
    node.y = anchor.y + Math.floor(offset / columns) * (promptSize.height + GRID_GAP)
  })
  const layout = resolveStoryboardGroupLayout(generationNodes, groupContent, {
    x: anchor.x,
    y: anchor.y + promptGridHeight + SECTION_GAP,
  })
  generationNodes.forEach((node) => Object.assign(node, layout.childPositions.get(node.id)))
  const groupDraft = createRegistryNodeDraft('group', 'storyboard', layout.group)
  const group: CanvasNode = {
    id: groupId,
    ...groupDraft,
    ...layout.group,
    title: '分镜计划',
    contentData: { ...groupContent },
    zIndex: Math.min(...generationNodes.map((node) => node.zIndex ?? 0)) - 1,
  }

  const connections: CanvasConnection[] = []
  generationNodes.forEach((generation, offset) => {
    const sourceConnection = connect(currentSource, generation, 1)
    const shotConnection = connect(promptNodes[offset], generation, 2)
    if (sourceConnection && shotConnection) connections.push(sourceConnection, shotConnection)
  })
  if (connections.length !== schema.shot_count * 2) return null
  return {
    type: 'insert-graph',
    nodes: [...promptNodes, ...generationNodes, group],
    connections,
  }
}
