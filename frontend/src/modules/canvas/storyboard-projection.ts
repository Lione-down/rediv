import { buildCanvasNodePresentation } from '../../components/canvas/canvas-node-presentation'
import type { CanvasNode } from '../../types/canvas'
import {
  getGenerationMediaType,
  getPersistedGenerationStatus,
  resolveNodeDefinition,
} from './node-registry'
import type {
  CanvasStoryboardItem,
  CanvasStoryboardLane,
  CanvasStoryboardProjectionInput,
  CanvasStoryboardStatus,
  StoryboardGroupContent,
} from './storyboard-types'

export type {
  CanvasStoryboardItem,
  CanvasStoryboardLane,
  CanvasStoryboardProjectionInput,
  CanvasStoryboardStatus,
  StoryboardGroupContent,
} from './storyboard-types'

const STORYBOARD_LANES: readonly CanvasStoryboardLane[] = ['text', 'image', 'video']
const STORYBOARD_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3'])

interface ProjectionCandidate {
  anchorDocumentOrder: number
  anchorX: number
  anchorY: number
  groupId: string | null
  groupOrder: number
  lane: CanvasStoryboardLane
  node: CanvasNode
  nodeDocumentOrder: number
  status: CanvasStoryboardStatus
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function resolveLane(node: CanvasNode): CanvasStoryboardLane | null {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') return null
  const subtype = readString(node.contentData?.subtype)
  if (node.type === 'script' || node.type === 'note' || node.type === 'text') return 'text'
  if (node.type === 'result' && subtype === 'text') return 'text'
  const generationMediaType = getGenerationMediaType(node)
  if (generationMediaType) return generationMediaType
  if (node.type === 'image') return 'image'
  if (node.type === 'video') return 'video'
  if ((node.type === 'asset' || node.type === 'result') && (subtype === 'image' || subtype === 'video')) {
    return subtype
  }
  return null
}

function runtimeStatus(phase: string): CanvasStoryboardStatus | null {
  if (phase === 'submitting' || phase === 'queued') return 'queued'
  if (phase === 'running') return 'running'
  if (phase === 'succeeded') return 'succeeded'
  if (phase === 'failed' || phase === 'timed_out') return 'failed'
  return null
}

function nodeStatus(status: CanvasNode['status']): CanvasStoryboardStatus | null {
  if (status === 'running') return 'running'
  if (status === 'success') return 'succeeded'
  if (status === 'warning') return 'failed'
  return null
}

function hasLegacyMedia(node: CanvasNode) {
  return Boolean(
    readString(node.contentData?.url) ??
    readString(node.contentData?.preview_url) ??
    readString(node.contentData?.thumbnail_url),
  )
}

function resolveStatus(
  node: CanvasNode,
  lane: CanvasStoryboardLane,
  runtimePresentations: CanvasStoryboardProjectionInput['runtimePresentations'],
): CanvasStoryboardStatus {
  const runtime = runtimePresentations?.get(node.id)
  if (runtime) return runtimeStatus(runtime.phase) ?? 'draft'

  const persisted = getPersistedGenerationStatus(node.contentData ?? {})
  if (persisted) return runtimeStatus(persisted) ?? 'draft'

  const status = nodeStatus(node.status)
  const isMediaNode = lane !== 'text' && node.type !== 'generation'
  if (!isMediaNode) return status ?? 'draft'

  const media = buildCanvasNodePresentation(node).media
  const hasMedia = media?.kind === 'image' || media?.kind === 'video' || hasLegacyMedia(node)
  if (!hasMedia) return 'unavailable'
  return status ?? 'succeeded'
}

function isCanonicalStoryboardImage(node: CanvasNode) {
  if (node.isLocked || (node.type !== 'asset' && node.type !== 'result')) return false
  return node.contentData?.subtype === 'image' &&
    resolveNodeDefinition(node.type, node.contentData).kind === 'canonical'
}

function readStoryboardGroupContent(
  group: CanvasNode,
  children: readonly CanvasNode[],
): StoryboardGroupContent | null {
  const content = group.contentData
  const orderedChildIds = content?.ordered_child_ids
  if (
    group.type !== 'group' || content?.subtype !== 'storyboard' ||
    content.serialization_version !== 1 || content.storyboard_schema_version !== 1 ||
    !STORYBOARD_RATIOS.has(String(content.aspect_ratio)) ||
    !Number.isInteger(content.columns) || Number(content.columns) < 1 || Number(content.columns) > 5 ||
    typeof content.show_numbers !== 'boolean' || !Array.isArray(orderedChildIds) ||
    orderedChildIds.length < 2 || orderedChildIds.length > 25 || orderedChildIds.length !== children.length ||
    orderedChildIds.some((id) => typeof id !== 'string') ||
    new Set(orderedChildIds).size !== orderedChildIds.length ||
    children.some((child) => !isCanonicalStoryboardImage(child))
  ) return null

  const childIds = new Set(children.map((child) => child.id))
  if (orderedChildIds.some((id) => !childIds.has(id))) return null
  return content as unknown as StoryboardGroupContent
}

function compareCandidates(left: ProjectionCandidate, right: ProjectionCandidate) {
  return left.anchorY - right.anchorY || left.anchorX - right.anchorX ||
    left.anchorDocumentOrder - right.anchorDocumentOrder || left.groupOrder - right.groupOrder ||
    left.nodeDocumentOrder - right.nodeDocumentOrder
}

export function projectCanvasStoryboard({
  nodes,
  connections,
  runtimePresentations,
}: CanvasStoryboardProjectionInput): CanvasStoryboardItem[] {
  void connections
  const documentOrder = new Map(nodes.map((node, index) => [node.id, index]))
  const childrenByGroupId = new Map<string, CanvasNode[]>()
  for (const node of nodes) {
    if (!node.parentNodeId) continue
    const children = childrenByGroupId.get(node.parentNodeId) ?? []
    children.push(node)
    childrenByGroupId.set(node.parentNodeId, children)
  }

  const validGroups = new Map<string, { content: StoryboardGroupContent; group: CanvasNode }>()
  for (const group of nodes) {
    const content = readStoryboardGroupContent(group, childrenByGroupId.get(group.id) ?? [])
    if (content) validGroups.set(group.id, { content, group })
  }

  const candidates = nodes.flatMap((node): ProjectionCandidate[] => {
    const lane = resolveLane(node)
    if (!lane) return []
    const storyboardGroup = node.parentNodeId ? validGroups.get(node.parentNodeId) : undefined
    return [{
      anchorDocumentOrder: storyboardGroup ? (documentOrder.get(storyboardGroup.group.id) ?? 0) : (documentOrder.get(node.id) ?? 0),
      anchorX: storyboardGroup?.group.x ?? node.x,
      anchorY: storyboardGroup?.group.y ?? node.y,
      groupId: storyboardGroup?.group.id ?? null,
      groupOrder: storyboardGroup ? storyboardGroup.content.ordered_child_ids.indexOf(node.id) : 0,
      lane,
      node,
      nodeDocumentOrder: documentOrder.get(node.id) ?? 0,
      status: resolveStatus(node, lane, runtimePresentations),
    }]
  })

  return STORYBOARD_LANES.flatMap((lane) => candidates
    .filter((candidate) => candidate.lane === lane)
    .sort(compareCandidates)
    .map((candidate, index) => ({
      lane,
      nodeId: candidate.node.id,
      groupId: candidate.groupId,
      order: index + 1,
      title: candidate.node.title,
      status: candidate.status,
    })))
}
