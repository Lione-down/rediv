import { expect, test } from '@playwright/test'
import {
  CANVAS_CONNECTION_FLOW_DASH_PATTERN,
  CANVAS_CONNECTION_FLOW_PATH_LENGTH,
  CANVAS_CONNECTION_FLOW_SEGMENT_COUNT,
  resolveCanvasConnectionMotion,
} from '../../src/components/canvas/canvas-connection-motion'

test('connection motion is limited to draft, selection, and included provenance', () => {
  expect(resolveCanvasConnectionMotion({ isDraft: true })).toBe('draft')
  expect(resolveCanvasConnectionMotion({ isSelected: true })).toBe('selected')
  expect(resolveCanvasConnectionMotion({ isProvenance: true, isIncluded: true })).toBe('provenance')
  expect(resolveCanvasConnectionMotion({ isProvenance: true, isIncluded: false })).toBeNull()
  expect(resolveCanvasConnectionMotion({})).toBeNull()
})

test('connection flow uses exactly three bounded normalized segments', () => {
  expect(CANVAS_CONNECTION_FLOW_SEGMENT_COUNT).toBe(3)
  expect(CANVAS_CONNECTION_FLOW_PATH_LENGTH).toBe(1)
  expect(CANVAS_CONNECTION_FLOW_DASH_PATTERN).toBe('0.08 0.253333')
})
