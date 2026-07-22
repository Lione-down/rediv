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
  _index: number,
  _count: number,
  zoom: number,
) {
  const logicalCenter = {
    x: direction === 'input' ? 0 : nodeSize.width,
    y: nodeSize.height / 2,
  }
  const visualCenter = direction === 'output'
    ? resolveCanvasOutputRestingPortPosition(nodeSize)
    : logicalCenter
  const hitSize = resolveCanvasPortHitWorldSize(zoom)
  return {
    visual: {
      x: visualCenter.x - CANVAS_PORT_VISUAL_WORLD_SIZE / 2,
      y: visualCenter.y - CANVAS_PORT_VISUAL_WORLD_SIZE / 2,
      size: CANVAS_PORT_VISUAL_WORLD_SIZE,
    },
    hit: {
      x: logicalCenter.x - hitSize / 2,
      y: logicalCenter.y - hitSize / 2,
      size: hitSize,
    },
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
  zoom: number,
) {
  const safeZoom = normalizedZoom(zoom)
  const diameter = CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX / safeZoom
  return {
    x: nodeSize.width,
    y: nodeSize.height / 2 - diameter / 2,
    width: diameter,
    height: diameter,
  }
}

export function resolveCanvasElasticOutputPortPosition(
  pointer: { x: number; y: number },
  nodeSize: { width: number; height: number },
  zoom: number,
  isInteractive = true,
) {
  if (!isInteractive) return null
  const safeZoom = normalizedZoom(zoom)
  const acquisitionRadius = CANVAS_PORT_OUTPUT_ACQUISITION_DIAMETER_PX / 2 / safeZoom
  const followRadius = CANVAS_PORT_OUTPUT_FOLLOW_RADIUS_PX / safeZoom
  const acquisitionCenter = {
    x: nodeSize.width + acquisitionRadius,
    y: nodeSize.height / 2,
  }
  const deltaX = pointer.x - acquisitionCenter.x
  const deltaY = pointer.y - acquisitionCenter.y
  const distance = Math.hypot(deltaX, deltaY)
  if (distance > acquisitionRadius) return null
  const followScale = distance > followRadius ? followRadius / distance : 1
  const visualRadius = CANVAS_PORT_VISUAL_WORLD_SIZE / 2
  return {
    x: Math.max(nodeSize.width + visualRadius, acquisitionCenter.x + deltaX * followScale),
    y: acquisitionCenter.y + deltaY * followScale,
  }
}
