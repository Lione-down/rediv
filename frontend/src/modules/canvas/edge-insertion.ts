import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import {
  createRegistryNodeDraft,
  getCreatableNodeDefinitions,
  getDefaultConnectionPorts,
  isNodeMutationSupported,
  type CanonicalNodeType,
} from './node-registry'

export interface EdgeInsertionOption {
  key: string
  type: CanonicalNodeType
  subtype: string
  label: string
  icon: string
  inputPort: string
  outputPort: string
}

export interface InsertNodeIntoConnectionCommand {
  type: 'insert-node-into-connection'
  connectionId: string
  node: CanvasNode
  upstream: CanvasConnection
  downstream: CanvasConnection
}

export function resolveEdgeInsertionOptions(
  source: CanvasNode,
  target: CanvasNode,
  connection: CanvasConnection,
): EdgeInsertionOption[] {
  if (
    connection.from !== source.id || connection.to !== target.id ||
    !isNodeMutationSupported(source) || !isNodeMutationSupported(target) ||
    source.isLocked || target.isLocked
  ) return []
  return getCreatableNodeDefinitions().flatMap((definition) => definition.subtypes.flatMap((subtype) => {
    const type = definition.type as CanonicalNodeType
    const candidate = createRegistryNodeDraft(type, subtype.id, { x: 0, y: 0 })
    for (const input of definition.ports.filter((port) => port.direction === 'input')) {
      const incoming = getDefaultConnectionPorts(
        source, candidate, connection.sourcePort ?? 'out', input.id,
      )
      if (!incoming) continue
      for (const output of definition.ports.filter((port) => port.direction === 'output')) {
        const outgoing = getDefaultConnectionPorts(
          candidate, target, output.id, connection.targetPort ?? 'in',
        )
        if (!outgoing) continue
        return [{
          key: `${type}:${subtype.id}:${input.id}:${output.id}`,
          type, subtype: subtype.id, label: subtype.label, icon: definition.icon,
          inputPort: input.id, outputPort: output.id,
        }]
      }
    }
    return []
  }))
}

export function createEdgeInsertionCommand(
  source: CanvasNode,
  target: CanvasNode,
  connection: CanvasConnection,
  option: EdgeInsertionOption,
  midpoint: { x: number; y: number },
  createId: () => string = createCanvasEntityId,
): InsertNodeIntoConnectionCommand {
  const definition = getCreatableNodeDefinitions().find((item) => item.type === option.type)
  if (!definition) throw new Error(`Unknown insertion node type: ${option.type}`)
  const node: CanvasNode = {
    id: createId(),
    ...createRegistryNodeDraft(option.type, option.subtype, {
      x: midpoint.x - definition.defaultSize.width / 2,
      y: midpoint.y - definition.defaultSize.height / 2,
    }),
  }
  return {
    type: 'insert-node-into-connection',
    connectionId: connection.id,
    node,
    upstream: {
      ...connection,
      from: source.id,
      to: node.id,
      sourcePort: connection.sourcePort ?? 'out',
      targetPort: option.inputPort,
    },
    downstream: {
      id: createId(),
      from: node.id,
      to: target.id,
      sourcePort: option.outputPort,
      targetPort: connection.targetPort ?? 'in',
      status: connection.status,
      active: connection.active,
    },
  }
}

export function isEdgeInsertionCommandValid(
  command: InsertNodeIntoConnectionCommand,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
) {
  const original = connections.find((connection) => connection.id === command.connectionId)
  const source = original ? nodes.find((node) => node.id === original.from) : null
  const target = original ? nodes.find((node) => node.id === original.to) : null
  if (
    !original || !source || !target || command.upstream.id !== original.id ||
    command.node.id === source.id || command.node.id === target.id ||
    nodes.some((node) => node.id === command.node.id) ||
    connections.some((connection) => connection.id === command.downstream.id) ||
    command.upstream.from !== source.id || command.upstream.to !== command.node.id ||
    command.downstream.from !== command.node.id || command.downstream.to !== target.id
  ) return false
  const options = resolveEdgeInsertionOptions(source, target, original)
  return options.some((option) => (
    option.type === command.node.type && option.subtype === command.node.contentData?.subtype &&
    option.inputPort === command.upstream.targetPort && option.outputPort === command.downstream.sourcePort &&
    command.upstream.sourcePort === (original.sourcePort ?? 'out') &&
    command.downstream.targetPort === (original.targetPort ?? 'in')
  ))
}
