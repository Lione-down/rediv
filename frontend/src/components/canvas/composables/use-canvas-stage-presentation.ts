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
    const toolbarHeight = 44
    const clampX = (x: number) => Math.max(halfWidth + 12, Math.min(x, size.width - halfWidth - 12))
    const clampY = (y: number) => Math.max(12, Math.min(y, size.height - toolbarHeight - 12))
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2
    const candidates = [
      { x: clampX(centerX), y: clampY(top - 56) },
      { x: clampX(centerX), y: clampY(bottom + 12) },
      { x: clampX(left - halfWidth - 12), y: clampY(centerY - toolbarHeight / 2) },
      { x: clampX(right + halfWidth + 12), y: clampY(centerY - toolbarHeight / 2) },
      { x: clampX(size.width / 2), y: clampY(104) },
      { x: clampX(size.width / 2), y: clampY(size.height - 112) },
    ]
    const selectedIds = new Set(canvasStore.selectedNodeIds)
    const occupiedRects = canvasStore.nodes.filter((node) => !selectedIds.has(node.id)).map((node) => {
      const rect = canvasNodeWorldRect(node, 'content')
      const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
      return { left: position.x, top: position.y, right: position.x + rect.width * viewport.zoom, bottom: position.y + rect.height * viewport.zoom }
    })
    if (canvasStore.selectedNodes.length === 1 && canvasStore.selectedNodes[0].type === 'generation') {
      const rect = canvasNodeWorldRect(canvasStore.selectedNodes[0], 'composer')
      const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
      occupiedRects.push({ left: position.x, top: position.y, right: position.x + rect.width * viewport.zoom, bottom: position.y + rect.height * viewport.zoom })
    }
    const score = (candidate: { x: number; y: number }) => occupiedRects.reduce((total, rect) => {
      const overlapWidth = Math.max(0, Math.min(candidate.x + halfWidth, rect.right) - Math.max(candidate.x - halfWidth, rect.left))
      const overlapHeight = Math.max(0, Math.min(candidate.y + toolbarHeight, rect.bottom) - Math.max(candidate.y, rect.top))
      return total + overlapWidth * overlapHeight
    }, 0)
    const { x, y } = candidates.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best)
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
