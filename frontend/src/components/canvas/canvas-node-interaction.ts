import type { CanvasNode } from '../../types/canvas'
import { buildCanvasNodePresentation, type CanvasNodeMediaPresentation } from './canvas-node-presentation'

export type CanvasNodeInteraction =
  | { kind: 'editor'; content: string; label: string }
  | { kind: 'media'; media: CanvasNodeMediaPresentation }
  | { kind: 'static' }

export function buildCanvasNodeInteraction(node: CanvasNode, options: { isReadOnly: boolean; isSelected: boolean }): CanvasNodeInteraction {
  const presentation = buildCanvasNodePresentation(node)
  const hasCanonicalContentContract = Number.isInteger(node.contentData?.serialization_version)
  if (!options.isReadOnly && options.isSelected && presentation.canEditContent && hasCanonicalContentContract && !node.isLocked) {
    return { kind: 'editor', content: presentation.content, label: `编辑${node.title}内容` }
  }
  if (presentation.media) return { kind: 'media', media: presentation.media }
  return { kind: 'static' }
}
