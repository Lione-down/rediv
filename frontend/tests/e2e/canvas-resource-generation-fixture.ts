import { expect, type Page } from '@playwright/test'
import { installResourceMockApi } from './canvas-resource-generation-api-fixture'
import { FIRST_CANVAS_ID, PROJECT_ID, type ResourceMockState } from './canvas-resource-generation-state-fixture'

export {
  API_ORIGIN, APP_ORIGIN, PROJECT_ID, FIRST_CANVAS_ID, SECOND_CANVAS_ID,
  type MockRequest, type ResourceMockState, createResourceMockState,
  addProjectImageNode, addEarlierVariant, addTwoOriginMerge, addCinematicVideoNode,
} from './canvas-resource-generation-state-fixture'
export { installResourceMockApi } from './canvas-resource-generation-api-fixture'

export async function openResourceWorkspace(
  page: Page,
  state: ResourceMockState,
  viewport = { width: 1440, height: 900 },
  options: { enableCanvasInspection?: boolean } = {},
) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installResourceMockApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'resource-token'))
  const inspectionQuery = options.enableCanvasInspection ? '?revidCanvasInspection=1' : ''
  await page.goto(`/app/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}${inspectionQuery}`)
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
}

export function documentPatches(state: ResourceMockState, canvasId = FIRST_CANVAS_ID) {
  return state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith(`/canvases/${canvasId}/document`))
}
