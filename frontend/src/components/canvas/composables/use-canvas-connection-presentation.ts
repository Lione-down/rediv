import { computed } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../../types/canvas'
import { getDefaultConnectionPorts, resolveNodeDefinition, type NodePortDirection } from '../../../modules/canvas/node-registry'
import { buildConnectionPath, nodePortWorldAnchor, type ViewportState } from '../canvas-geometry'

interface CanvasConnectionPresentationOptions {
  getConnections: () => CanvasConnection[]
  getDraftConnection?: () => { originNodeId: string; originPort: string; direction: NodePortDirection } | null
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
}

export function isConnectionTargetCompatible(source: CanvasNode, target: CanvasNode, sourcePort: string) {
  const definition = resolveNodeDefinition(target.type, target.contentData)
  return definition.kind !== 'unsupported' && definition.ports
    .filter((port) => port.direction === 'input')
    .some((port) => Boolean(getDefaultConnectionPorts(source, target, sourcePort, port.id)))
}

export function isReverseConnectionTargetCompatible(target: CanvasNode, source: CanvasNode, targetPort: string) {
  const definition = resolveNodeDefinition(source.type, source.contentData)
  return definition.kind !== 'unsupported' && definition.ports
    .filter((port) => port.direction === 'output')
    .some((port) => Boolean(getDefaultConnectionPorts(source, target, port.id, targetPort)))
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
        connection,
        id: connection.id,
        source: nodePortWorldAnchor(source, 'output', connection.sourcePort),
        target: nodePortWorldAnchor(target, 'input', connection.targetPort),
        path: buildConnectionPath(
          nodePortWorldAnchor(source, 'output', connection.sourcePort),
          nodePortWorldAnchor(target, 'input', connection.targetPort),
        ),
      }]
    })
  })
  const connectionTargetStates = computed(() => {
    const draft = options.getDraftConnection?.()
    if (!draft) return []
    const nodes = options.getNodes()
    const origin = nodes.find((node) => node.id === draft.originNodeId)
    if (!origin) return []
    return nodes.flatMap((node) => node.id === origin.id ? [] : [{
      node,
      isCompatible: draft.direction === 'output'
        ? isConnectionTargetCompatible(origin, node, draft.originPort)
        : isReverseConnectionTargetCompatible(origin, node, draft.originPort),
    }])
  })

  return { connectionPaths, connectionTargetStates }
}
