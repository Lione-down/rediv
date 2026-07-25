import type { NodePortDirection } from '../../modules/canvas/node-registry'

export const CANVAS_PORT_VISUAL_WORLD_SIZE = 20
export const CANVAS_PORT_HIT_TARGET_MIN_PX = 40
export const CANVAS_PORT_HIT_TARGET_MAX_PX = 40
export const CANVAS_PORT_HIT_TARGET_PX = 40
export const CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX = 80
export const CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX = 30
export const CANVAS_PORT_OUTPUT_RESTING_GAP_WORLD = 5

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
  const safeCount = Math.max(1, count)
  const safeIndex = Math.min(Math.max(0, index), safeCount - 1)
  const logicalCenter = {
    x: direction === 'input' ? 0 : nodeSize.width,
    y: nodeSize.height * (safeIndex + 1) / (safeCount + 1),
  }
  const hitSize = resolveCanvasPortHitWorldSize(zoom)
  const acquisitionDiameter = CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX
  return {
    visual: {
      x: logicalCenter.x - CANVAS_PORT_VISUAL_WORLD_SIZE / 2,
      y: logicalCenter.y - CANVAS_PORT_VISUAL_WORLD_SIZE / 2,
      size: CANVAS_PORT_VISUAL_WORLD_SIZE,
    },
    hit: {
      x: logicalCenter.x - hitSize / 2,
      y: logicalCenter.y - hitSize / 2,
      size: hitSize,
    },
    acquisition: {
      x: logicalCenter.x - acquisitionDiameter / 2,
      y: logicalCenter.y - acquisitionDiameter / 2,
      diameter: acquisitionDiameter,
      direction,
    },
  }
}

export function resolveCanvasRuntimePortGeometry(
  visibleHeight: number,
  index: number,
  count: number,
  zoom: number,
) {
  const safeZoom = normalizedZoom(zoom)
  const safeCount = Math.max(1, count)
  const safeIndex = Math.min(Math.max(0, index), safeCount - 1)
  const screenHeight = Math.max(0, visibleHeight) * safeZoom
  const centerDistance = screenHeight / (safeCount + 1)
  const visualSize = Math.min(20, Math.max(6, 20 * safeZoom), centerDistance)
  const acquisitionSize = Math.min(
    CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX,
    Math.max(visualSize, centerDistance - 4),
  )
  return {
    acquisitionSize,
    centerY: centerDistance * (safeIndex + 1),
    visualSize,
  }
}

export function resolveCanvasOutputRestingPortPosition(
  nodeSize: { width: number; height: number },
) {
  return {
    x: nodeSize.width + CANVAS_PORT_VISUAL_WORLD_SIZE / 2 + CANVAS_PORT_OUTPUT_RESTING_GAP_WORLD,
    y: nodeSize.height / 2,
  }
}

export function resolveCanvasOutputAcquisitionWorldRect(
  nodeSize: { width: number; height: number },
  _zoom: number,
) {
  const diameter = CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX
  return {
    x: nodeSize.width,
    y: nodeSize.height / 2 - diameter / 2,
    width: diameter,
    height: diameter,
  }
}

export function resolveCanvasPortAcquisitionWorldRect(
  direction: NodePortDirection,
  nodeSize: { width: number; height: number },
  index: number,
  count: number,
  _zoom: number,
) {
  const diameter = CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX
  const safeCount = Math.max(1, count)
  const safeIndex = Math.min(Math.max(0, index), safeCount - 1)
  return {
    x: direction === 'input' ? -diameter : nodeSize.width,
    y: nodeSize.height * (safeIndex + 1) / (safeCount + 1) - diameter / 2,
    width: diameter,
    height: diameter,
  }
}

export function resolveCanvasPortRestingPosition(
  direction: NodePortDirection,
  nodeSize: { width: number; height: number },
  index: number,
  count: number,
) {
  const safeCount = Math.max(1, count)
  const safeIndex = Math.min(Math.max(0, index), safeCount - 1)
  const offset = CANVAS_PORT_VISUAL_WORLD_SIZE / 2 + CANVAS_PORT_OUTPUT_RESTING_GAP_WORLD
  return {
    x: direction === 'input' ? -offset : nodeSize.width + offset,
    y: nodeSize.height * (safeIndex + 1) / (safeCount + 1),
  }
}

export function resolveCanvasElasticPortPosition(
  direction: NodePortDirection,
  pointer: { x: number; y: number },
  nodeSize: { width: number; height: number },
  index: number,
  count: number,
  zoom: number,
  isInteractive = true,
) {
  if (!isInteractive) return null
  const safeZoom = normalizedZoom(zoom)
  const rect = resolveCanvasPortAcquisitionWorldRect(
    direction,
    nodeSize,
    index,
    count,
    safeZoom,
  )
  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
  const deltaX = pointer.x - center.x
  const deltaY = pointer.y - center.y
  const distance = Math.hypot(deltaX, deltaY)
  if (distance > rect.width / 2) return null
  const followRadius = CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX
  const scale = distance > followRadius ? followRadius / distance : 1
  const visualRadius = CANVAS_PORT_VISUAL_WORLD_SIZE / 2
  const x = center.x + deltaX * scale
  return {
    x: direction === 'input'
      ? Math.min(-visualRadius, x)
      : Math.max(nodeSize.width + visualRadius, x),
    y: center.y + deltaY * scale,
  }
}

export function resolveCanvasElasticOutputPortPosition(
  pointer: { x: number; y: number },
  nodeSize: { width: number; height: number },
  zoom: number,
  isInteractive = true,
) {
  return resolveCanvasElasticPortPosition(
    'output',
    pointer,
    nodeSize,
    0,
    1,
    zoom,
    isInteractive,
  )
}
