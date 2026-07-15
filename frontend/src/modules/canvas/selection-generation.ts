import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from './canvas-autosave'
import type { InsertGraphCommand } from './canvas-commands'
import { resolveGenerationContext } from './generation-context'
import { findFirstUnoccupiedPosition } from './graph-placement'
import {
  createRegistryNodeDraft,
  getAuthoringConnectionPorts,
  isNodeMutationSupported,
} from './node-registry'

export type SelectionGenerationMediaType = 'image' | 'video'
export type SelectionVideoMode = 'text-to-video' | 'img2vid' | 'keyframes'

export interface SelectionGenerationIntent {
  assetImageCount: number
  imageCount: number
  inputs: readonly SelectionGenerationInput[]
  resultCount: number
  textCount: number
  videoMode: SelectionVideoMode
}

export interface SelectionGenerationInput {
  kind: 'text' | 'reference'
  nodeId: string
  order: number
}

export type SelectionGenerationMoveDirection = 'up' | 'down'

function uniqueSelection(nodes: readonly CanvasNode[]) {
  return nodes.length >= 2 && new Set(nodes.map((node) => node.id)).size === nodes.length
}

function generationPosition(nodes: readonly CanvasNode[]) {
  const right = Math.max(...nodes.map((node) => node.x + node.width))
  const top = Math.min(...nodes.map((node) => node.y))
  const bottom = Math.max(...nodes.map((node) => node.y + node.height))
  return { x: right + 96, y: (top + bottom - 220) / 2 }
}

export function createSelectionGenerationCommand(
  selectedNodes: readonly CanvasNode[],
  mediaType: SelectionGenerationMediaType,
  createId: () => string = createCanvasEntityId,
  existingNodes: readonly CanvasNode[] = selectedNodes,
): InsertGraphCommand | null {
  if (
    !uniqueSelection(selectedNodes) ||
    selectedNodes.some((node) => (
      node.isLocked || node.parentNodeId || !isNodeMutationSupported(node)
    ))
  ) return null

  const draft = createRegistryNodeDraft('generation', mediaType, generationPosition(selectedNodes))
  const generationNode: CanvasNode = {
    id: createId(),
    ...draft,
    ...findFirstUnoccupiedPosition(draft, draft, existingNodes, selectedNodes.map((node) => node.id)),
  }
  const inputOrder = new Map<string, number>()
  const connections = selectedNodes.flatMap((source): CanvasConnection[] => {
    const ports = getAuthoringConnectionPorts(source, generationNode)
    if (!ports || (ports.targetPort !== 'prompt' && ports.targetPort !== 'media')) return []
    const order = (inputOrder.get(ports.targetPort) ?? 0) + 1
    inputOrder.set(ports.targetPort, order)
    return [{
      id: createId(),
      from: source.id,
      to: generationNode.id,
      sourcePort: ports.sourcePort,
      targetPort: ports.targetPort,
      status: 'active',
      active: true,
      metadata: { input_order: order },
    }]
  })
  if (connections.length !== selectedNodes.length) return null

  const context = resolveGenerationContext(
    generationNode,
    [...selectedNodes, generationNode],
    connections,
  )
  if (context.provenance.length !== selectedNodes.length || context.provenance.some((item) => !item.isIncluded)) {
    return null
  }
  return { type: 'insert-graph', nodes: [generationNode], connections }
}

export function canCreateGenerationFromSelection(selectedNodes: readonly CanvasNode[]) {
  return Boolean(resolveSelectionGenerationIntent(selectedNodes))
}

export function moveSelectionGenerationInput(
  selectedNodes: readonly CanvasNode[],
  nodeId: string,
  direction: SelectionGenerationMoveDirection,
): string[] | null {
  const intent = resolveSelectionGenerationIntent(selectedNodes)
  if (!intent) return null
  const input = intent.inputs.find((candidate) => candidate.nodeId === nodeId)
  if (!input) return null
  const peers = intent.inputs.filter((candidate) => candidate.kind === input.kind)
  const currentIndex = peers.findIndex((candidate) => candidate.nodeId === nodeId)
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  const target = peers[targetIndex]
  if (!target) return null
  const nextIds = selectedNodes.map((node) => node.id)
  const currentPosition = nextIds.indexOf(nodeId)
  const targetPosition = nextIds.indexOf(target.nodeId)
  const targetNodeId = nextIds[targetPosition]
  nextIds[targetPosition] = nextIds[currentPosition]
  nextIds[currentPosition] = targetNodeId
  return nextIds
}

export function resolveSelectionGenerationIntent(
  selectedNodes: readonly CanvasNode[],
): SelectionGenerationIntent | null {
  let index = 0
  const command = createSelectionGenerationCommand(selectedNodes, 'image', () => `selection-preview-${index++}`)
  if (!command) return null
  const textCount = command.connections.filter((connection) => connection.targetPort === 'prompt').length
  const imageCount = command.connections.length - textCount
  const resultCount = command.connections.filter((connection) => (
    connection.targetPort === 'media' && selectedNodes.some((node) => (
      node.id === connection.from && node.type === 'result'
    ))
  )).length
  return {
    assetImageCount: imageCount - resultCount,
    imageCount,
    inputs: command.connections.map((connection) => ({
      kind: connection.targetPort === 'prompt' ? 'text' : 'reference',
      nodeId: connection.from,
      order: Number(connection.metadata?.input_order),
    })),
    resultCount,
    textCount,
    videoMode: imageCount === 0 ? 'text-to-video' : imageCount === 1 ? 'img2vid' : 'keyframes',
  }
}
