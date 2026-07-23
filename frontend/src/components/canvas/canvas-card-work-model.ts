import { resolveNodeDefinition } from '../../modules/canvas/node-registry'
import { resolveCanvasCardFamily } from '../../modules/canvas/canvas-card-view-model'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

export type CanvasCardFamily = 'text' | 'image' | 'video'
export type CanvasCardSourceChoice = 'local-upload' | 'project-asset'
export type CanvasCardWorkModeId =
  | 'direct-write'
  | 'text-to-image'
  | 'text-to-video'
  | 'image-to-image'
  | 'image-to-prompt'
  | 'image-upscale'
  | 'first-frame-video'
  | 'keyframes-video'
  | 'text-to-music'

export interface CanvasCardWorkMode {
  id: CanvasCardWorkModeId
  label: string
  requiresSource: boolean
}

export interface CanvasCardWorkModel {
  family: CanvasCardFamily | null
  modes: readonly CanvasCardWorkMode[]
  canChooseSource: boolean
  canSelectCanvasReference: boolean
  sourceChoices: readonly CanvasCardSourceChoice[]
  showsAttachedWorkSurface: boolean
  showsEmptyModeChooser: boolean
}

const textModes: readonly CanvasCardWorkMode[] = [
  { id: 'direct-write', label: '自己编写内容', requiresSource: false },
  { id: 'text-to-video', label: '文生视频', requiresSource: false },
  { id: 'image-to-prompt', label: '图片反推提示词', requiresSource: true },
  { id: 'text-to-music', label: '文字生音乐', requiresSource: false },
]

const imageModes: readonly CanvasCardWorkMode[] = [
  { id: 'text-to-image', label: '文生图', requiresSource: false },
  { id: 'image-to-image', label: '图生图', requiresSource: true },
  { id: 'image-upscale', label: '图片高清', requiresSource: true },
]

const videoModes: readonly CanvasCardWorkMode[] = [
  { id: 'text-to-video', label: '文生视频', requiresSource: false },
  { id: 'first-frame-video', label: '首帧生成视频', requiresSource: true },
  { id: 'keyframes-video', label: '首尾帧生成视频', requiresSource: true },
]

const sourceChoices: readonly CanvasCardSourceChoice[] = ['local-upload', 'project-asset']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function modesForFamily(family: CanvasCardFamily | null): readonly CanvasCardWorkMode[] {
  if (family === 'text') return textModes
  if (family === 'image') return imageModes
  if (family === 'video') return videoModes
  return []
}

export function resolveCanvasCardWorkModel(
  node: Pick<CanvasNode, 'type' | 'content' | 'contentData' | 'isLocked'>,
  options: { isReadOnly: boolean; isSelected: boolean },
): CanvasCardWorkModel {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported') {
    return {
      family: null,
      modes: [],
      canChooseSource: false,
      canSelectCanvasReference: false,
      sourceChoices: [],
      showsAttachedWorkSurface: false,
      showsEmptyModeChooser: false,
    }
  }

  const family = resolveCanvasCardFamily(node)
  const canMutate = !options.isReadOnly && !node.isLocked
  const isMediaFamily = family === 'image' || family === 'video'
  const generationParameters = node.contentData?.generation_parameters
  const imageParameters = isRecord(generationParameters) && isRecord(generationParameters.image)
    ? generationParameters.image
    : null
  const hasSpecializedGenerationWorkflow = Boolean(
    node.contentData?.generation_recipe_id || imageParameters?.operation,
  )
  const supportsCardGeneration = isMediaFamily && definition.capabilities.canGenerate && !hasSpecializedGenerationWorkflow
  const textContent = node.content ?? node.contentData?.text
  const isEmptyTextCard = family === 'text' && (typeof textContent !== 'string' || !textContent.trim())
  return {
    family,
    modes: modesForFamily(family),
    canChooseSource: canMutate && supportsCardGeneration,
    canSelectCanvasReference: canMutate && supportsCardGeneration,
    sourceChoices: canMutate && supportsCardGeneration ? sourceChoices : [],
    showsAttachedWorkSurface: canMutate && options.isSelected && supportsCardGeneration,
    showsEmptyModeChooser: canMutate && isEmptyTextCard,
  }
}

export function resolveCanvasCardProjectedResult(
  sourceNode: Pick<CanvasNode, 'id' | 'type' | 'contentData'>,
  nodes: readonly CanvasNode[],
  connections: readonly Pick<CanvasConnection, 'from' | 'to'>[],
): CanvasNode | null {
  const sourceDefinition = resolveNodeDefinition(sourceNode.type, sourceNode.contentData)
  if (sourceDefinition.kind === 'unsupported' || !sourceDefinition.capabilities.canGenerate) return null
  const sourceFamily = resolveCanvasCardFamily(sourceNode)
  if (sourceFamily !== 'image' && sourceFamily !== 'video') return null
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  for (let index = connections.length - 1; index >= 0; index -= 1) {
    const connection = connections[index]
    if (connection.from !== sourceNode.id) continue
    const result = nodesById.get(connection.to)
    if (!result || result.type !== 'result' || resolveCanvasCardFamily(result) !== sourceFamily) continue
    const url = result.contentData?.url ?? result.contentData?.preview_url ?? result.contentData?.thumbnail_url
    if (typeof url === 'string' && url.trim()) return result
  }
  return null
}
