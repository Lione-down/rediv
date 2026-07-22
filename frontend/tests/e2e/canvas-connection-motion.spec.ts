import { expect, test } from '@playwright/test'
import {
  CANVAS_CONNECTION_FLOW_DASH_PATTERN,
  CANVAS_CONNECTION_FLOW_PATH_LENGTH,
  CANVAS_CONNECTION_FLOW_SEGMENT_COUNT,
  resolveCanvasConnectionMotion,
} from '../../src/components/canvas/canvas-connection-motion'
import * as connectionMotion from '../../src/components/canvas/canvas-connection-motion'

test('connection motion is limited to local hover, draft, selection, and included provenance', () => {
  expect(resolveCanvasConnectionMotion({ isDraft: true })).toBe('draft')
  expect(resolveCanvasConnectionMotion({ isSelected: true })).toBe('selected')
  expect(resolveCanvasConnectionMotion({ isHovered: true } as Parameters<typeof resolveCanvasConnectionMotion>[0])).toBe('hover')
  expect(resolveCanvasConnectionMotion({ isProvenance: true, isIncluded: true })).toBe('provenance')
  expect(resolveCanvasConnectionMotion({ isProvenance: true, isIncluded: false })).toBeNull()
  expect(resolveCanvasConnectionMotion({})).toBeNull()
})

test('connection flow duration is exactly three seconds', () => {
  expect((connectionMotion as typeof connectionMotion & { CANVAS_CONNECTION_FLOW_DURATION_MS?: number }).CANVAS_CONNECTION_FLOW_DURATION_MS).toBe(3000)
})

test('connection flow uses exactly three bounded normalized segments', () => {
  expect(CANVAS_CONNECTION_FLOW_SEGMENT_COUNT).toBe(3)
  expect(CANVAS_CONNECTION_FLOW_PATH_LENGTH).toBe(1)
  expect(CANVAS_CONNECTION_FLOW_DASH_PATTERN).toBe('0.08 0.253333')
})
