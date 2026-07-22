import type { CanvasNodePosition } from '../../../modules/canvas/canvas-commands'
import type { Point, ViewportInsets } from '../canvas-geometry'
import type { GenerationRuntimePresentationGetter } from './use-canvas-generation-runtime-renderer'

export interface CanvasStageDragState {
  pointerId: number | null
  startWorldPoint: Point
  origins: CanvasNodePosition[]
  moved: boolean
}

export interface CanvasStagePanState {
  pointerId: number | null
  startClientX: number
  startClientY: number
  originX: number
  originY: number
}

export interface CanvasStageDraftConnectionState {
  originNodeId: string
  originPort: string
  direction: 'input' | 'output'
  pointerId: number | null
  currentX: number
  currentY: number
  startX: number
  startY: number
  moved: boolean
}

export interface CanvasStageMarqueeState {
  pointerId: number | null
  start: Point
  current: Point
  additive: boolean
}

export interface NativePointerLikeEvent extends MouseEvent { pointerId?: number }
export interface LeaferPointerEvent { target?: unknown; origin?: NativePointerLikeEvent }

export interface CanvasStageOptions {
  getGenerationRuntimePresentations?: GenerationRuntimePresentationGetter
  getMediaToolbarNodeId?: () => string | null
  getViewportInsets?: () => Partial<ViewportInsets>
  isProfessionalActionsBlocked?: () => boolean
  isReadOnly?: () => boolean
  onGraphPanelClosed?: () => void
  onMaterializedCardPointerSelect?: () => void
  onOpenContextSurface?: () => void
  onOpenProfessionalActions?: (opener: HTMLElement) => void
}
