import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import type { GenerationRuntimePresentation } from './generation-runtime-presentation'

export type CanvasStoryboardLane = 'text' | 'image' | 'video'
export type CanvasStoryboardStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'unavailable'

export interface CanvasStoryboardItem {
  lane: CanvasStoryboardLane
  nodeId: string
  groupId: string | null
  order: number
  title: string
  status: CanvasStoryboardStatus
}

export interface CanvasStoryboardProjectionInput {
  nodes: readonly CanvasNode[]
  connections: readonly CanvasConnection[]
  runtimePresentations?: ReadonlyMap<string, GenerationRuntimePresentation>
}

export interface StoryboardGroupContent {
  subtype: 'storyboard'
  serialization_version: 1
  storyboard_schema_version: 1
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:3'
  columns: 1 | 2 | 3 | 4 | 5
  show_numbers: boolean
  ordered_child_ids: string[]
}
