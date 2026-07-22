export const CANVAS_MEDIA_TOOLBAR_WIDTH_PX = 900
export const CANVAS_MEDIA_TOOLBAR_HEIGHT_PX = 50
export const CANVAS_MEDIA_TOOLBAR_ABOVE_GAP_PX = 26
export const CANVAS_MEDIA_TOOLBAR_BELOW_GAP_PX = 8
export const CANVAS_MEDIA_TOOLBAR_MIN_MEDIA_HEADER_OFFSET_PX = 24
export const CANVAS_MEDIA_TOOLBAR_SAFE_MARGIN_PX = 12

interface CanvasMediaToolbarHorizontalOptions {
  insetLeft?: number
  insetRight?: number
  nodeLeft: number
  nodeWidth: number
  viewportWidth: number
}

export interface CanvasMediaToolbarHorizontalPlacement {
  left: number
  width: number
}

interface CanvasMediaToolbarVerticalOptions {
  composerHeight?: number
  composerTop?: number
  insetBottom?: number
  insetTop?: number
  nodeHeight: number
  nodeTop: number
  viewportHeight: number
}

export interface CanvasMediaToolbarVerticalPlacement {
  placement: 'above' | 'after-composer' | 'below-media' | 'safe-bottom'
  top: number
}

export function resolveCanvasMediaToolbarHorizontalPlacement(
  options: CanvasMediaToolbarHorizontalOptions,
): CanvasMediaToolbarHorizontalPlacement {
  const safeLeft = Math.max(0, options.insetLeft ?? 0) + CANVAS_MEDIA_TOOLBAR_SAFE_MARGIN_PX
  const safeRight = options.viewportWidth - Math.max(0, options.insetRight ?? 0) - CANVAS_MEDIA_TOOLBAR_SAFE_MARGIN_PX
  const width = Math.min(CANVAS_MEDIA_TOOLBAR_WIDTH_PX, Math.max(0, safeRight - safeLeft))
  const desiredLeft = options.nodeLeft + options.nodeWidth / 2 - width / 2
  return {
    left: Math.min(Math.max(desiredLeft, safeLeft), Math.max(safeLeft, safeRight - width)),
    width,
  }
}

export function resolveCanvasMediaToolbarVerticalPlacement(
  options: CanvasMediaToolbarVerticalOptions,
): CanvasMediaToolbarVerticalPlacement | null {
  const safeTop = Math.max(
    0,
    Math.max(0, options.insetTop ?? 0) -
      CANVAS_MEDIA_TOOLBAR_ABOVE_GAP_PX - CANVAS_MEDIA_TOOLBAR_SAFE_MARGIN_PX,
  )
  const safeBottom = options.viewportHeight - Math.max(0, options.insetBottom ?? 0) +
    CANVAS_MEDIA_TOOLBAR_SAFE_MARGIN_PX
  const idealAboveTop = options.nodeTop - CANVAS_MEDIA_TOOLBAR_HEIGHT_PX -
    CANVAS_MEDIA_TOOLBAR_ABOVE_GAP_PX
  const clampedAboveTop = Math.max(safeTop, idealAboveTop)
  if (
    clampedAboveTop + CANVAS_MEDIA_TOOLBAR_HEIGHT_PX <=
      options.nodeTop - CANVAS_MEDIA_TOOLBAR_MIN_MEDIA_HEADER_OFFSET_PX &&
    clampedAboveTop + CANVAS_MEDIA_TOOLBAR_HEIGHT_PX <= safeBottom
  ) {
    return { placement: 'above', top: clampedAboveTop }
  }

  const hasComposer = Number.isFinite(options.composerTop) && Number.isFinite(options.composerHeight)
  const lowerSurfaceBottom = hasComposer
    ? options.composerTop! + Math.max(0, options.composerHeight!)
    : options.nodeTop + options.nodeHeight
  const belowTop = lowerSurfaceBottom + CANVAS_MEDIA_TOOLBAR_BELOW_GAP_PX
  if (belowTop + CANVAS_MEDIA_TOOLBAR_HEIGHT_PX <= safeBottom) {
    return {
      placement: hasComposer ? 'after-composer' : 'below-media',
      top: belowTop,
    }
  }
  const safeBottomTop = safeBottom - CANVAS_MEDIA_TOOLBAR_HEIGHT_PX
  return safeBottomTop >= safeTop
    ? { placement: 'safe-bottom', top: safeBottomTop }
    : null
}
