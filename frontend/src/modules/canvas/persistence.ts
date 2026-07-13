import { isAxiosError } from 'axios'
import type { CanvasNodeCreatePayload } from './types'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

export type CanvasNodeDraft = Omit<CanvasNode, 'id'>
export type CanvasConnectionDraft = Omit<CanvasConnection, 'id'>

interface CanvasErrorResponse {
  detail?: unknown
}

export interface Point {
  x: number
  y: number
}

export interface PendingMove {
  confirmed: Point
  desired: Point
  version: number
  requestedVersion: number
  timer: ReturnType<typeof setTimeout> | null
  inFlight: Promise<void> | null
}

export const MOVE_DEBOUNCE_MS = 400
export const VIEWPORT_DEBOUNCE_MS = 500

export interface PersistedViewport {
  x: number
  y: number
  zoom: number
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function round(value: number, digits: number) {
  const rounded = Number(finiteOr(value, 0).toFixed(digits))
  return Object.is(rounded, -0) ? 0 : rounded
}

export function normalizePersistedViewport(viewport: PersistedViewport): PersistedViewport {
  return {
    x: round(Math.max(-10_000_000, Math.min(10_000_000, finiteOr(viewport.x, 0))), 2),
    y: round(Math.max(-10_000_000, Math.min(10_000_000, finiteOr(viewport.y, 0))), 2),
    zoom: round(Math.max(0.1, Math.min(8, finiteOr(viewport.zoom, 1))), 4),
  }
}

export function isSamePersistedViewport(left: PersistedViewport, right: PersistedViewport) {
  return left.x === right.x && left.y === right.y && left.zoom === right.zoom
}

export function getCanvasErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<CanvasErrorResponse>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (error.code === 'ECONNABORTED') return '画布请求超时，请稍后重试。'
  }

  return fallback
}

export function createTemporaryId(kind: 'node' | 'connection') {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `canvas-temp-${kind}-${suffix}`
}

export function isTemporaryId(id: string) {
  return id.startsWith('canvas-temp-')
}

export function toNodeCreatePayload(node: CanvasNodeDraft): CanvasNodeCreatePayload {
  return {
    node_type: node.type,
    content: {
      ...node.contentData,
      title: node.title,
      ...(node.content ? { text: node.content } : {}),
    },
    position_x: node.x,
    position_y: node.y,
    width: node.width,
    height: node.height,
  }
}
