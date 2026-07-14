import { computed } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../../types/canvas'
import { getDefaultConnectionPorts, resolveNodeDefinition } from '../../../modules/canvas/node-registry'
import { buildConnectionPath, nodePortWorldAnchor, type ViewportState } from '../canvas-geometry'

interface CanvasConnectionPresentationOptions {
  getConnections: () => CanvasConnection[]
  getDraftConnection?: () => { fromNodeId: string; sourcePort: string } | null
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
}

export function isConnectionTargetCompatible(source: CanvasNode, target: CanvasNode, sourcePort: string) {
  const definition = resolveNodeDefinition(target.type, target.contentData)
  return definition.kind !== 'unsupported' && definition.ports
    .filter((port) => port.direction === 'input')
    .some((port) => Boolean(getDefaultConnectionPorts(source, target, sourcePort, port.id)))
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
  const connectionTargetStates = computed(() => {
    const draft = options.getDraftConnection?.()
    if (!draft) return []
    const nodes = options.getNodes()
    const source = nodes.find((node) => node.id === draft.fromNodeId)
    if (!source) return []
    return nodes.flatMap((node) => node.id === source.id ? [] : [{
      node,
      isCompatible: isConnectionTargetCompatible(source, node, draft.sourcePort),
    }])
  })

  return { connectionPaths, connectionTargetStates, connectionWorldTransform }
}
