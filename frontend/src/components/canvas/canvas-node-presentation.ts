import { isNodeGroupContainer, resolveNodeDefinition, type NodePortDefinition } from '../../modules/canvas/node-registry'
import {
  resolveCanvasNodeLayoutSize,
  resolveCanvasNodeMediaLayoutAspectRatio,
} from '../../modules/canvas/node-layout'
import type { CanvasNode } from '../../types/canvas'

export type CanvasNodeMediaPresentation =
  | { kind: 'image'; url: string; label: string; aspectRatio: number | null }
  | { kind: 'video'; url: string; poster?: string; label: string; aspectRatio: number | null }
  | { kind: 'placeholder'; label: string }

export type CanvasNodeVisualKind = 'text' | 'media' | 'generation' | 'result' | 'unknown'

export interface CanvasNodePresentation {
  typeLabel: string
  visualKind: CanvasNodeVisualKind
  content: string
  canEditContent: boolean
  isUnsupported: boolean
  inputPorts: readonly NodePortDefinition[]
  outputPorts: readonly NodePortDefinition[]
  media: CanvasNodeMediaPresentation | null
}

export function isSupportedCanvasGroupNode(node: CanvasNode) { return isNodeGroupContainer(node) }

function readString(content: Record<string, unknown> | undefined, key: string) {
  const value = content?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function readAspectRatio(content: Record<string, unknown> | undefined) {
  const direct = content?.aspect_ratio
  if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 0.1 && direct <= 10) return direct
  const width = content?.width
  const height = content?.height
  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    const ratio = width / height
    return Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10 ? ratio : null
  }
  return null
}

function getMediaPresentation(node: CanvasNode): CanvasNodeMediaPresentation | null {
  const subtype = readString(node.contentData, 'subtype')
  if (!['image', 'video', 'audio'].includes(subtype ?? '')) return null
  const role = node.type === 'result' ? '结果' : '素材'
  const label = subtype === 'image' ? `图片${role}` : subtype === 'video' ? `视频${role}` : '音频素材'
  const previewUrl = readString(node.contentData, 'preview_url') ?? readString(node.contentData, 'thumbnail_url')
  const assetUrl = readString(node.contentData, 'url')
  const aspectRatio = resolveCanvasNodeMediaLayoutAspectRatio(node) ?? readAspectRatio(node.contentData)
  if (subtype === 'image' && assetUrl) return { kind: 'image', url: assetUrl, label, aspectRatio }
  if (subtype === 'video' && assetUrl) return { kind: 'video', url: assetUrl, poster: previewUrl ?? undefined, label, aspectRatio }
  if (previewUrl) return { kind: 'image', url: previewUrl, label, aspectRatio }
  return { kind: 'placeholder', label: `${label}暂未提供预览` }
}

export function buildCanvasNodePresentation(node: CanvasNode): CanvasNodePresentation {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') {
    return { typeLabel: `不支持的节点 · ${node.type}`, visualKind: 'unknown', content: `节点类型 ${node.type} 暂不受支持，原始数据已保留。`, canEditContent: false, isUnsupported: true, inputPorts: [], outputPorts: [], media: null }
  }
  const media = definition.capabilities.canPreviewMedia ? getMediaPresentation(node) : null
  return {
    typeLabel: definition.label,
    visualKind: node.type === 'result' ? 'result' : media ? 'media' : node.type === 'generation' ? 'generation' : 'text',
    content: node.content ?? readString(node.contentData, 'text') ?? '',
    canEditContent: definition.capabilities.canEditContent,
    isUnsupported: false,
    inputPorts: definition.ports.filter((port) => port.direction === 'input'),
    outputPorts: definition.ports.filter((port) => port.direction === 'output'),
    media,
  }
}

export function canvasNodeVisualSize(node: CanvasNode) {
  return resolveCanvasNodeLayoutSize(node)
}
