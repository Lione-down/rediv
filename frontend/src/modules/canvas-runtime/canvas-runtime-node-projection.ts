import { buildCanvasCardViewModel } from '../canvas/canvas-card-view-model'
import type { GenerationRuntimePresentation } from '../canvas/generation-runtime-presentation'
import type { CanvasNode } from '../../types/canvas'

export type RuntimeNodeKind =
  | 'text'
  | 'script'
  | 'image'
  | 'video'
  | 'video-composition'
  | 'audio'
  | 'asset'
  | 'result'
  | 'unknown'

export interface RuntimeNodeProjection {
  bodyLabel: string
  content: string
  identityMeta: string
  identityTitle: string
  kind: RuntimeNodeKind
  lifecycle: ReturnType<typeof buildCanvasCardViewModel>['lifecycle']
  inputPorts: Array<{ id: string; label: string }>
  inputPortCount: number
  inputPortId: string | null
  media:
    | { kind: 'image'; url: string; label: string }
    | { kind: 'video'; url: string; poster?: string; label: string }
    | { kind: 'placeholder'; label: string }
  node: CanvasNode
  outputPortCount: number
  outputPortId: string | null
  outputPorts: Array<{ id: string; label: string }>
  ownership: string
  phase: ReturnType<typeof buildCanvasCardViewModel>['state']['phase']
}

function readSubtype(node: CanvasNode) {
  return typeof node.contentData?.subtype === 'string'
    ? node.contentData.subtype.trim()
    : ''
}

function resolveKind(node: CanvasNode): RuntimeNodeKind {
  const subtype = readSubtype(node)
  if (node.type === 'script') return subtype === 'prompt' ? 'text' : 'script'
  if (node.type === 'note' || node.type === 'text') return 'text'
  if (node.type === 'asset') return 'asset'
  if (node.type === 'result') return 'result'
  if (node.type === 'image') return 'image'
  if (node.type === 'video') return 'video'
  if (node.type === 'generation') {
    if (subtype === 'image') return 'image'
    if (subtype === 'video') return 'video'
    if (subtype === 'video-composition') return 'video-composition'
    if (subtype === 'audio') return 'audio'
  }
  return 'unknown'
}

function resolveTypeLabel(node: CanvasNode, kind: RuntimeNodeKind) {
  if (kind === 'text') return '文本'
  if (kind === 'script') return '脚本'
  if (kind === 'image') return node.type === 'asset' ? '图片素材' : '图片生成'
  if (kind === 'video') return node.type === 'asset' ? '视频素材' : '视频生成'
  if (kind === 'video-composition') return '视频合成'
  if (kind === 'audio') return node.type === 'asset' ? '音频素材' : '音频生成'
  if (kind === 'result') {
    const subtype = readSubtype(node)
    if (subtype === 'video') return '视频结果'
    if (subtype === 'text') return '文本结果'
    return '图片结果'
  }
  return '兼容节点'
}

function placeholderLabel(kind: RuntimeNodeKind, ownership: string) {
  if (ownership === 'generated-result') return '历史结果尚未提供预览'
  if (kind === 'image') return '描述或连接你想生成的画面'
  if (kind === 'video') return '选择视频生成方式'
  if (kind === 'video-composition') return '连接片段以开始视频合成'
  if (kind === 'audio') return '当前没有兼容的音频模型'
  if (kind === 'script') return '打开结构化脚本工作流'
  if (kind === 'text') return '双击输入文本'
  return '内容尚未提供'
}

export function projectRuntimeNode(
  node: CanvasNode,
  runtimePresentation: GenerationRuntimePresentation | null = null,
): RuntimeNodeProjection {
  const viewModel = buildCanvasCardViewModel(node, { runtimePresentation })
  const kind = resolveKind(node)
  const typeLabel = resolveTypeLabel(node, kind)
  const media = viewModel.media?.kind === 'image'
    ? {
        kind: 'image' as const,
        url: viewModel.media.url,
        label: viewModel.media.label,
      }
    : viewModel.media?.kind === 'video'
      ? {
          kind: 'video' as const,
          url: viewModel.media.url,
          poster: viewModel.media.poster,
          label: viewModel.media.label,
        }
      : {
          kind: 'placeholder' as const,
          label: placeholderLabel(kind, viewModel.ownership),
        }

  return {
    bodyLabel: typeLabel,
    content: viewModel.content,
    identityMeta: node.title.trim() === typeLabel ? '' : typeLabel,
    identityTitle: node.title.trim() || typeLabel,
    inputPortCount: viewModel.inputPorts.length,
    inputPortId: viewModel.inputPorts[0]?.id ?? null,
    inputPorts: viewModel.inputPorts.map(({ id }) => ({ id, label: id })),
    kind,
    lifecycle: viewModel.lifecycle,
    media,
    node,
    outputPortCount: viewModel.outputPorts.length,
    outputPortId: viewModel.outputPorts[0]?.id ?? null,
    outputPorts: viewModel.outputPorts.map(({ id }) => ({ id, label: id })),
    ownership: viewModel.ownership,
    phase: viewModel.state.phase,
  }
}
