import type { Ref } from 'vue'
import { isCanvasEditableTarget } from './use-canvas-command-interactions'

interface CanvasStageKeyboardOptions {
  stageRef: Ref<HTMLElement | null>
  isSpacePressed: Ref<boolean>
  isGraphPanelOpen: Ref<boolean>
  isContextMenuOpen: () => boolean
  selectedConnectionId: () => string
  cancelActiveInteraction: () => boolean
  clearConnectionSelection: () => void
  clearNodeSelection: () => void
  closeContextMenu: () => void
  closeGraphPanel: () => void
  toggleGraphPanel: () => void
  handleCommandKeyDown: (event: KeyboardEvent) => boolean
}

export function useCanvasStageKeyboard(options: CanvasStageKeyboardOptions) {
  function isCanvasFocusOwned(target: EventTarget | null) {
    return Boolean(options.stageRef.value && target instanceof Node && options.stageRef.value.contains(target))
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (!isCanvasFocusOwned(event.target)) return
    if (event.key === ' ') {
      options.isSpacePressed.value = true
      if (!isCanvasEditableTarget(event.target)) event.preventDefault()
    }
    if (isCanvasEditableTarget(event.target)) return
    if (event.key === 'Escape') {
      if (options.isGraphPanelOpen.value) return options.closeGraphPanel()
      if (options.isContextMenuOpen()) return options.closeContextMenu()
      if (!options.cancelActiveInteraction()) {
        if (options.selectedConnectionId()) options.clearConnectionSelection()
        else options.clearNodeSelection()
      }
      return
    }
    if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
      event.preventDefault()
      options.toggleGraphPanel()
      return
    }
    options.handleCommandKeyDown(event)
  }

  function handleWindowKeyUp(event: KeyboardEvent) {
    if (event.key === ' ') options.isSpacePressed.value = false
  }

  return { handleWindowKeyDown, handleWindowKeyUp }
}
