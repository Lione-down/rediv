export const CANVAS_CONTEXT_SURFACE_KINDS = [
  'agent-skill',
  'audio-preflight',
  'compare',
  'context',
  'professional',
  'resources',
  'revision',
  'stage',
  'video-preflight',
  'workflow-template',
] as const

export type CanvasContextSurfaceKind = typeof CANVAS_CONTEXT_SURFACE_KINDS[number]

export type CanvasContextSurface =
  | { kind: 'none' }
  | { kind: CanvasContextSurfaceKind; opener: HTMLElement | null }
