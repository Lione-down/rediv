import type { CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import { findFirstUnoccupiedPosition } from './graph-placement'
import {
  createRegistryNodeDraft,
  getAuthoringConnectionPorts,
  getCreatableNodeDefinitions,
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

export type ConnectionContinuationDirection = 'downstream' | 'upstream'

export function resolveConnectionContinuationOptions(
  origin: CanvasNode,
  originPort: string,
  direction: ConnectionContinuationDirection = 'downstream',
): ConnectionContinuationOption[] {
  return getCreatableNodeDefinitions().flatMap((definition) => (
    definition.subtypes.flatMap((subtype) => {
      const type = definition.type as CanonicalNodeType
      const candidate = createRegistryNodeDraft(type, subtype.id, { x: 0, y: 0 })
      const ports = definition.ports
        .filter((port) => port.direction === (direction === 'downstream' ? 'input' : 'output'))
        .map((port) => direction === 'downstream'
          ? getAuthoringConnectionPorts(origin, candidate, originPort, port.id)
          : getAuthoringConnectionPorts(candidate, origin, port.id, originPort))
        .find(Boolean)
      return ports ? [{
        key: `${definition.type}:${subtype.id}:${direction === 'downstream' ? ports.targetPort : ports.sourcePort}`,
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

export function resolveMultiConnectionContinuationOptions(
  origins: readonly CanvasNode[],
): ConnectionContinuationOption[] {
  const uniqueOrigins = [...new Map(origins.map((origin) => [origin.id, origin])).values()]
  if (uniqueOrigins.length < 2) return []
  return getCreatableNodeDefinitions().flatMap((definition) => (
    definition.subtypes.flatMap((subtype) => {
      const type = definition.type as CanonicalNodeType
      const candidate = createRegistryNodeDraft(type, subtype.id, { x: 0, y: 0 })
      const ports = uniqueOrigins.map((origin) => getAuthoringConnectionPorts(origin, candidate))
      if (ports.some((resolved) => !resolved)) return []
      const first = ports[0]!
      return [{
        key: `${definition.type}:${subtype.id}:multi-downstream`,
        type,
        subtype: subtype.id,
        label: definition.type === 'script' && subtype.id === 'prompt'
          ? '文本'
          : subtype.label,
        icon: definition.icon,
        sourcePort: first.sourcePort,
        targetPort: first.targetPort,
      }]
    })
  ))
}

export function createConnectionContinuationCommand(
  origin: CanvasNode,
  option: ConnectionContinuationOption,
  point: { x: number; y: number },
  direction: ConnectionContinuationDirection = 'downstream',
  createId: () => string = createCanvasEntityId,
  existingNodes: readonly CanvasNode[] = [],
): InsertGraphCommand {
  const nodeId = createId()
  const connectionId = createId()
  const draft = createRegistryNodeDraft(option.type, option.subtype, {
    x: direction === 'downstream' ? point.x + 48 : point.x - 48 - getCreatableNodeDefinitions()
      .find((definition) => definition.type === option.type)!.defaultSize.width,
    y: point.y - 0.5 * getCreatableNodeDefinitions()
      .find((definition) => definition.type === option.type)!.defaultSize.height,
  })
  if (existingNodes.length) Object.assign(draft, findFirstUnoccupiedPosition(draft, draft, existingNodes, [origin.id]))
  const node: CanvasNode = { id: nodeId, ...draft }
  return {
    type: 'insert-graph',
    nodes: [node],
    connections: [{
      id: connectionId,
      from: direction === 'downstream' ? origin.id : nodeId,
      to: direction === 'downstream' ? nodeId : origin.id,
      sourcePort: option.sourcePort,
      targetPort: option.targetPort,
      status: 'active',
      active: true,
    }],
  }
}

export function createMultiConnectionContinuationCommand(
  origins: readonly CanvasNode[],
  option: ConnectionContinuationOption,
  point: { x: number; y: number },
  createId: () => string = createCanvasEntityId,
  existingNodes: readonly CanvasNode[] = [],
): InsertGraphCommand | null {
  const uniqueOrigins = [...new Map(origins.map((origin) => [origin.id, origin])).values()]
  if (uniqueOrigins.length < 2) return null
  const nodeId = createId()
  const definition = getCreatableNodeDefinitions()
    .find((candidate) => candidate.type === option.type)
  if (!definition) return null
  const draft = createRegistryNodeDraft(option.type, option.subtype, {
    x: point.x + 48,
    y: point.y - 0.5 * definition.defaultSize.height,
  })
  if (existingNodes.length) {
    Object.assign(
      draft,
      findFirstUnoccupiedPosition(
        draft,
        draft,
        existingNodes,
        uniqueOrigins.map((origin) => origin.id),
      ),
    )
  }
  const node: CanvasNode = { id: nodeId, ...draft }
  const resolved = uniqueOrigins.map((origin) => ({
    origin,
    ports: getAuthoringConnectionPorts(origin, node),
  }))
  if (resolved.some((item) => !item.ports)) return null
  return {
    type: 'insert-graph',
    nodes: [node],
    connections: resolved.map(({ origin, ports }) => ({
      id: createId(),
      from: origin.id,
      to: nodeId,
      sourcePort: ports!.sourcePort,
      targetPort: ports!.targetPort,
      status: 'active',
      active: true,
    })),
  }
}
