import { computed } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../../types/canvas'
import { buildConnectionPath, nodePortWorldAnchor, type ViewportState } from '../canvas-geometry'

interface CanvasConnectionPresentationOptions {
  getConnections: () => CanvasConnection[]
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
}

export function useCanvasConnectionPresentation(options: CanvasConnectionPresentationOptions) {
  const connectionPaths = computed(() => {
    const nodesById = new Map(options.getNodes().map((node) => [node.id, node]))
    return options.getConnections().flatMap((connection) => {
      const source = nodesById.get(connection.from)
      const target = nodesById.get(connection.to)
      if (!source || !target) return []
      return [{
        active: connection.active,
        id: connection.id,
        path: buildConnectionPath(
          nodePortWorldAnchor(source, 'output', connection.sourcePort),
          nodePortWorldAnchor(target, 'input', connection.targetPort),
        ),
      }]
    })
  })
  const connectionWorldTransform = computed(() => {
    const viewport = options.getViewport()
    return `translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`
  })

  return { connectionPaths, connectionWorldTransform }
}
