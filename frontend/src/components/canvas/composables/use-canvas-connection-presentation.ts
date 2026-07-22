import { computed } from 'vue'
import type { CanvasConnection, CanvasNode } from '../../../types/canvas'
import { getAuthoringConnectionPorts, resolveNodeDefinition, type NodePortDirection } from '../../../modules/canvas/node-registry'
import { nodePortWorldAnchor, worldToSurface, type ViewportState } from '../canvas-geometry'
import { buildConnectionPath } from '../canvas-connection-path'

interface CanvasConnectionPresentationOptions {
  getConnections: () => CanvasConnection[]
  getDraftConnection?: () => { originNodeId: string; originPort: string; direction: NodePortDirection } | null
  getNodes: () => CanvasNode[]
  getViewport: () => ViewportState
}

export function isConnectionTargetCompatible(source: CanvasNode, target: CanvasNode, sourcePort: string) {
  return resolveCompatibleConnectionTargetPorts(source, target, sourcePort, 'output').length > 0
}

export function isReverseConnectionTargetCompatible(target: CanvasNode, source: CanvasNode, targetPort: string) {
  return resolveCompatibleConnectionTargetPorts(target, source, targetPort, 'input').length > 0
}

export function resolveCompatibleConnectionTargetPorts(
  origin: CanvasNode,
  candidate: CanvasNode,
  originPort: string,
  originDirection: NodePortDirection,
) {
  const definition = resolveNodeDefinition(candidate.type, candidate.contentData)
  if (candidate.isLocked || definition.kind === 'unsupported') return []
  const isOutput = originDirection === 'output'
  return definition.ports.filter((port) => port.direction === (isOutput ? 'input' : 'output'))
    .filter((port) => Boolean(isOutput
      ? getAuthoringConnectionPorts(origin, candidate, originPort, port.id)
      : getAuthoringConnectionPorts(candidate, origin, port.id, originPort)))
}

export function useCanvasConnectionPresentation(options: CanvasConnectionPresentationOptions) {
  const connectionPaths = computed(() => {
    const nodesById = new Map(options.getNodes().map((node) => [node.id, node]))
    return options.getConnections().flatMap((connection) => {
      const source = nodesById.get(connection.from)
      const target = nodesById.get(connection.to)
      if (!source || !target) return []
      const sourceAnchor = nodePortWorldAnchor(source, 'output', connection.sourcePort)
      const targetAnchor = nodePortWorldAnchor(target, 'input', connection.targetPort)
      return [{
        active: connection.active,
        connection,
        id: connection.id,
        source: sourceAnchor,
        target: targetAnchor,
        path: buildConnectionPath(sourceAnchor, targetAnchor),
      }]
    })
  })
  const connectionTargetStates = computed(() => {
    const draft = options.getDraftConnection?.()
    if (!draft) return []
    const nodes = options.getNodes()
    const origin = nodes.find((node) => node.id === draft.originNodeId)
    if (!origin) return []
    return nodes.flatMap((node) => {
      if (node.id === origin.id) return []
      const compatiblePorts = resolveCompatibleConnectionTargetPorts(origin, node, draft.originPort, draft.direction)
        .map((port) => ({
          anchor: worldToSurface(nodePortWorldAnchor(node, port.direction, port.id), options.getViewport()),
          nodeId: node.id, nodeTitle: node.title, portId: port.id,
        }))
      return [{ node, isCompatible: compatiblePorts.length > 0, compatiblePorts }]
    })
  })
  const connectionTargetPorts = computed(() => connectionTargetStates.value.flatMap((target) => target.compatiblePorts))

  return { connectionPaths, connectionTargetPorts, connectionTargetStates }
}
