import type { DropdownDividerOption, DropdownOption } from 'naive-ui'
import { computed, ref } from 'vue'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import {
  createRegistryNodeDraft,
  getCreatableNodeDefinitions,
  type CanonicalNodeType,
} from '../../../modules/canvas/node-registry'
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
  onOpenSurface?: () => void
  toSurfacePoint: (clientX: number, clientY: number) => Point | null
}

type ContextMenuKey =
  | `create-node:${CanonicalNodeType}` | 'duplicate-node' | 'group-nodes' | 'ungroup-nodes'
  | 'connect-nodes' | 'delete-node' | 'align-left' | 'align-center-x' | 'align-right'
  | 'align-top' | 'align-center-y' | 'align-bottom' | 'distribute-horizontal'
  | 'distribute-vertical' | 'auto-arrange' | 'toggle-lock'

export function useCanvasContextMenu(options: CanvasContextMenuOptions) {
  const canvasStore = useCanvasStore()
  const {
    alignSelection, autoArrange, canAlignSelection, canAutoArrange, canConnectSelection,
    canDeleteSelection, canDistributeSelection, canDuplicateSelection, canGroupSelection,
    canToggleLockSelection, canUngroupSelection, connectSelection, deleteSelection,
    distributeSelection, duplicateSelection, groupSelection, hasLockedSelection,
    toggleLockSelection, ungroupSelection,
  } = useCanvasCommandInteractions({ isReadOnly: options.isReadOnly })
  const contextMenu = ref<ContextMenuState>({ show: false, x: 0, y: 0, nodeId: null, worldPoint: { x: 0, y: 0 } })
  const contextMenuOptions = computed<Array<DropdownOption | DropdownDividerOption>>(() => contextMenu.value.nodeId
    ? [
        ...(canDuplicateSelection() ? [{ label: canvasStore.selectedNodeIds.length > 1 ? `复制所选节点 (${canvasStore.selectedNodeIds.length})` : '复制节点', key: 'duplicate-node' }] : []),
        ...(canGroupSelection() ? [{ label: '组合所选节点', key: 'group-nodes' }] : []),
        ...(canUngroupSelection() ? [{ label: '取消组合', key: 'ungroup-nodes' }] : []),
        ...(canConnectSelection() ? [{ label: '连接所选两个节点', key: 'connect-nodes' }] : []),
        ...((canAlignSelection() || canDistributeSelection() || canAutoArrange()) ? [{
          label: '排列', key: 'arrange-nodes', children: [
            ...(canAlignSelection() ? [
              { label: '左对齐', key: 'align-left' }, { label: '水平居中', key: 'align-center-x' },
              { label: '右对齐', key: 'align-right' }, { label: '顶部对齐', key: 'align-top' },
              { label: '垂直居中', key: 'align-center-y' }, { label: '底部对齐', key: 'align-bottom' },
            ] : []),
            ...(canDistributeSelection() ? [
              { label: '水平分布', key: 'distribute-horizontal' }, { label: '垂直分布', key: 'distribute-vertical' },
            ] : []),
            ...(canAutoArrange() ? [{ label: '自动排列', key: 'auto-arrange' }] : []),
          ],
        }] : []),
        ...(canToggleLockSelection() ? [{ label: hasLockedSelection() ? '解锁所选节点' : '锁定所选节点', key: 'toggle-lock' }] : []),
        ...(canDeleteSelection() ? [
          { type: 'divider', key: 'node-actions-divider' },
          { label: canvasStore.selectedNodeIds.length > 1 ? `删除所选节点 (${canvasStore.selectedNodeIds.length})` : '删除节点', key: 'delete-node' },
        ] : []),
      ]
    : [
        ...getCreatableNodeDefinitions().map((definition) => ({
          label: `新建${definition.label}节点`,
          key: `create-node:${definition.type}`,
        })),
      ])

  function closeContextMenu() { contextMenu.value.show = false }
  function updateContextMenuShow(show: boolean) { contextMenu.value.show = show }
  async function createAndSelectNode(draft: Omit<CanvasNode, 'id'>) {
    try {
      const createdNode = await canvasStore.createNode(draft)
      canvasStore.selectNode(createdNode.id)
      return createdNode
    } catch { return null /* Store reports the owned failure. */ }
  }
  async function createRegistryNodeAt(type: CanonicalNodeType, point: Point, subtype?: string) {
    const definition = getCreatableNodeDefinitions().find((candidate) => candidate.type === type)
    if (!definition) return null
    const draft = createRegistryNodeDraft(type, subtype ?? definition.defaultSubtype, point)
    const created = await createAndSelectNode(draft)
    return created ?? null
  }
  function openContextMenu(origin?: NativeMenuEvent) {
    const surfacePoint = origin ? options.toSurfacePoint(origin.clientX, origin.clientY) : null
    if (!origin || !surfacePoint || !canvasStore.activeProjectId || !canvasStore.hasLoaded) return
    origin.preventDefault()
    if (options.isReadOnly()) return
    options.onOpenSurface?.()
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
      canvasStore.mode === 'hand'
    ) return
    const worldPoint = surfaceToWorld(surfacePoint, options.getViewport())
    if (options.findNodeAtWorldPoint(worldPoint)) return
    closeContextMenu()
    const type = canvasStore.mode === 'image'
      ? 'asset'
      : canvasStore.mode === 'generate' ? 'generation' : 'script'
    void createRegistryNodeAt(type, worldPoint)
  }
  function handleContextMenuSelect(key: string | number) {
    if (options.isReadOnly()) return closeContextMenu()
    const action = key as ContextMenuKey
    const { nodeId, worldPoint } = contextMenu.value
    closeContextMenu()
    if (action.startsWith('create-node:')) {
      void createRegistryNodeAt(action.slice('create-node:'.length) as CanonicalNodeType, worldPoint)
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
    } else if (action.startsWith('align-')) {
      alignSelection('context-menu', action.slice('align-'.length) as Parameters<typeof alignSelection>[1])
    } else if (action.startsWith('distribute-')) {
      distributeSelection('context-menu', action.slice('distribute-'.length) as Parameters<typeof distributeSelection>[1])
    } else if (action === 'auto-arrange') {
      autoArrange('context-menu')
    } else if (action === 'toggle-lock') {
      toggleLockSelection('context-menu')
    } else if (action === 'delete-node') {
      deleteSelection('context-menu')
    }
  }

  return {
    closeContextMenu, contextMenu, contextMenuOptions, createRegistryNodeAt, handleContextMenu,
    handleContextMenuSelect, handleStageDoubleClick, updateContextMenuShow,
  }
}
