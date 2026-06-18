export type CanvasNodeType = 'text' | 'image' | 'video' | 'model' | 'result' | 'refine' | 'composite'

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  title: string
  x: number
  y: number
  width: number
  height: number
  status?: 'idle' | 'selected' | 'running' | 'success' | 'warning'
  content?: string
}

export interface CanvasConnection {
  id: string
  from: string
  to: string
  active?: boolean
}
