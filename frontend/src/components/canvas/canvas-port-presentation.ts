import type { NodePortDirection } from '../../modules/canvas/node-registry'

export const CANVAS_PORT_VISUAL_WORLD_SIZE = 16
export const CANVAS_PORT_HIT_TARGET_MIN_PX = 32
export const CANVAS_PORT_HIT_TARGET_MAX_PX = 44
const CANVAS_PORT_HIT_TARGET_PX = 40

function normalizedZoom(zoom: number) {
  return Number.isFinite(zoom) ? Math.min(8, Math.max(0.1, zoom)) : 1
}

export function resolveCanvasPortHitWorldSize(zoom: number) {
  return CANVAS_PORT_HIT_TARGET_PX / normalizedZoom(zoom)
}

export function resolveCanvasPortGeometry(
  direction: NodePortDirection,
  nodeSize: { width: number; height: number },
  index: number,
  count: number,
  zoom: number,
) {
  const center = {
    x: direction === 'input' ? 0 : nodeSize.width,
    y: (nodeSize.height * (index + 1)) / (count + 1),
  }
  const hitSize = resolveCanvasPortHitWorldSize(zoom)
  return {
    visual: {
      x: center.x - CANVAS_PORT_VISUAL_WORLD_SIZE / 2,
      y: center.y - CANVAS_PORT_VISUAL_WORLD_SIZE / 2,
      size: CANVAS_PORT_VISUAL_WORLD_SIZE,
    },
    hit: {
      x: center.x - hitSize / 2,
      y: center.y - hitSize / 2,
      size: hitSize,
    },
  }
}
