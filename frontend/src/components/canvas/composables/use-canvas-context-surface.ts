import { nextTick, shallowRef } from 'vue'
import {
  CANVAS_CONTEXT_SURFACE_KINDS,
  type CanvasContextSurface,
  type CanvasContextSurfaceKind,
} from '../../../modules/canvas/context-surface-state'

export type { CanvasContextSurfaceKind } from '../../../modules/canvas/context-surface-state'

interface CanvasContextSurfaceOptions {
  closeSurface: (kind: CanvasContextSurfaceKind) => void
  fallbackFocusTarget?: () => HTMLElement | null
}

function activeElement(): HTMLElement | null {
  return typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null
}

function connectedTarget(target: HTMLElement | null | undefined): HTMLElement | null {
  return target?.isConnected ? target : null
}

export function useCanvasContextSurface(options: CanvasContextSurfaceOptions) {
  const surface = shallowRef<CanvasContextSurface>({ kind: 'none' })

  function activate(kind: CanvasContextSurfaceKind, opener?: HTMLElement | null) {
    for (const candidate of CANVAS_CONTEXT_SURFACE_KINDS) {
      if (candidate !== kind) options.closeSurface(candidate)
    }
    surface.value = {
      kind,
      opener: connectedTarget(opener) ?? connectedTarget(activeElement()),
    }
  }

  function markClosed(kind: CanvasContextSurfaceKind) {
    if (surface.value.kind === kind) surface.value = { kind: 'none' }
  }

  function deactivate(kind: CanvasContextSurfaceKind, restoreFocus = true) {
    if (surface.value.kind !== kind) {
      options.closeSurface(kind)
      return
    }
    const opener = surface.value.opener
    options.closeSurface(kind)
    surface.value = { kind: 'none' }
    if (!restoreFocus) return
    void nextTick(() => {
      const target = connectedTarget(opener) ?? connectedTarget(options.fallbackFocusTarget?.())
      target?.focus({ preventScroll: true })
    })
  }

  function clear(restoreFocus = false) {
    const current = surface.value
    if (current.kind === 'none') return
    deactivate(current.kind, restoreFocus)
  }

  return { activate, clear, deactivate, markClosed, surface }
}
