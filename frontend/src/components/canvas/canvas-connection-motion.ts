export const CANVAS_CONNECTION_FLOW_SEGMENT_COUNT = 3
export const CANVAS_CONNECTION_FLOW_PATH_LENGTH = 1
export const CANVAS_CONNECTION_FLOW_DASH_PATTERN = '0.08 0.253333'

export type CanvasConnectionMotionReason = 'draft' | 'selected' | 'provenance'

export interface CanvasConnectionMotionState {
  isDraft?: boolean
  isIncluded?: boolean
  isProvenance?: boolean
  isSelected?: boolean
}

export function resolveCanvasConnectionMotion(
  state: CanvasConnectionMotionState,
): CanvasConnectionMotionReason | null {
  if (state.isDraft) return 'draft'
  if (state.isSelected) return 'selected'
  if (state.isProvenance && state.isIncluded !== false) return 'provenance'
  return null
}
