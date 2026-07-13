import type { DropdownDividerOption, DropdownOption } from 'naive-ui'
import { computed, ref } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import { surfaceToWorld, type Point, type ViewportState } from '../canvas-geometry'

interface NativeMenuEvent extends MouseEvent { pointerId?: number }
interface LeaferMenuEvent { origin?: NativeMenuEvent }
interface ContextMenuState {
  show: boolean
  x: number
  y: number
  nodeId: string | null
  worldPoint: Point
}
interface CanvasContextMenuOptions {
  cancelActiveInteraction: () => boolean
  findNodeAtWorldPoint: (point: Point) => CanvasNode | null
  getViewport: () => ViewportState
  isReadOnly: () => boolean
  toSurfacePoint: (clientX: number, clientY: number) => Point | null
}

type ContextMenuKey = 'create-text' | 'create-image' | 'duplicate-node' | 'delete-node'

export function useCanvasContextMenu(options: CanvasContextMenuOptions) {
  const canvasStore = useCanvasStore()
  const contextMenu = ref<ContextMenuState>({ show: false, x: 0, y: 0, nodeId: null, worldPoint: { x: 0, y: 0 } })
  const contextMenuOptions = computed<Array<DropdownOption | DropdownDividerOption>>(() => contextMenu.value.nodeId
    ? [
        { label: '复制节点', key: 'duplicate-node' },
        { type: 'divider', key: 'node-actions-divider' },
        { label: '删除节点', key: 'delete-node' },
      ]
    : [
        { label: '新建文本节点', key: 'create-text' },
        { label: '新建图片节点', key: 'create-image' },
      ])

  function closeContextMenu() { contextMenu.value.show = false }
  function updateContextMenuShow(show: boolean) { contextMenu.value.show = show }
  function getNodeDraft(type: 'text' | 'image', point: Point) {
    const label = type === 'text' ? '文本节点' : '图片节点'
    return {
      type,
      title: `${label} ${canvasStore.nodes.filter((node) => node.type === type).length + 1}`,
      x: point.x,
      y: point.y,
      width: 240,
      height: 140,
      status: 'idle' as const,
      content: type === 'text' ? '输入提示词或说明' : '添加图片提示词或素材',
    }
  }
  async function createAndSelectNode(draft: Omit<CanvasNode, 'id'>) {
    try {
      const createdNode = await canvasStore.createNode(draft)
      canvasStore.selectNode(createdNode.id)
    } catch { /* Store reports the owned failure. */ }
  }
  function handleContextMenu(event: LeaferMenuEvent) {
    const origin = event.origin
    const surfacePoint = origin ? options.toSurfacePoint(origin.clientX, origin.clientY) : null
    if (!origin || !surfacePoint || !canvasStore.activeProjectId || !canvasStore.hasLoaded) return
    origin.preventDefault()
    if (options.isReadOnly()) return
    options.cancelActiveInteraction()
    const worldPoint = surfaceToWorld(surfacePoint, options.getViewport())
    const resolvedNodeId = options.findNodeAtWorldPoint(worldPoint)?.id ?? null
    if (resolvedNodeId && !canvasStore.selectedNodeIds.includes(resolvedNodeId)) canvasStore.selectNode(resolvedNodeId)
    contextMenu.value = { show: true, x: origin.clientX, y: origin.clientY, nodeId: resolvedNodeId, worldPoint }
  }
  function handleStageDoubleClick(event: LeaferMenuEvent) {
    const origin = event.origin
    const surfacePoint = origin ? options.toSurfacePoint(origin.clientX, origin.clientY) : null
    if (
      options.isReadOnly() || !surfacePoint || !canvasStore.activeProjectId || !canvasStore.hasLoaded ||
      canvasStore.mode === 'hand' || canvasStore.mode === 'generate'
    ) return
    const worldPoint = surfaceToWorld(surfacePoint, options.getViewport())
    if (options.findNodeAtWorldPoint(worldPoint)) return
    closeContextMenu()
    void createAndSelectNode(getNodeDraft(canvasStore.mode === 'image' ? 'image' : 'text', worldPoint))
  }
  function handleContextMenuSelect(key: string | number) {
    if (options.isReadOnly()) return closeContextMenu()
    const action = key as ContextMenuKey
    const { nodeId, worldPoint } = contextMenu.value
    closeContextMenu()
    if (action === 'create-text' || action === 'create-image') {
      void createAndSelectNode(getNodeDraft(action === 'create-text' ? 'text' : 'image', worldPoint))
      return
    }
    const node = nodeId ? canvasStore.findNodeById(nodeId) : null
    if (!node) return
    if (action === 'duplicate-node') {
      void createAndSelectNode({
        type: node.type, title: `${node.title} 副本`, x: node.x + 32, y: node.y + 32,
        width: node.width, height: node.height, status: 'idle', content: node.content,
        contentData: node.contentData ? { ...node.contentData } : undefined,
      })
    } else if (action === 'delete-node') {
      void canvasStore.deleteNode(node.id).catch(() => undefined)
    }
  }

  return {
    closeContextMenu, contextMenu, contextMenuOptions, handleContextMenu,
    handleContextMenuSelect, handleStageDoubleClick, updateContextMenuShow,
  }
}
