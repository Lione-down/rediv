import { expect, test } from '@playwright/test'
import {
  resolveCanvasCardInteractionPresentation,
  type CanvasCardInteractionInput,
} from '../../src/components/canvas/canvas-card-interaction-presentation'

const idle: CanvasCardInteractionInput = {
  bodyKind: 'authoring',
  isCompatibleDrag: false,
  isFocused: false,
  isHovered: false,
  isLocked: false,
  isReadOnly: false,
  isSelected: false,
  lifecycleTone: 'none',
  reducedMotion: false,
}

test('card interaction states preserve geometry while selection gains semantic emphasis', () => {
  const idlePresentation = resolveCanvasCardInteractionPresentation(idle)
  const selected = resolveCanvasCardInteractionPresentation({ ...idle, isSelected: true })

  expect(idlePresentation).toMatchObject({
    state: 'idle', cornerRadius: 12, outlineTone: 'subtle', outlineWidth: 1, shadowTone: 'none', translateY: 0, scale: 1,
  })
  expect(selected).toMatchObject({
    state: 'selected', cornerRadius: 12, outlineTone: 'selected', outlineWidth: 1.5, shadowTone: 'selected', translateY: 0, scale: 1,
  })
})

test('card state priority fails closed for locked and readonly nodes', () => {
  expect(resolveCanvasCardInteractionPresentation({
    ...idle, isCompatibleDrag: true, isFocused: true, isHovered: true, isLocked: true, isSelected: true,
  })).toMatchObject({ state: 'locked', outlineTone: 'disabled', portsVisible: false, shadowTone: 'none' })
  expect(resolveCanvasCardInteractionPresentation({
    ...idle, isCompatibleDrag: true, isFocused: true, isHovered: true, isReadOnly: true, isSelected: true,
  })).toMatchObject({ state: 'readonly', outlineTone: 'disabled', portsVisible: false, shadowTone: 'none' })
})

test('hover focus compatible drag and lifecycle states expose deterministic port and outline semantics', () => {
  expect(resolveCanvasCardInteractionPresentation({ ...idle, isHovered: true })).toMatchObject({ state: 'hover', portOpacity: 1, portsVisible: true })
  expect(resolveCanvasCardInteractionPresentation({ ...idle, isFocused: true })).toMatchObject({ state: 'focus', outlineTone: 'focus', portOpacity: 1 })
  expect(resolveCanvasCardInteractionPresentation({ ...idle, isCompatibleDrag: true })).toMatchObject({ state: 'compatible-drag', outlineTone: 'compatible', portOpacity: 1 })
  expect(resolveCanvasCardInteractionPresentation({ ...idle, lifecycleTone: 'progress' })).toMatchObject({ state: 'lifecycle-progress', outlineTone: 'warning', shadowTone: 'warning' })
  expect(resolveCanvasCardInteractionPresentation({ ...idle, lifecycleTone: 'danger' })).toMatchObject({ state: 'lifecycle-danger', outlineTone: 'danger', shadowTone: 'danger' })
})

test('idle port disclosure and reduced motion are deterministic', () => {
  expect(resolveCanvasCardInteractionPresentation(idle)).toMatchObject({ portOpacity: 0.16, portsVisible: true, transitionDurationMs: 150 })
  expect(resolveCanvasCardInteractionPresentation({ ...idle, bodyKind: 'media', reducedMotion: true })).toMatchObject({
    cornerRadius: 12, transitionDurationMs: 0,
  })
})
