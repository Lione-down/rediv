import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { resolveCanvasMaterializedCardResult } from '../../components/canvas/canvas-materialized-card-projection'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import type { VideoReferenceMode, VideoResolution } from './generation-parameters'
import {
  parseWorkflowTemplateStoryLineage,
  type WorkflowTemplateStoryLineage,
} from './script-authoring'
import { findFirstUnoccupiedPosition } from './graph-placement'
import { createRegistryNodeDraft, getAuthoringConnectionPorts } from './node-registry'
import { resolveCanvasNodeLayoutSize } from './node-layout'

export type StoryShotBatchMediaType = 'image' | 'video'
export type StoryShotVideoMode = Extract<VideoReferenceMode, 'text-to-video' | 'image-to-video'>

export interface StoryShotBatchOptions {
  aspectRatio: string
  durationSeconds?: number
  imageSize?: string
  imageOutputCount?: 1 | 2 | 3 | 4
  mediaType: StoryShotBatchMediaType
  videoMode?: StoryShotVideoMode
  videoResolution?: VideoResolution
}

interface StoryRecord {
  [key: string]: unknown
}

interface StoryShot {
  id: string
  index: number
  imagePrompt: string
  title: string
  videoPrompt: string
}

interface ConfirmedStory {
  shots: StoryShot[]
  templateLineage: WorkflowTemplateStoryLineage | null
}

const IMAGE_RATIOS = new Set(['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9'])
const IMAGE_SIZES = new Set(['1K', '2K', '3K', '4K'])
const VIDEO_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4'])
const VIDEO_DURATIONS = new Set([3, 5, 10, 18])
const VIDEO_RESOLUTIONS = new Set<VideoResolution>(['480p', '720p', '1080p'])

function record(value: unknown): StoryRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as StoryRecord
    : null
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function sameTemplateLineage(
  left: WorkflowTemplateStoryLineage | null,
  right: WorkflowTemplateStoryLineage | null,
) {
  if (left === null || right === null) return left === right
  return left.contract_version === right.contract_version &&
    left.template_id === right.template_id &&
    left.template_version === right.template_version &&
    left.instance_id === right.instance_id &&
    left.instance_step_id === right.instance_step_id &&
    left.step_id === right.step_id &&
    left.script_node_id === right.script_node_id
}

function confirmedStory(source: CanvasNode): ConfirmedStory | null {
  if (
    source.type !== 'script' ||
    source.contentData?.subtype !== 'script' ||
    source.isLocked ||
    source.parentNodeId
  ) return null
  const production = record(source.contentData?.story_production)
  if (!production || production.source_node_id !== source.id || !Array.isArray(production.shots)) {
    return null
  }
  const shots = production.shots.flatMap((candidate, offset): StoryShot[] => {
    const shot = record(candidate)
    const locked = record(shot?.locked_fields)
    const editable = record(shot?.editable_fields)
    const id = text(shot?.shot_id)
    const index = Number(shot?.shot_number)
    const imagePrompt = text(editable?.image_prompt_zh) ||
      text(shot?.image_prompt) || text(shot?.visual_description)
    const videoPrompt = text(editable?.video_prompt_zh) ||
      text(shot?.video_prompt) || imagePrompt
    if (
      !shot || !id || !Number.isSafeInteger(index) || index !== offset + 1 ||
      locked?.user_confirmation !== true || locked?.prompt_confirmation !== true ||
      !imagePrompt || imagePrompt.length > 4_000 ||
      !videoPrompt || videoPrompt.length > 4_000
    ) return []
    return [{
      id,
      index,
      imagePrompt,
      title: `镜头 ${String(index).padStart(2, '0')}`,
      videoPrompt,
    }]
  })
  if (
    shots.length !== production.shots.length ||
    new Set(shots.map((shot) => shot.id)).size !== shots.length
  ) return null
  try {
    const sourceLineage = parseWorkflowTemplateStoryLineage(
      source.contentData?.workflow_template_lineage,
      source.id,
    )
    const productionLineage = parseWorkflowTemplateStoryLineage(
      production.template_lineage,
      source.id,
    )
    if (!sameTemplateLineage(sourceLineage, productionLineage)) return null
    return {
      shots,
      templateLineage: productionLineage,
    }
  } catch {
    return null
  }
}

function validOptions(options: StoryShotBatchOptions) {
  if (options.mediaType === 'image') {
    return IMAGE_RATIOS.has(options.aspectRatio) &&
      typeof options.imageSize === 'string' &&
      IMAGE_SIZES.has(options.imageSize) &&
      [1, 2, 3, 4].includes(options.imageOutputCount ?? 1)
  }
  return VIDEO_RATIOS.has(options.aspectRatio) &&
    typeof options.durationSeconds === 'number' &&
    VIDEO_DURATIONS.has(options.durationSeconds) &&
    typeof options.videoResolution === 'string' &&
    VIDEO_RESOLUTIONS.has(options.videoResolution) &&
    (options.videoMode === 'text-to-video' || options.videoMode === 'image-to-video')
}

function matchingImageResult(
  sourceNodeId: string,
  shotId: string,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
) {
  const matches = nodes.flatMap((node) => {
    if (
      node.type !== 'generation' ||
      node.contentData?.subtype !== 'image' ||
      node.contentData?.source_script_node_id !== sourceNodeId ||
      node.contentData?.shot_id !== shotId
    ) return []
    if (
      typeof node.contentData?.materialized_result_node_id === 'string' &&
      typeof node.contentData?.asset_id === 'string' &&
      node.contentData.asset_id.trim()
    ) return [node]
    const result = resolveCanvasMaterializedCardResult(node, nodes, connections)
    return result && typeof result.contentData?.asset_id === 'string' &&
      result.contentData.asset_id.trim()
      ? [result]
      : []
  })
  return matches.length === 1 ? matches[0] : null
}

export function resolveStoryShotSingleFrameIds(input: {
  sourceNode: CanvasNode
  nodes: readonly CanvasNode[]
  connections: readonly CanvasConnection[]
}) {
  const story = confirmedStory(input.sourceNode)
  if (!story) return new Set<string>()
  return new Set(story.shots.flatMap((shot) => (
    matchingImageResult(input.sourceNode.id, shot.id, input.nodes, input.connections)
      ? [shot.id]
      : []
  )))
}

export function createStoryShotGenerationCommand(input: {
  sourceNode: CanvasNode
  existingNodes: readonly CanvasNode[]
  connections: readonly CanvasConnection[]
  shotIds: readonly string[]
  options: StoryShotBatchOptions
  createId?: () => string
}): InsertGraphCommand | null {
  const story = confirmedStory(input.sourceNode)
  if (!story || !validOptions(input.options)) return null
  const shots = story.shots
  const selectedIds = new Set(input.shotIds)
  if (
    !selectedIds.size ||
    selectedIds.size !== input.shotIds.length ||
    input.existingNodes.find((node) => node.id === input.sourceNode.id) !== input.sourceNode
  ) return null
  const selected = shots.filter((shot) => selectedIds.has(shot.id))
  if (selected.length !== selectedIds.size) return null

  const createId = input.createId ?? createCanvasEntityId
  const occupied = [...input.existingNodes]
  const nodes: CanvasNode[] = []
  const connections: CanvasConnection[] = []
  const sourceSize = resolveCanvasNodeLayoutSize(input.sourceNode)
  for (const shot of selected) {
    const draft = createRegistryNodeDraft(
      'generation',
      input.options.mediaType,
      { x: input.sourceNode.x + sourceSize.width + 96, y: input.sourceNode.y },
    )
    const position = findFirstUnoccupiedPosition(draft, draft, occupied)
    const reference = input.options.mediaType === 'video' &&
      input.options.videoMode === 'image-to-video'
      ? matchingImageResult(
          input.sourceNode.id,
          shot.id,
          input.existingNodes,
          input.connections,
        )
      : null
    if (input.options.videoMode === 'image-to-video' && !reference) return null
    const node: CanvasNode = {
      id: createId(),
      ...draft,
      ...position,
      title: `${shot.title} · ${input.options.mediaType === 'image' ? '图片生成' : '视频生成'}`,
      content: input.options.mediaType === 'image' ? shot.imagePrompt : shot.videoPrompt,
      contentData: {
        ...draft.contentData,
        source_script_node_id: input.sourceNode.id,
        shot_id: shot.id,
        shot_index: shot.index,
        shot_title: shot.title,
        ...(story.templateLineage
          ? {
              template_lineage: {
                ...story.templateLineage,
                shot_id: shot.id,
              },
            }
          : {}),
        generation_parameters: input.options.mediaType === 'image'
          ? {
              schema_version: 1,
              image: {
                aspect_ratio: input.options.aspectRatio,
                size: input.options.imageSize,
                output_count: input.options.imageOutputCount ?? 1,
              },
            }
          : {
              schema_version: 1,
              video: {
                aspect_ratio: input.options.aspectRatio,
                duration_seconds: input.options.durationSeconds,
                resolution: input.options.videoResolution,
                reference_mode: input.options.videoMode,
                ...(reference ? { primary_reference_node_id: reference.id } : {}),
              },
            },
      },
    }
    nodes.push(node)
    occupied.push(node)
    if (reference) {
      const ports = getAuthoringConnectionPorts(reference, node)
      if (!ports) return null
      connections.push({
        id: createId(),
        from: reference.id,
        to: node.id,
        sourcePort: ports.sourcePort,
        targetPort: ports.targetPort,
        status: 'active',
        active: true,
        metadata: { input_order: 1 },
      })
    }
  }
  return { type: 'insert-graph', nodes, connections }
}
