import {
  canvasDocumentChecksum,
  expect,
  test,
  type LiveManifest,
} from './live-fixture'
import type { Page } from '@playwright/test'

interface ProjectResponse {
  id: string
  name: string
}

interface CanvasResponse {
  id: string
  project_id: string
  name: string
  sort_order: number
  status: string
  graph_revision: number
}

interface CanvasListResponse {
  items: CanvasResponse[]
  order_revision: number
}

interface CanvasDocumentResponse {
  canvas: CanvasResponse
  nodes: unknown[]
  connections: unknown[]
  revision: number
}

function encodedDocumentPath(projectId: string, canvasId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvases/${encodeURIComponent(canvasId)}/document`
}

function encodedCanvasListPath(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvases`
}

async function expectCanvasWorkspace(page: Page, projectId: string, canvasId: string) {
  await page.goto(`/app/projects/${encodeURIComponent(projectId)}/canvases/${encodeURIComponent(canvasId)}`)
  await expect(page).toHaveURL(new RegExp(`/app/projects/${projectId}/canvases/${canvasId}$`))
  await expect(page.locator('#canvas-main')).toBeVisible()
  await expect(page.getByRole('button', { name: /画布 1/ })).toBeVisible()
}

test('pre-restart creates a project and records its default Canvas', async ({ live, page, request }) => {
  test.skip(live.phase !== 'pre-restart', 'Only the pre-restart supervisor phase creates state')

  const session = await live.login(request, page)
  const project = await session.postJson<ProjectResponse>('/projects', {
    name: `T5-008 live ${live.runId}`.slice(0, 255),
  })
  expect(project.id).toBeTruthy()

  const canvases = await session.getJson<CanvasListResponse>(encodedCanvasListPath(project.id))
  expect(canvases.items).toHaveLength(1)
  const [canvas] = canvases.items
  expect(canvas).toMatchObject({
    project_id: project.id,
    name: '画布 1',
    sort_order: 0,
    status: 'active',
  })

  const document = await session.getJson<CanvasDocumentResponse>(
    encodedDocumentPath(project.id, canvas.id),
  )
  expect(document.canvas.id).toBe(canvas.id)
  expect(document.nodes).toHaveLength(0)
  expect(document.connections).toHaveLength(0)
  await expectCanvasWorkspace(page, project.id, canvas.id)

  const manifest: LiveManifest = {
    run: live.runId,
    project: project.id,
    canvas: canvas.id,
    checksum: canvasDocumentChecksum(document),
    revision: document.revision,
    count: {
      canvases: canvases.items.length,
      nodes: document.nodes.length,
      connections: document.connections.length,
    },
  }
  await live.writeManifest(manifest)
})

test('post-restart reauthenticates and reopens the persisted project Canvas', async ({ live, page, request }) => {
  test.skip(live.phase !== 'post-restart', 'Only the post-restart supervisor phase verifies persistence')

  const manifest = await live.readManifest()
  const session = await live.login(request, page)
  const canvases = await session.getJson<CanvasListResponse>(encodedCanvasListPath(manifest.project))
  expect(canvases.items).toHaveLength(manifest.count.canvases)
  expect(canvases.items).toContainEqual(expect.objectContaining({
    id: manifest.canvas,
    project_id: manifest.project,
    name: '画布 1',
    status: 'active',
  }))

  const document = await session.getJson<CanvasDocumentResponse>(
    encodedDocumentPath(manifest.project, manifest.canvas),
  )
  expect(document.revision).toBe(manifest.revision)
  expect(document.nodes).toHaveLength(manifest.count.nodes)
  expect(document.connections).toHaveLength(manifest.count.connections)
  expect(canvasDocumentChecksum(document)).toBe(manifest.checksum)
  await expectCanvasWorkspace(page, manifest.project, manifest.canvas)
})
