export type CanvasCardProductionInteractionState = 'editing' | 'composing' | 'submitting'

export function resolveCanvasCardProductionInteractionState(input: {
  hasInlineEditor: boolean
  hasAttachedComposer: boolean
  isSubmitting: boolean
}): CanvasCardProductionInteractionState | undefined {
  if (input.isSubmitting) return 'submitting'
  if (input.hasAttachedComposer) return 'composing'
  if (input.hasInlineEditor) return 'editing'
  return undefined
}
