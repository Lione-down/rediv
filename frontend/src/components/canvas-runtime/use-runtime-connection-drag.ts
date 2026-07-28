import { ref } from 'vue'
import { resolveVisibleAcquisitionConnectionPorts } from '../../modules/canvas/node-registry'
import type { CanvasNode } from '../../types/canvas'
import { resolveRuntimeWholeCardConnectionTarget } from './runtime-whole-card-connection'

interface RuntimeConnectionDragOptions {
  connectNodes: (payload: {
    sourceNodeId: string
    sourcePort: string
    targetNodeId: string
    targetPort: string
  }) => void
  nodes: () => readonly CanvasNode[]
  openContinuation: (payload: RuntimePortDragPayload) => void
  setInteractionState: (state: 'idle' | 'port-drag') => void
}

export interface RuntimePortDragPayload {
  direction: 'input' | 'output'
  logicalPortId: string | null
  nodeId: string
  phase: 'start' | 'move' | 'end' | 'cancel'
  x: number
  y: number
}

function acquirePortDropTarget(
  x: number,
  y: number,
  direction: 'input' | 'output',
  originNodeId: string,
) {
  const oppositeDirection = direction === 'output' ? 'input' : 'output'
  return [...document.querySelectorAll<HTMLElement>(
    `[data-visible-port="${oppositeDirection}"]`,
  )]
    .filter((candidate) => candidate.dataset.nodeId !== originNodeId)
    .map((candidate) => {
      const rect = candidate.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      return {
        candidate,
        distance: Math.hypot(centerX - x, centerY - y),
        radius: Math.max(28, Math.max(rect.width, rect.height) * 1.5),
      }
    })
    .filter(({ distance, radius }) => distance <= radius)
    .sort((left, right) => left.distance - right.distance)[0]?.candidate ?? null
}

export function useRuntimeConnectionDrag(options: RuntimeConnectionDragOptions) {
  const connectionTarget = ref<{
    nodeId: string
    side: 'input' | 'output'
    state: 'compatible' | 'incompatible'
  } | null>(null)
  const draftEdge = ref<{
    current: { x: number; y: number }
    start: { x: number; y: number }
  } | null>(null)
  const lastPortDrop = ref('none')

  function handlePortDrag(payload: RuntimePortDragPayload) {
    if (payload.phase === 'start') {
      connectionTarget.value = null
      draftEdge.value = {
        start: { x: payload.x, y: payload.y },
        current: { x: payload.x, y: payload.y },
      }
      options.setInteractionState('port-drag')
      return
    }
    if (payload.phase === 'cancel') {
      connectionTarget.value = null
      draftEdge.value = null
      options.setInteractionState('idle')
      return
    }
    if (payload.phase === 'move' && draftEdge.value) {
      const wholeCardTarget = resolveRuntimeWholeCardConnectionTarget(
        options.nodes(),
        payload.x,
        payload.y,
        payload.direction,
        payload.nodeId,
      )
      connectionTarget.value = wholeCardTarget
        ? {
            nodeId: wholeCardTarget.candidateNodeId,
            side: wholeCardTarget.side,
            state: wholeCardTarget.state,
          }
        : null
      draftEdge.value = {
        ...draftEdge.value,
        current: wholeCardTarget?.state === 'compatible'
          ? wholeCardTarget.anchor
          : { x: payload.x, y: payload.y },
      }
      return
    }
    const wholeCardTarget = resolveRuntimeWholeCardConnectionTarget(
      options.nodes(),
      payload.x,
      payload.y,
      payload.direction,
      payload.nodeId,
    )
    const target = wholeCardTarget?.state === 'compatible'
      ? wholeCardTarget.candidateElement
      : acquirePortDropTarget(
          payload.x,
          payload.y,
          payload.direction,
          payload.nodeId,
        )
    const targetNodeId = wholeCardTarget?.state === 'compatible'
      ? wholeCardTarget.candidateNodeId
      : target?.dataset.nodeId
    const targetDirection = wholeCardTarget?.state === 'compatible'
      ? wholeCardTarget.side
      : target?.dataset.visiblePort
    lastPortDrop.value = targetNodeId && targetDirection
      ? `${payload.nodeId}:${payload.direction}->${targetNodeId}:${targetDirection}`
      : wholeCardTarget?.state === 'incompatible' ? 'incompatible' : 'miss'
    if (
      targetNodeId &&
      targetNodeId !== payload.nodeId &&
      targetDirection &&
      targetDirection !== payload.direction
    ) {
      const sourceNodeId = payload.direction === 'output' ? payload.nodeId : targetNodeId
      const targetConnectionNodeId = payload.direction === 'output' ? targetNodeId : payload.nodeId
      const sourceNode = options.nodes().find((node) => node.id === sourceNodeId)
      const targetNode = options.nodes().find((node) => node.id === targetConnectionNodeId)
      const ports = sourceNode && targetNode
        ? resolveVisibleAcquisitionConnectionPorts(sourceNode, targetNode)
        : null
      if (ports) {
        options.connectNodes({
          sourceNodeId,
          sourcePort: ports.sourcePort,
          targetNodeId: targetConnectionNodeId,
          targetPort: ports.targetPort,
        })
      } else {
        lastPortDrop.value = 'incompatible'
      }
    } else if (wholeCardTarget?.state !== 'incompatible') {
      options.openContinuation(payload)
    }
    connectionTarget.value = null
    draftEdge.value = null
    options.setInteractionState('idle')
  }

  return {
    connectionTarget,
    draftEdge,
    handlePortDrag,
    lastPortDrop,
  }
}
