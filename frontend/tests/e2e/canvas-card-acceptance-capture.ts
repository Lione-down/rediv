import { Buffer } from 'node:buffer'
import type { Page } from '@playwright/test'
import type { ResourceMockState } from './canvas-resource-generation-fixture'

interface ScreenRect { height: number; width: number; x: number; y: number }

interface CaptureViewport { height: number; width: number }

export const ACCEPTANCE_LANDSCAPE_URL = 'https://media.revid.test/acceptance-landscape-640.svg'

export function configureLandscapeMaterializedAcceptance(state: ResourceMockState, canvasId: string) {
  state.capturedFrames['/acceptance-landscape-640.svg'] = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#17152a"/><circle cx="320" cy="180" r="118" fill="#7258f4"/><circle cx="282" cy="164" r="28" fill="#f4efff"/><circle cx="358" cy="164" r="28" fill="#f4efff"/><path d="M260 236 Q320 280 380 236" fill="none" stroke="#f4efff" stroke-width="16" stroke-linecap="round"/></svg>')
  state.documents[canvasId].nodes = state.documents[canvasId].nodes.filter((node) => node.id !== 'script-source')
  const result = state.documents[canvasId].nodes.find((node) => node.id === 'result-existing')!
  result.content = { ...(result.content as Record<string, unknown>), url: ACCEPTANCE_LANDSCAPE_URL, width: 640, height: 360 }
  const asset = state.assets.find((candidate) => candidate.id === 'asset-generated')!
  asset.url = ACCEPTANCE_LANDSCAPE_URL
}

export async function parkAcceptancePointer(page: Page) {
  await page.mouse.move(4, 4)
  await page.evaluate(() => new Promise<void>((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))))
}

export function resolveAcceptanceCaptureClip(
  boxes: readonly ScreenRect[],
  viewport: CaptureViewport,
  padding = 12,
): ScreenRect {
  const left = Math.max(0, Math.floor(Math.min(...boxes.map((box) => box.x)) - padding))
  const top = Math.max(0, Math.floor(Math.min(...boxes.map((box) => box.y)) - padding))
  const right = Math.min(
    viewport.width,
    Math.ceil(Math.max(...boxes.map((box) => box.x + box.width)) + padding),
  )
  const bottom = Math.min(
    viewport.height,
    Math.ceil(Math.max(...boxes.map((box) => box.y + box.height)) + padding),
  )
  return { x: left, y: top, width: right - left, height: bottom - top }
}
