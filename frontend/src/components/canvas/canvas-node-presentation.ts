import {
  isNodeGroupContainer,
  resolveNodeDefinition,
  type NodePortDefinition,
} from '../../modules/canvas/node-registry'
import type { CanvasNode } from '../../types/canvas'

export type CanvasNodeMediaPresentation =
  | { kind: 'image'; url: string; label: string }
  | { kind: 'placeholder'; label: string }

export interface CanvasNodePresentation {
  typeLabel: string
  content: string
  isUnsupported: boolean
  inputPorts: readonly NodePortDefinition[]
  outputPorts: readonly NodePortDefinition[]
  media: CanvasNodeMediaPresentation | null
}

export function isSupportedCanvasGroupNode(node: CanvasNode) {
  return isNodeGroupContainer(node)
}

function readString(content: Record<string, unknown> | undefined, key: string) {
  const value = content?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function getMediaPresentation(node: CanvasNode): CanvasNodeMediaPresentation | null {
  const subtype = readString(node.contentData, 'subtype')
  if (!['image', 'video', 'audio'].includes(subtype ?? '')) return null
  const role = node.type === 'result' ? '结果' : '素材'
  const label = subtype === 'image' ? `图片${role}` : subtype === 'video' ? `视频${role}` : '音频素材'
  const previewUrl = readString(node.contentData, 'preview_url') ?? readString(node.contentData, 'thumbnail_url')
  const assetUrl = readString(node.contentData, 'url')
  if (subtype === 'image' && assetUrl) return { kind: 'image', url: assetUrl, label }
  if (previewUrl) return { kind: 'image', url: previewUrl, label }
  return { kind: 'placeholder', label: `${label}暂未提供预览` }
}

export function buildCanvasNodePresentation(node: CanvasNode): CanvasNodePresentation {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') {
    return {
      typeLabel: `不支持的节点 · ${node.type}`,
      content: `节点类型 ${node.type} 暂不受支持，原始数据已保留。`,
      isUnsupported: true,
      inputPorts: [],
      outputPorts: [],
      media: null,
    }
  }
  return {
    typeLabel: definition.label,
    content: node.content ?? '',
    isUnsupported: false,
    inputPorts: definition.ports.filter((port) => port.direction === 'input'),
    outputPorts: definition.ports.filter((port) => port.direction === 'output'),
    media: definition.capabilities.canPreviewMedia ? getMediaPresentation(node) : null,
  }
}
