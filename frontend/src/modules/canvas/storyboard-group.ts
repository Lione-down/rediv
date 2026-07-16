import { resolveCanvasNodeLayoutSize } from './node-layout'
import { resolveNodeDefinition } from './node-registry'
import type { CanvasNode } from '../../types/canvas'
import type { StoryboardGroupContent } from './storyboard-types'

export type StoryboardGroupSettings = Pick<
  StoryboardGroupContent,
  'aspect_ratio' | 'columns' | 'show_numbers'
>

export const DEFAULT_STORYBOARD_GROUP_SETTINGS: StoryboardGroupSettings = {
  aspect_ratio: '16:9',
  columns: 2,
  show_numbers: true,
}

export const STORYBOARD_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3'] as const
const STORYBOARD_RATIO_VALUES: Record<StoryboardGroupContent['aspect_ratio'], number> = {
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '1:1': 1,
  '4:3': 4 / 3,
}
const STORYBOARD_PADDING = 24
const STORYBOARD_HEADER_HEIGHT = 44
const STORYBOARD_GAP = 24
const STORYBOARD_MIN_CELL_WIDTH = 240

export function isStoryboardGroupSettings(value: StoryboardGroupSettings) {
  return STORYBOARD_ASPECT_RATIOS.includes(value.aspect_ratio) &&
    Number.isInteger(value.columns) && value.columns >= 1 && value.columns <= 5 &&
    typeof value.show_numbers === 'boolean'
}

export function isStoryboardImageNode(node: CanvasNode, requireUngrouped = false) {
  if (
    node.isLocked || (requireUngrouped && node.parentNodeId) ||
    (node.type !== 'asset' && node.type !== 'result') || node.contentData?.subtype !== 'image'
  ) return false
  return resolveNodeDefinition(node.type, node.contentData).kind === 'canonical'
}

export function createStoryboardGroupContent(
  orderedChildIds: readonly string[],
  settings: StoryboardGroupSettings = DEFAULT_STORYBOARD_GROUP_SETTINGS,
): StoryboardGroupContent {
  return {
    subtype: 'storyboard',
    serialization_version: 1,
    storyboard_schema_version: 1,
    aspect_ratio: settings.aspect_ratio,
    columns: settings.columns,
    show_numbers: settings.show_numbers,
    ordered_child_ids: [...orderedChildIds],
  }
}

export function readStoryboardGroupContent(
  group: CanvasNode,
  children: readonly CanvasNode[],
): StoryboardGroupContent | null {
  const content = group.contentData
  const orderedChildIds = content?.ordered_child_ids
  if (
    group.type !== 'group' || content?.subtype !== 'storyboard' ||
    content.serialization_version !== 1 || content.storyboard_schema_version !== 1 ||
    !STORYBOARD_ASPECT_RATIOS.includes(content.aspect_ratio as StoryboardGroupContent['aspect_ratio']) ||
    !Number.isInteger(content.columns) || Number(content.columns) < 1 || Number(content.columns) > 5 ||
    typeof content.show_numbers !== 'boolean' || !Array.isArray(orderedChildIds) ||
    orderedChildIds.length < 2 || orderedChildIds.length > 25 || orderedChildIds.length !== children.length ||
    orderedChildIds.some((id) => typeof id !== 'string') ||
    new Set(orderedChildIds).size !== orderedChildIds.length ||
    children.some((child) => child.parentNodeId !== group.id || !isStoryboardImageNode(child))
  ) return null

  const childIds = new Set(children.map((child) => child.id))
  if (orderedChildIds.some((id) => !childIds.has(id))) return null
  return content as unknown as StoryboardGroupContent
}

export function resolveStoryboardGroup(nodes: readonly CanvasNode[], groupId: string) {
  const group = nodes.find((node) => node.id === groupId)
  if (!group) return null
  const children = nodes.filter((node) => node.parentNodeId === groupId)
  const content = readStoryboardGroupContent(group, children)
  return content ? { group, children, content } : null
}

export function resolveStoryboardGroupForNode(nodes: readonly CanvasNode[], nodeId: string) {
  const node = nodes.find((candidate) => candidate.id === nodeId)
  if (!node) return null
  return resolveStoryboardGroup(nodes, node.type === 'group' ? node.id : (node.parentNodeId ?? ''))
}

export function resolveStoryboardGroupLayout(
  children: readonly CanvasNode[],
  content: StoryboardGroupContent,
  anchor: { x: number; y: number },
) {
  const childrenById = new Map(children.map((child) => [child.id, child]))
  const ordered = content.ordered_child_ids.flatMap((id) => {
    const child = childrenById.get(id)
    return child ? [{ child, size: resolveCanvasNodeLayoutSize(child) }] : []
  })
  const columnCount = Math.max(1, Math.min(content.columns, ordered.length || 1))
  const cellWidth = Math.max(STORYBOARD_MIN_CELL_WIDTH, ...ordered.map(({ size }) => size.width))
  const frameHeight = cellWidth / STORYBOARD_RATIO_VALUES[content.aspect_ratio]
  const rows = Array.from({ length: Math.ceil(ordered.length / columnCount) }, (_, rowIndex) => (
    ordered.slice(rowIndex * columnCount, (rowIndex + 1) * columnCount)
  ))
  const rowHeights = rows.map((row) => Math.max(frameHeight, ...row.map(({ size }) => size.height)))
  const childPositions = new Map<string, { x: number; y: number }>()
  let rowTop = anchor.y + STORYBOARD_HEADER_HEIGHT + STORYBOARD_PADDING
  rows.forEach((row, rowIndex) => {
    row.forEach(({ child, size }, columnIndex) => {
      childPositions.set(child.id, {
        x: anchor.x + STORYBOARD_PADDING + columnIndex * (cellWidth + STORYBOARD_GAP) + (cellWidth - size.width) / 2,
        y: rowTop + (rowHeights[rowIndex] - size.height) / 2,
      })
    })
    rowTop += rowHeights[rowIndex] + STORYBOARD_GAP
  })
  return {
    group: {
      x: anchor.x,
      y: anchor.y,
      width: STORYBOARD_PADDING * 2 + columnCount * cellWidth + (columnCount - 1) * STORYBOARD_GAP,
      height: STORYBOARD_HEADER_HEIGHT + STORYBOARD_PADDING * 2 +
        rowHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, rowHeights.length - 1) * STORYBOARD_GAP,
    },
    childPositions,
  }
}

export function resolveNewStoryboardGroupAnchor(children: readonly CanvasNode[]) {
  const left = Math.min(...children.map((child) => child.x))
  const top = Math.min(...children.map((child) => child.y))
  return { x: left - STORYBOARD_PADDING, y: top - STORYBOARD_HEADER_HEIGHT - STORYBOARD_PADDING }
}
