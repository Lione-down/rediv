import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'
import type { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import { canvasNodeWorldRect, worldToSurface, type CanvasNodeGeometryRole, type ViewportInsets, type ViewportSize, type ViewportState } from '../canvas-geometry'
import { resolveKeyframeRailPlacement } from '../canvas-keyframe-placement'
import { resolveCanvasAuthoringCardPresentation } from '../canvas-authoring-card-presentation'

type CanvasStore = ReturnType<typeof useCanvasStore>
type StatusVisualState = Extract<NonNullable<CanvasNode['status']>, 'running' | 'success' | 'warning'>

interface CanvasStagePresentationOptions {
  canvasStore: CanvasStore
  getViewport: () => ViewportState
  getViewportInsets: () => Partial<ViewportInsets>
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
      (node.status === 'running' || node.status === 'success' || node.status === 'warning') &&
      !resolveCanvasAuthoringCardPresentation(node),
  ))
  const selectionSurfaceBounds = computed(() => {
    if (!canvasStore.selectedNodes.length) return null
    const viewport = options.getViewport()
    const rects = canvasStore.selectedNodes.map((node) => canvasNodeWorldRect(node, 'content'))
    return {
      left: Math.min(...rects.map((rect) => worldToSurface({ x: rect.left, y: rect.top }, viewport).x)),
      right: Math.max(...rects.map((rect) => worldToSurface({ x: rect.left + rect.width, y: rect.top }, viewport).x)),
      top: Math.min(...rects.map((rect) => worldToSurface({ x: rect.left, y: rect.top }, viewport).y)),
      bottom: Math.max(...rects.map((rect) => worldToSurface({ x: rect.left, y: rect.top + rect.height }, viewport).y)),
    }
  })
  const selectionAggregateHullStyle = computed(() => {
    const bounds = selectionSurfaceBounds.value
    if (options.isReadOnly() || canvasStore.selectedNodes.length < 2 || !bounds) return null
    const gutter = 12
    return {
      left: `${bounds.left - gutter}px`,
      top: `${bounds.top - gutter}px`,
      width: `${bounds.right - bounds.left + gutter * 2}px`,
      height: `${bounds.bottom - bounds.top + gutter * 2}px`,
    }
  })
  const selectionToolbarStyle = computed(() => {
    const bounds = selectionSurfaceBounds.value
    if (options.isReadOnly() || !bounds) return null
    const viewport = options.getViewport()
    const size = options.getViewportSize()
    const insets = options.getViewportInsets()
    const { left, right, top, bottom } = bounds
    const halfWidth = canvasStore.selectedNodes.length === 1
      ? canvasStore.selectedNodes[0].type === 'generation' ? 106 : 84
      : 176
    const toolbarHeight = 44
    const safeLeft = Math.max(0, insets.left ?? 0)
    const safeTop = Math.max(0, insets.top ?? 0)
    const safeRight = Math.max(safeLeft, size.width - Math.max(0, insets.right ?? 0))
    const safeBottom = Math.max(safeTop, size.height - Math.max(0, insets.bottom ?? 0))
    const clampX = (x: number) => {
      const minimum = safeLeft + halfWidth
      const maximum = safeRight - halfWidth
      return minimum > maximum ? (safeLeft + safeRight) / 2 : Math.max(minimum, Math.min(x, maximum))
    }
    const clampY = (y: number) => Math.max(safeTop + 12, Math.min(y, safeBottom - toolbarHeight - 12))
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2
    const aboveCandidate = { x: clampX(centerX), y: clampY(top - 56) }
    const belowCandidate = { x: clampX(centerX), y: clampY(bottom + 12) }
    const selectedVideo = canvasStore.selectedNodes.length === 1 && canvasStore.selectedNodes[0].contentData?.subtype === 'video' && !canvasStore.selectedNodes[0].isLocked
      ? canvasStore.selectedNodes[0]
      : null
    const keyframePlacement = selectedVideo ? resolveKeyframeRailPlacement(selectedVideo, canvasStore.nodes) : null
    const candidates = [
      ...(keyframePlacement === 'above' ? [belowCandidate, aboveCandidate] : [aboveCandidate, belowCandidate]),
      { x: clampX(left - halfWidth - 12), y: clampY(centerY - toolbarHeight / 2) },
      { x: clampX(right + halfWidth + 12), y: clampY(centerY - toolbarHeight / 2) },
      { x: clampX(size.width / 2), y: clampY(104) },
      { x: clampX(size.width / 2), y: clampY(size.height - 112) },
    ]
    const selectedNodeIds = new Set(canvasStore.selectedNodes.map((node) => node.id))
    const hardOccupiedRects = canvasStore.nodes.filter((node) => !selectedNodeIds.has(node.id)).map((node) => {
      const rect = canvasNodeWorldRect(node, 'content')
      const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
      return { left: position.x, top: position.y, right: position.x + rect.width * viewport.zoom, bottom: position.y + rect.height * viewport.zoom }
    })
    const softOccupiedRects = canvasStore.selectedNodes.map((node) => {
      const rect = canvasNodeWorldRect(node, 'content')
      const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
      return { left: position.x, top: position.y, right: position.x + rect.width * viewport.zoom, bottom: position.y + rect.height * viewport.zoom }
    })
    if (selectedVideo && keyframePlacement) {
      const railHeight = 52
      softOccupiedRects.push({
        left: left + 14,
        top: keyframePlacement === 'above' ? top - railHeight - 8 : bottom + 8,
        right,
        bottom: keyframePlacement === 'above' ? top - 8 : bottom + railHeight + 8,
      })
    }
    if (canvasStore.selectedNodes.length === 1 && canvasStore.selectedNodes[0].type === 'generation') {
      const rect = canvasNodeWorldRect(canvasStore.selectedNodes[0], 'composer')
      const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
      softOccupiedRects.push({ left: position.x, top: position.y, right: position.x + rect.width * viewport.zoom, bottom: position.y + rect.height * viewport.zoom })
    }
    const overlapArea = (candidate: { x: number; y: number }, rects: typeof hardOccupiedRects) => rects.reduce((total, rect) => {
      const overlapWidth = Math.max(0, Math.min(candidate.x + halfWidth, rect.right) - Math.max(candidate.x - halfWidth, rect.left))
      const overlapHeight = Math.max(0, Math.min(candidate.y + toolbarHeight, rect.bottom) - Math.max(candidate.y, rect.top))
      return total + overlapWidth * overlapHeight
    }, 0)
    const rankedCandidates = candidates.map((candidate, index) => ({
      ...candidate,
      hardOverlap: overlapArea(candidate, hardOccupiedRects),
      softOverlap: overlapArea(candidate, softOccupiedRects),
      distanceRank: index,
    }))
    const { x, y } = rankedCandidates.reduce((best, candidate) => {
      if (candidate.hardOverlap !== best.hardOverlap) return candidate.hardOverlap < best.hardOverlap ? candidate : best
      if (candidate.softOverlap !== best.softOverlap) return candidate.softOverlap < best.softOverlap ? candidate : best
      return candidate.distanceRank < best.distanceRank ? candidate : best
    })
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
  function surfaceNodeRectStyle(
    node: CanvasNode,
    role: CanvasNodeGeometryRole = 'content',
  ): Record<string, string> {
    const viewport = options.getViewport()
    const rect = canvasNodeWorldRect(node, role)
    const position = worldToSurface({ x: rect.left, y: rect.top }, viewport)
    if (role === 'composer') {
      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transform: `scale(${viewport.zoom})`,
        transformOrigin: 'top left',
      }
    }
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${rect.width * viewport.zoom}px`,
      height: `${rect.height * viewport.zoom}px`,
      '--canvas-surface-zoom': `${viewport.zoom}`,
    }
  }
  function statusBadgeStyle() {
    const zoom = options.getViewport().zoom
    return { left: `${16 * zoom}px`, top: `${14 * zoom}px`, transform: `scale(${Math.min(zoom, 1.2)})`, transformOrigin: 'top left' }
  }
  function statusLabel(status: StatusVisualState) {
    if (status === 'running') return '运行中'
    if (status === 'success') return '已完成'
    return '生成失败'
  }
  return {
    nodeAppearances, nodePositions, selectionAggregateHullStyle, selectionToolbarStyle, stageNotice, statusBadgeStyle,
    statusIconMap, statusLabel, statusNodes, surfaceNodeRectStyle,
  }
}
