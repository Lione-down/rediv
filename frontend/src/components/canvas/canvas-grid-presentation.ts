import {
  CANVAS_GRID_SIZE,
  clampZoom,
  type ViewportState,
} from './canvas-geometry'
import type { CSSProperties } from 'vue'

export type CanvasGridStyle = CSSProperties & {
  '--canvas-grid-size': string
  '--canvas-grid-position-x': string
  '--canvas-grid-position-y': string
}

function roundedPixel(value: number) {
  const rounded = Math.round(value * 10_000) / 10_000
  return `${Object.is(rounded, -0) ? 0 : rounded}px`
}

function normalizedTilePosition(offset: number, tileSize: number) {
  const normalized = ((offset % tileSize) + tileSize) % tileSize
  const rounded = Math.round(normalized * 10_000) / 10_000
  return rounded >= tileSize ? 0 : rounded
}

export function getCanvasGridStyle(viewport: ViewportState): CanvasGridStyle {
  const zoom = clampZoom(Number.isFinite(viewport.zoom) ? viewport.zoom : 1)
  const tileSize = CANVAS_GRID_SIZE * zoom
  const x = Number.isFinite(viewport.x) ? viewport.x : 0
  const y = Number.isFinite(viewport.y) ? viewport.y : 0
  return {
    '--canvas-grid-size': roundedPixel(tileSize),
    '--canvas-grid-position-x': roundedPixel(normalizedTilePosition(x - tileSize / 2, tileSize)),
    '--canvas-grid-position-y': roundedPixel(normalizedTilePosition(y - tileSize / 2, tileSize)),
  }
}
