import { expect, test, type Page } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createLibTvParityState } from './canvas-libtv-parity-fixture'
import { documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'

interface Rect {
  height: number
  width: number
  x: number
  y: number
}

interface Landmark {
  id: string
  measurement: 'dom' | 'world'
  rect: Rect
  revid_node_id: string
}

interface ComparisonContract {
  exclusions: Array<{ classification: string; id: string }>
  landmarks: Landmark[]
  thresholds: {
    geometry_tolerance_css_px: number
    structural_edge_difference_percent: number
  }
  viewport: { height: number; width: number }
}

const contractPath = resolve(process.cwd(), '..', 'ai', 'evidence', 't5-096', 'comparison-contract-2026-07-20.json')
const resultPath = resolve(process.cwd(), '..', 'output', 't5-096', 'revid', '2026-07-20', 'revid-structural-parity-result.json')

function edgeSet(rectangles: Rect[]) {
  const points = new Set<string>()
  const add = (x: number, y: number) => points.add(`${x},${y}`)
  for (const rect of rectangles) {
    const left = Math.round(rect.x)
    const top = Math.round(rect.y)
    const right = Math.round(rect.x + rect.width)
    const bottom = Math.round(rect.y + rect.height)
    for (let x = left; x <= right; x += 1) {
      add(x, top)
      add(x, bottom)
    }
    for (let y = top; y <= bottom; y += 1) {
      add(left, y)
      add(right, y)
    }
  }
  return points
}

function unmatchedCount(source: Set<string>, target: Set<string>, tolerance: number) {
  let unmatched = 0
  for (const point of source) {
    const [x, y] = point.split(',').map(Number)
    let matched = false
    for (let deltaX = -tolerance; deltaX <= tolerance && !matched; deltaX += 1) {
      for (let deltaY = -tolerance; deltaY <= tolerance; deltaY += 1) {
        if (target.has(`${x + deltaX},${y + deltaY}`)) {
          matched = true
          break
        }
      }
    }
    if (!matched) unmatched += 1
  }
  return unmatched
}

function structuralEdgeDifferencePercent(expected: Rect[], actual: Rect[], tolerance: number) {
  const expectedEdges = edgeSet(expected)
  const actualEdges = edgeSet(actual)
  const unmatched = unmatchedCount(expectedEdges, actualEdges, tolerance) + unmatchedCount(actualEdges, expectedEdges, tolerance)
  return (unmatched / (expectedEdges.size + actualEdges.size)) * 100
}

async function domRect(page: Page, nodeId: string) {
  const box = await page.locator(`.canvas-node-surface[data-node-id="${nodeId}"]`).boundingBox()
  expect(box, `missing DOM surface for ${nodeId}`).not.toBeNull()
  return box!
}

async function runtimeRect(page: Page, nodeId: string) {
  const surface = page.locator('.canvas-surface')
  await expect.poll(() => surface.evaluate((element, id) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect: (nodeId: string) => Rect | null }
    }).__revidCanvasInspection?.getNodeScreenRect(id) ?? null
  ), nodeId)).not.toBeNull()
  return surface.evaluate((element, id) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect: (nodeId: string) => Rect | null }
    }).__revidCanvasInspection!.getNodeScreenRect(id)!
  ), nodeId)
}

function expectRectWithinTolerance(actual: Rect, expected: Rect, tolerance: number, label: string) {
  for (const field of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual[field] - expected[field]), `${label}.${field}: ${actual[field]} vs ${expected[field]}`).toBeLessThanOrEqual(tolerance)
  }
}

test('L096-STRUCTURAL-EDGE-CONTRACT keeps the public clean-room graph within two percent', async ({ page }) => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8')) as ComparisonContract
  const state = createLibTvParityState()
  await openResourceWorkspace(page, state, contract.viewport, { enableCanvasInspection: true })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+0')

  const actualById = new Map<string, Rect>()

  for (const landmark of contract.landmarks) {
    if (landmark.measurement === 'dom') {
      const dom = await domRect(page, landmark.revid_node_id)
      const runtime = await runtimeRect(page, landmark.revid_node_id)
      expectRectWithinTolerance(dom, runtime, contract.thresholds.geometry_tolerance_css_px, `${landmark.id}.dom_runtime`)
      actualById.set(landmark.id, dom)
      continue
    }
    actualById.set(landmark.id, await runtimeRect(page, landmark.revid_node_id))
  }

  const tolerance = contract.thresholds.geometry_tolerance_css_px
  const expectedRects = contract.landmarks.map((landmark) => landmark.rect)
  const actualRects = contract.landmarks.map((landmark) => actualById.get(landmark.id)!)
  const difference = structuralEdgeDifferencePercent(expectedRects, actualRects, tolerance)
  const diagnostics = contract.landmarks.map((landmark) => ({
    actual: actualById.get(landmark.id),
    expected: landmark.rect,
    id: landmark.id,
  }))

  for (const landmark of contract.landmarks) {
    expectRectWithinTolerance(actualById.get(landmark.id)!, landmark.rect, tolerance, landmark.id)
  }

  await mkdir(dirname(resultPath), { recursive: true })
  await writeFile(resultPath, `${JSON.stringify({
    difference_percent: difference,
    landmarks: diagnostics,
    passed: difference <= contract.thresholds.structural_edge_difference_percent,
    threshold_percent: contract.thresholds.structural_edge_difference_percent,
    tolerance_css_px: tolerance,
  }, null, 2)}\n`, 'utf8')

  expect(difference, JSON.stringify(diagnostics, null, 2)).toBeLessThanOrEqual(
    contract.thresholds.structural_edge_difference_percent,
  )
  expect(contract.exclusions).toContainEqual(expect.objectContaining({
    id: 'official_director_console',
    classification: 'HUMAN_EXCLUDED_NOT_APPLICABLE',
  }))
  expect(state.documents['canvas-first'].nodes.some((node) => /director|导演台/i.test(`${node.id} ${node.node_type} ${node.content.title ?? ''}`))).toBe(false)
  expect(documentPatches(state)).toHaveLength(0)
})
