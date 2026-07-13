import type { DropdownDividerOption, DropdownOption } from 'naive-ui'
import { computed, ref } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import { surfaceToWorld, type Point, type ViewportState } from '../canvas-geometry'
import { useCanvasCommandInteractions } from './use-canvas-command-interactions'

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

type ContextMenuKey = 'create-text' | 'create-image' | 'duplicate-node' | 'group-nodes' | 'ungroup-nodes' | 'connect-nodes' | 'delete-node'

export function useCanvasContextMenu(options: CanvasContextMenuOptions) {
  const canvasStore = useCanvasStore()
  const {
    canConnectSelection, canDuplicateSelection, canGroupSelection, canUngroupSelection,
    connectSelection, deleteSelection, duplicateSelection, groupSelection, ungroupSelection,
  } = useCanvasCommandInteractions({ isReadOnly: options.isReadOnly })
  const contextMenu = ref<ContextMenuState>({ show: false, x: 0, y: 0, nodeId: null, worldPoint: { x: 0, y: 0 } })
  const contextMenuOptions = computed<Array<DropdownOption | DropdownDividerOption>>(() => contextMenu.value.nodeId
    ? [
        ...(canDuplicateSelection() ? [{ label: canvasStore.selectedNodeIds.length > 1 ? `复制所选节点 (${canvasStore.selectedNodeIds.length})` : '复制节点', key: 'duplicate-node' }] : []),
        ...(canGroupSelection() ? [{ label: '组合所选节点', key: 'group-nodes' }] : []),
        ...(canUngroupSelection() ? [{ label: '取消组合', key: 'ungroup-nodes' }] : []),
        ...(canConnectSelection() ? [{ label: '连接所选两个节点', key: 'connect-nodes' }] : []),
        { type: 'divider', key: 'node-actions-divider' },
        { label: canvasStore.selectedNodeIds.length > 1 ? `删除所选节点 (${canvasStore.selectedNodeIds.length})` : '删除节点', key: 'delete-node' },
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
  function openContextMenu(origin?: NativeMenuEvent) {
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
  function handleContextMenu(event: LeaferMenuEvent) { openContextMenu(event.origin) }
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
    if (!nodeId || !canvasStore.findNodeById(nodeId)) return
    if (action === 'duplicate-node') {
      duplicateSelection('context-menu')
    } else if (action === 'group-nodes') {
      groupSelection('context-menu')
    } else if (action === 'ungroup-nodes') {
      ungroupSelection('context-menu')
    } else if (action === 'connect-nodes') {
      connectSelection('context-menu')
    } else if (action === 'delete-node') {
      deleteSelection('context-menu')
    }
  }

  return {
    closeContextMenu, contextMenu, contextMenuOptions, handleContextMenu,
    handleContextMenuSelect, handleStageDoubleClick, updateContextMenuShow,
  }
}
