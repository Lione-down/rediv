import type { Ref } from 'vue'
import { isCanvasEditableTarget } from './use-canvas-command-interactions'

interface CanvasStageKeyboardOptions {
  stageRef: Ref<HTMLElement | null>
  isSpacePressed: Ref<boolean>
  isGraphPanelOpen: Ref<boolean>
  isNodeMenuOpen: Ref<boolean>
  isReadOnly: () => boolean
  isInteractionActive: () => boolean
  isProfessionalActionsBlocked: () => boolean
  isContextMenuOpen: () => boolean
  selectedConnectionId: () => string
  cancelActiveInteraction: () => boolean
  clearConnectionSelection: () => void
  clearNodeSelection: () => void
  closeContextMenu: () => void
  closeGraphPanel: () => void
  onGraphPanelClosed: () => void
  closeNodeMenu: () => void
  openNodeMenu: () => void
  openProfessionalActions: (opener: HTMLElement) => void
  toggleGraphPanel: () => void
  handleViewKeyDown: (event: KeyboardEvent) => boolean
  handleCommandKeyDown: (event: KeyboardEvent) => boolean
}

export function useCanvasStageKeyboard(options: CanvasStageKeyboardOptions) {
  function isCanvasFocusOwned(target: EventTarget | null) {
    return Boolean(options.stageRef.value && target instanceof Node && options.stageRef.value.contains(target))
  }

  function isNodeMenuShortcutTarget(target: EventTarget | null) {
    return target === options.stageRef.value
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return isCanvasEditableTarget(target) || Boolean(
      target instanceof Element && target.closest(
        'button, a, [role="button"], [role="option"], [role="menuitem"]',
      ),
    )
  }

  function isCanvasPanShortcutTarget(target: EventTarget | null) {
    if (isInteractiveTarget(target)) return false
    return target === options.stageRef.value || Boolean(
      target instanceof Element && target.closest('.canvas-surface'),
    )
  }

  function closeGraphPanelAndRestoreFocus() {
    options.closeGraphPanel()
    options.onGraphPanelClosed()
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (!isCanvasFocusOwned(event.target)) return
    const dialogTarget = event.target instanceof Element && Boolean(event.target.closest('[role="dialog"]'))
    if (dialogTarget) {
      if (event.key === 'Escape' && options.isGraphPanelOpen.value) closeGraphPanelAndRestoreFocus()
      return
    }
    if (event.key === ' ' && isCanvasPanShortcutTarget(event.target)) {
      options.isSpacePressed.value = true
      event.preventDefault()
    }
    if (isInteractiveTarget(event.target)) return
    if (event.key === 'Escape') {
      if (options.isNodeMenuOpen.value) return options.closeNodeMenu()
      if (options.isGraphPanelOpen.value) return closeGraphPanelAndRestoreFocus()
      if (options.isContextMenuOpen()) return options.closeContextMenu()
      if (!options.cancelActiveInteraction()) {
        if (options.selectedConnectionId()) options.clearConnectionSelection()
        else options.clearNodeSelection()
      }
      return
    }
    if (
      event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey &&
      isNodeMenuShortcutTarget(event.target) && !options.isReadOnly() && !options.isNodeMenuOpen.value
    ) {
      event.preventDefault()
      options.openNodeMenu()
      return
    }
    if (
      event.key === '/' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey &&
      !event.isComposing && isCanvasPanShortcutTarget(event.target) && !options.isReadOnly() &&
      !options.isProfessionalActionsBlocked() && !options.isInteractionActive() && options.stageRef.value
    ) {
      event.preventDefault()
      options.openProfessionalActions(options.stageRef.value)
      return
    }
    if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
      event.preventDefault()
      options.toggleGraphPanel()
      return
    }
    if (!options.handleViewKeyDown(event)) options.handleCommandKeyDown(event)
  }

  function handleWindowKeyUp(event: KeyboardEvent) {
    if (event.key === ' ') options.isSpacePressed.value = false
  }

  return { handleWindowKeyDown, handleWindowKeyUp }
}
