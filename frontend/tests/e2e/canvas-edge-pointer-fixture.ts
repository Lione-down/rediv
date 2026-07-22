import type { Locator, Page } from '@playwright/test'

export async function clickCanvasEdgeOutsideNodes(page: Page, edge: Locator) {
  const fractions = Array.from({ length: 19 }, (_, index) => (index + 1) / 20)
    .sort((left, right) => Math.abs(left - 0.5) - Math.abs(right - 0.5))
  for (const fraction of fractions) {
    const point = await edge.evaluate((element, requestedFraction) => {
      const path = element as SVGPathElement
      const matrix = path.getScreenCTM()
      if (!matrix) return null
      const pathPoint = path.getPointAtLength(path.getTotalLength() * requestedFraction)
      const screenPoint = new DOMPoint(pathPoint.x, pathPoint.y).matrixTransform(matrix)
      return { x: screenPoint.x, y: screenPoint.y }
    }, fraction)
    if (!point) continue
    await page.mouse.click(point.x, point.y)
    if (await page.locator('.connection-line.selected').count()) return
    await page.keyboard.press('Escape')
  }
  await edge.focus()
  await edge.press('Enter')
  if (await page.locator('.connection-line.selected').count()) return
  throw new Error('Connection has no pointer-selectable segment outside nodes')
}
