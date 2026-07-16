import { resolveNodeDefinition } from '../../modules/canvas/node-registry'
import { resolveVisualAssetRecipe } from '../../modules/canvas/visual-asset-recipes'
import type { GenerationRuntimePresentation } from '../../modules/canvas/generation-runtime-presentation'
import type { CanvasNode, CanvasNodeStatus } from '../../types/canvas'

export type CanvasAuthoringCardKind = 'script' | 'note' | 'generation'
export type CanvasAuthoringCardTone = 'progress' | 'success' | 'danger'

export interface CanvasAuthoringCardSlot {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasAuthoringCardPresentation {
  kind: CanvasAuthoringCardKind
  iconKey: string
  typeLabel: string
  title: string
  bodyPreview: string
  isLocked: boolean
  lifecycle: {
    tone: CanvasAuthoringCardTone
    label: string
    progressPercent: number | null
    isIndeterminate: boolean
  } | null
  slots: {
    header: CanvasAuthoringCardSlot
    body: CanvasAuthoringCardSlot
    status: CanvasAuthoringCardSlot | null
    progress: CanvasAuthoringCardSlot | null
  }
  visualHeight: number
}

const HEADER_HEIGHT = 40
const STATUS_HEIGHT = 30
const MAX_TITLE_LENGTH = 36
const MAX_BODY_LENGTH = 144

function bounded(value: string, limit: number) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1).trimEnd()}…`
}

function lifecycleFor(status: CanvasNodeStatus | undefined) {
  if (status === 'running') return { tone: 'progress', label: '运行中', progressPercent: null, isIndeterminate: true } as const
  if (status === 'success') return { tone: 'success', label: '已完成', progressPercent: 100, isIndeterminate: false } as const
  if (status === 'warning') return { tone: 'danger', label: '生成失败', progressPercent: null, isIndeterminate: false } as const
  return null
}

export function resolveCanvasAuthoringCardPresentation(
  node: CanvasNode,
  generationRuntime: GenerationRuntimePresentation | null = null,
): CanvasAuthoringCardPresentation | null {
  if (node.type !== 'script' && node.type !== 'note' && node.type !== 'generation') return null
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind !== 'canonical') return null

  const recipe = node.type === 'generation' ? resolveVisualAssetRecipe(node) : null
  const kind: CanvasAuthoringCardKind = node.type === 'script'
    ? 'script'
    : node.type === 'note' ? 'note' : 'generation'
  const lifecycle = kind === 'generation'
    ? generationRuntime
      ? {
          tone: generationRuntime.tone,
          label: generationRuntime.label,
          progressPercent: generationRuntime.progressPercent,
          isIndeterminate: generationRuntime.isIndeterminate,
        }
      : lifecycleFor(node.status)
    : null
  const visualHeight = kind === 'generation'
    ? 128
    : Math.min(node.height, (node.content ?? '').trim().length > 80 ? 150 : 120)
  const statusHeight = lifecycle ? STATUS_HEIGHT : 0
  const bodyHeight = visualHeight - HEADER_HEIGHT - statusHeight
  const emptyLabel = kind === 'note' ? '暂无备注' : kind === 'generation' ? '等待生成内容' : '暂无脚本内容'
  const rawBody = recipe?.description ?? node.content ?? ''

  return {
    kind,
    iconKey: definition.icon,
    typeLabel: definition.label,
    title: bounded(recipe?.title ?? node.title, MAX_TITLE_LENGTH),
    bodyPreview: bounded(rawBody, MAX_BODY_LENGTH) || emptyLabel,
    isLocked: Boolean(node.isLocked),
    lifecycle,
    slots: {
      header: { x: 0, y: 0, width: node.width, height: HEADER_HEIGHT },
      body: { x: 0, y: HEADER_HEIGHT, width: node.width, height: bodyHeight },
      status: lifecycle
        ? { x: 0, y: HEADER_HEIGHT + bodyHeight, width: node.width, height: STATUS_HEIGHT }
        : null,
      progress: lifecycle
        ? { x: 0, y: visualHeight - 3, width: node.width, height: 3 }
        : null,
    },
    visualHeight,
  }
}
