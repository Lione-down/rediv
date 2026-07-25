import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodePresentation, type CanvasNodeMediaPresentation } from './canvas-node-presentation'

export type CanvasNodeInteraction =
  | { kind: 'composer'; content: string; label: string }
  | { kind: 'media'; media: CanvasNodeMediaPresentation }
  | { kind: 'static' }

export function buildCanvasNodeInteraction(node: CanvasNode, options: {
  isDirectEditing?: boolean
  isReadOnly: boolean
  isSelected: boolean
}): CanvasNodeInteraction {
  const presentation = buildCanvasNodePresentation(node)
  const hasCanonicalContentContract = Number.isInteger(node.contentData?.serialization_version)
  if (presentation.media) return { kind: 'media', media: presentation.media }
  if (
    !options.isReadOnly && options.isSelected && options.isDirectEditing &&
    presentation.canEditContent && hasCanonicalContentContract && !node.isLocked
  ) {
    return { kind: 'composer', content: presentation.content, label: `编辑${node.title}内容` }
  }
  return { kind: 'static' }
}
