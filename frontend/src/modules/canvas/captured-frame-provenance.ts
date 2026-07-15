import type { CanvasNode } from '../../types/canvas'

export interface CapturedFrameProvenance {
  captureTimeSeconds: number
  frameNodeId: string
  sourceNodeId: string
  sourceTitle: string
}

function nonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function resolveCapturedFrameProvenance(
  frameNode: CanvasNode | null | undefined,
  nodes: readonly CanvasNode[],
): CapturedFrameProvenance | null {
  if (!frameNode || frameNode.type !== 'asset' || frameNode.contentData?.subtype !== 'image') return null
  if (!nonEmptyString(frameNode.contentData.asset_id)) return null
  const sourceNodeId = nonEmptyString(frameNode.contentData.source_video_node_id)
  const captureTimeSeconds = frameNode.contentData.source_video_time_seconds
  if (!sourceNodeId || sourceNodeId === frameNode.id || typeof captureTimeSeconds !== 'number' || !Number.isFinite(captureTimeSeconds) || captureTimeSeconds < 0) return null
  const source = nodes.find((node) => node.id === sourceNodeId)
  if (!source || source.contentData?.subtype !== 'video') return null
  return { captureTimeSeconds, frameNodeId: frameNode.id, sourceNodeId: source.id, sourceTitle: source.title }
}

export function formatCapturedFrameTime(timeSeconds: number) {
  const milliseconds = Math.round(timeSeconds * 1000)
  const minutes = Math.floor(milliseconds / 60_000)
  const seconds = Math.floor((milliseconds % 60_000) / 1000)
  const remainder = milliseconds % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(remainder).padStart(3, '0')}`
}
