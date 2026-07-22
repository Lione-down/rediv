export interface CanvasConnectionPoint {
  x: number
  y: number
}

export const CANVAS_REVERSE_CONNECTION_TANGENT_WORLD = 132

export function buildConnectionPath(from: CanvasConnectionPoint, to: CanvasConnectionPoint) {
  if (to.x >= from.x) {
    const midpointX = (from.x + to.x) / 2
    return `M ${from.x} ${from.y} C ${midpointX} ${from.y}, ${midpointX} ${to.y}, ${to.x} ${to.y}`
  }
  return `M ${from.x} ${from.y} C ${from.x + CANVAS_REVERSE_CONNECTION_TANGENT_WORLD} ${from.y}, ${to.x - CANVAS_REVERSE_CONNECTION_TANGENT_WORLD} ${to.y}, ${to.x} ${to.y}`
}
