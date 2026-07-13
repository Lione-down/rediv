export type CanvasKnownNodeType =
  | 'script' | 'note' | 'asset' | 'generation' | 'result' | 'group'
  | 'text' | 'image' | 'video' | 'model' | 'refine' | 'composite'
export type CanvasNodeType = CanvasKnownNodeType | (string & Record<never, never>)
export type CanvasNodeStatus = 'idle' | 'selected' | 'running' | 'success' | 'warning'

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  parentNodeId?: string | null
  isLocked?: boolean
  isCollapsed?: boolean
  status?: CanvasNodeStatus
  content?: string
  contentData?: Record<string, unknown>
}

export interface CanvasConnection {
  id: string
  from: string
  to: string
  sourcePort?: string
  targetPort?: string
  status?: string
  metadata?: Record<string, unknown>
  active?: boolean
}
