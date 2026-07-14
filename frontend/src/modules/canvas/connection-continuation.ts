import type { CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import {
  createRegistryNodeDraft,
  getCreatableNodeDefinitions,
  getDefaultConnectionPorts,
  type CanonicalNodeType,
} from './node-registry'

export interface ConnectionContinuationOption {
  key: string
  type: CanonicalNodeType
  subtype: string
  label: string
  icon: string
  sourcePort: string
  targetPort: string
}

export function resolveConnectionContinuationOptions(
  source: CanvasNode,
  sourcePort: string,
): ConnectionContinuationOption[] {
  return getCreatableNodeDefinitions().flatMap((definition) => (
    definition.subtypes.flatMap((subtype) => {
      const type = definition.type as CanonicalNodeType
      const target = createRegistryNodeDraft(type, subtype.id, { x: 0, y: 0 })
      const ports = definition.ports
        .filter((port) => port.direction === 'input')
        .map((port) => getDefaultConnectionPorts(source, target, sourcePort, port.id))
        .find(Boolean)
      return ports ? [{
        key: `${definition.type}:${subtype.id}:${ports.targetPort}`,
        type,
        subtype: subtype.id,
        label: subtype.label,
        icon: definition.icon,
        sourcePort: ports.sourcePort,
        targetPort: ports.targetPort,
      }] : []
    })
  ))
}

export function createConnectionContinuationCommand(
  source: CanvasNode,
  option: ConnectionContinuationOption,
  point: { x: number; y: number },
  createId: () => string = createCanvasEntityId,
): InsertGraphCommand {
  const nodeId = createId()
  const connectionId = createId()
  const draft = createRegistryNodeDraft(option.type, option.subtype, {
    x: point.x + 48,
    y: point.y - 0.5 * getCreatableNodeDefinitions()
      .find((definition) => definition.type === option.type)!.defaultSize.height,
  })
  const node: CanvasNode = { id: nodeId, ...draft }
  return {
    type: 'insert-graph',
    nodes: [node],
    connections: [{
      id: connectionId,
      from: source.id,
      to: nodeId,
      sourcePort: option.sourcePort,
      targetPort: option.targetPort,
      status: 'active',
      active: true,
    }],
  }
}
