import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'
import type { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import { canvasNodeWorldRect, worldToSurface, type CanvasNodeGeometryRole, type ViewportSize, type ViewportState } from '../canvas-geometry'

type CanvasStore = ReturnType<typeof useCanvasStore>
type StatusVisualState = Extract<NonNullable<CanvasNode['status']>, 'running' | 'success' | 'warning'>

interface CanvasStagePresentationOptions {
  canvasStore: CanvasStore
  getViewport: () => ViewportState
  getViewportSize: () => ViewportSize
  isReadOnly: () => boolean
}

export function useCanvasStagePresentation(options: CanvasStagePresentationOptions) {
  const { canvasStore } = options
  const statusIconMap: Record<StatusVisualState, typeof Loader2 | typeof CheckCircle2 | typeof AlertCircle> = {
    running: Loader2, success: CheckCircle2, warning: AlertCircle,
  }
  const nodeAppearances = computed(() => canvasStore.nodes.map(({
    id, type, title, content, contentData, status, width, height, isLocked,
  }) => ({ id, type, title, content, contentData, status, width, height, isLocked })))
  const nodePositions = computed(() => canvasStore.nodes.map(({ id, x, y }) => ({ id, x, y })))
  const statusNodes = computed(() => canvasStore.nodes.filter(
    (node): node is CanvasNode & { status: StatusVisualState } =>
      node.status === 'running' || node.status === 'success' || node.status === 'warning',
  ))
  const selectionToolbarStyle = computed(() => {
    if (options.isReadOnly() || !canvasStore.selectedNodes.length) return null
    const viewport = options.getViewport()
    const size = options.getViewportSize()
    const rects = canvasStore.selectedNodes.map((node) => canvasNodeWorldRect(node, 'content'))
    const left = Math.min(...rects.map((rect) => worldToSurface({ x: rect.left, y: rect.top }, viewport).x))
    const right = Math.max(...rects.map((rect) => worldToSurface({ x: rect.left + rect.width, y: rect.top }, viewport).x))
    const top = Math.min(...rects.map((rect) => worldToSurface({ x: rect.left, y: rect.top }, viewport).y))
    const bottom = Math.max(...rects.map((rect) => worldToSurface({ x: rect.left, y: rect.top + rect.height }, viewport).y))
    const halfWidth = 176
    const x = Math.max(halfWidth + 12, Math.min((left + right) / 2, size.width - halfWidth - 12))
    const y = top >= 60 ? top - 56 : Math.min(bottom + 12, size.height - 52)
    const openAbove = y > size.height / 2
    return {
      left: `${x}px`,
      top: `${Math.max(12, y)}px`,
      '--arrange-menu-top': openAbove ? 'auto' : 'calc(100% + 10px)',
      '--arrange-menu-bottom': openAbove ? 'calc(100% + 10px)' : 'auto',
      '--compose-menu-top': openAbove ? 'auto' : 'calc(100% + 10px)',
      '--compose-menu-bottom': openAbove ? 'calc(100% + 10px)' : 'auto',
    }
  })
  const stageNotice = computed(() => {
    if (!canvasStore.activeProjectId) return { kind: 'missing', title: '未选择项目', detail: '请从项目列表进入工作流后加载画布。' }
    if (canvasStore.isLoading && !canvasStore.hasLoaded) return { kind: 'loading', title: '正在加载画布', detail: '正在同步项目节点与连线…' }
    if (canvasStore.loadError) return { kind: 'error', title: '画布加载失败', detail: canvasStore.loadError, canRetry: true }
    return null
  })
  function surfaceNodeRectStyle(node: CanvasNode, role: CanvasNodeGeometryRole = 'content') {
    const viewport = options.getViewport()
    const rect = canvasNodeWorldRect(node, role)
    const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
    return { left: `${position.x}px`, top: `${position.y}px`, width: `${rect.width * viewport.zoom}px`, height: `${rect.height * viewport.zoom}px` }
  }
  function statusBadgeStyle() {
    const zoom = options.getViewport().zoom
    return { left: `${16 * zoom}px`, top: `${14 * zoom}px`, transform: `scale(${Math.max(0.88, Math.min(zoom, 1.2))})`, transformOrigin: 'top left' }
  }
  function statusLabel(status: StatusVisualState) {
    if (status === 'running') return '运行中'
    if (status === 'success') return '已完成'
    return '生成失败'
  }
  return {
    nodeAppearances, nodePositions, selectionToolbarStyle, stageNotice, statusBadgeStyle,
    statusIconMap, statusLabel, statusNodes, surfaceNodeRectStyle,
  }
}
