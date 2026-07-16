import type { CanvasNode } from '../../types/canvas'
import {
  DEFAULT_STORYBOARD_GROUP_SETTINGS,
  isStoryboardGroupSettings,
  isStoryboardImageNode,
  resolveStoryboardGroup,
  type StoryboardGroupSettings,
} from './storyboard-group'

export interface CreateStoryboardGroupCommand {
  type: 'create-storyboard-group'
  nodeIds: string[]
  settings: StoryboardGroupSettings
}

export interface UpdateStoryboardGroupCommand {
  type: 'update-storyboard-group'
  groupId: string
  settings: StoryboardGroupSettings
}

export interface ReorderStoryboardGroupCommand {
  type: 'reorder-storyboard-group'
  groupId: string
  nodeId: string
  direction: -1 | 1
}

export interface ConvertStoryboardGroupCommand {
  type: 'convert-storyboard-group'
  groupId: string
}

function uniqueIds(ids: readonly string[]) {
  return [...new Set(ids.filter(Boolean))]
}

export function createCreateStoryboardGroupCommand(
  nodes: readonly CanvasNode[],
  nodeIds: readonly string[],
  settings: StoryboardGroupSettings = DEFAULT_STORYBOARD_GROUP_SETTINGS,
): CreateStoryboardGroupCommand | null {
  const orderedIds = uniqueIds(nodeIds)
  if (orderedIds.length < 2 || orderedIds.length > 25 || orderedIds.length !== nodeIds.length || !isStoryboardGroupSettings(settings)) return null
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  if (orderedIds.some((nodeId) => {
    const node = nodesById.get(nodeId)
    return !node || !isStoryboardImageNode(node, true)
  })) return null
  return { type: 'create-storyboard-group', nodeIds: orderedIds, settings: { ...settings } }
}

export function createUpdateStoryboardGroupCommand(
  nodes: readonly CanvasNode[],
  groupId: string,
  settings: StoryboardGroupSettings,
): UpdateStoryboardGroupCommand | null {
  const resolved = resolveStoryboardGroup(nodes, groupId)
  if (!resolved || resolved.group.isLocked || !isStoryboardGroupSettings(settings)) return null
  const current = resolved.content
  if (
    current.aspect_ratio === settings.aspect_ratio && current.columns === settings.columns &&
    current.show_numbers === settings.show_numbers
  ) return null
  return { type: 'update-storyboard-group', groupId, settings: { ...settings } }
}

export function createReorderStoryboardGroupCommand(
  nodes: readonly CanvasNode[],
  groupId: string,
  nodeId: string,
  direction: -1 | 1,
): ReorderStoryboardGroupCommand | null {
  const resolved = resolveStoryboardGroup(nodes, groupId)
  if (!resolved || resolved.group.isLocked || (direction !== -1 && direction !== 1)) return null
  const index = resolved.content.ordered_child_ids.indexOf(nodeId)
  if (index < 0 || index + direction < 0 || index + direction >= resolved.content.ordered_child_ids.length) return null
  return { type: 'reorder-storyboard-group', groupId, nodeId, direction }
}

export function createConvertStoryboardGroupCommand(
  nodes: readonly CanvasNode[],
  groupId: string,
): ConvertStoryboardGroupCommand | null {
  const resolved = resolveStoryboardGroup(nodes, groupId)
  return resolved && !resolved.group.isLocked ? { type: 'convert-storyboard-group', groupId } : null
}
