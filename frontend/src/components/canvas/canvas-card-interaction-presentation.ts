import type { CanvasNodeBodyKind } from './canvas-node-presentation'

export type CanvasCardLifecycleTone = 'none' | 'progress' | 'danger'
export type CanvasCardInteractionState =
  | 'idle'
  | 'hover'
  | 'focus'
  | 'selected'
  | 'compatible-drag'
  | 'locked'
  | 'readonly'
  | 'lifecycle-progress'
  | 'lifecycle-danger'

export type CanvasCardOutlineTone = 'subtle' | 'focus' | 'selected' | 'compatible' | 'disabled' | 'warning' | 'danger'
export type CanvasCardShadowTone = 'none' | 'selected' | 'warning' | 'danger'

export interface CanvasCardInteractionInput {
  bodyKind: CanvasNodeBodyKind
  isCompatibleDrag: boolean
  isFocused: boolean
  isHovered: boolean
  isLocked: boolean
  isReadOnly: boolean
  isSelected: boolean
  lifecycleTone: CanvasCardLifecycleTone
  reducedMotion: boolean
}

export interface CanvasCardInteractionPresentation {
  cornerRadius: number
  outlineTone: CanvasCardOutlineTone
  outlineWidth: number
  portOpacity: number
  portsVisible: boolean
  scale: number
  shadowTone: CanvasCardShadowTone
  state: CanvasCardInteractionState
  transitionDurationMs: number
  translateY: number
}

export function resolveCanvasCardInteractionPresentation(
  input: CanvasCardInteractionInput,
): CanvasCardInteractionPresentation {
  const isDisabled = input.isLocked || input.isReadOnly
  const hasDisclosedPorts = input.isCompatibleDrag || input.isFocused || input.isHovered || input.isSelected
  const lifecycleState = input.lifecycleTone === 'progress'
    ? 'lifecycle-progress'
    : input.lifecycleTone === 'danger' ? 'lifecycle-danger' : null
  const state: CanvasCardInteractionState = input.isLocked
    ? 'locked'
    : input.isReadOnly
      ? 'readonly'
      : lifecycleState
        ?? (input.isCompatibleDrag
          ? 'compatible-drag'
          : input.isSelected
            ? 'selected'
            : input.isFocused
              ? 'focus'
              : input.isHovered ? 'hover' : 'idle')
  const outlineTone: CanvasCardOutlineTone = isDisabled
    ? 'disabled'
    : input.lifecycleTone === 'progress'
      ? 'warning'
      : input.lifecycleTone === 'danger'
        ? 'danger'
        : input.isCompatibleDrag
          ? 'compatible'
          : input.isSelected
            ? 'selected'
            : input.isFocused ? 'focus' : 'subtle'
  const shadowTone: CanvasCardShadowTone = isDisabled
    ? 'none'
    : input.lifecycleTone === 'progress'
      ? 'warning'
      : input.lifecycleTone === 'danger'
        ? 'danger'
        : input.isSelected ? 'selected' : 'none'
  return {
    cornerRadius: 12,
    outlineTone,
    outlineWidth: input.isSelected && !isDisabled ? 1.5 : 1,
    portOpacity: isDisabled ? 0 : hasDisclosedPorts ? 1 : 0.16,
    portsVisible: !isDisabled,
    scale: 1,
    shadowTone,
    state,
    transitionDurationMs: input.reducedMotion ? 0 : 150,
    translateY: 0,
  }
}
