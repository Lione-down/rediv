export type CanvasNodeType = 'text' | 'image' | 'video' | 'model' | 'result' | 'refine' | 'composite'
export type CanvasNodeStatus = 'idle' | 'selected' | 'running' | 'success' | 'warning'

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  title: string
  x: number
  y: number
  width: number
  height: number
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
