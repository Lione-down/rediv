import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T20:00:00Z'
const PROJECT_ID = 'project-revisions'
const CANVAS_ID = 'canvas-revisions'
const RECOVERY_KEY = `revid:canvas-recovery:v1:user-revisions:${PROJECT_ID}:${CANVAS_ID}`

interface RevisionState {
  conflict: boolean
  documentGets: number
  failDocumentReload: boolean
  restoreRequests: number[]
  revision: number
  nodeTitle: string
}

const user = {
  id: 'user-revisions', username: 'revision-owner', email: 'revision@example.com',
  nickname: 'Revision owner', avatar_url: '', role: 'user', status: 'active',
  generation_status: 'enabled', created_at: NOW, updated_at: NOW, last_login_at: NOW,
}

function canvas(state: RevisionState) {
  return {
    id: CANVAS_ID, project_id: PROJECT_ID, name: 'History canvas', sort_order: 0,
    status: 'active', viewport_x: 0, viewport_y: 0, viewport_zoom: 1,
    graph_revision: state.revision, created_at: NOW, updated_at: NOW, deleted_at: null,
  }
}

function node(state: RevisionState) {
  return {
    id: 'node-revision', project_id: PROJECT_ID, canvas_id: CANVAS_ID,
    node_type: 'text', content: { title: state.nodeTitle, text: state.nodeTitle },
    position_x: 120, position_y: 120, width: 240, height: 140, z_index: 0,
    parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
    created_at: NOW, updated_at: NOW,
  }
}

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(body) })
}

function revisionItems(current: number) {
  return [
    {
      revision: current, base_revision: current - 1, is_checkpoint: false,
      restored_from_revision: null, created_at: NOW,
    },
    {
      revision: 7, base_revision: 6, is_checkpoint: true,
      restored_from_revision: null, created_at: '2026-07-13T19:50:00Z',
    },
    {
      revision: 1, base_revision: 0, is_checkpoint: true,
      restored_from_revision: null, created_at: '2026-07-13T19:00:00Z',
    },
  ]
}

async function installApi(page: Page, state: RevisionState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    if (method === 'GET' && path === '/me') {
      return fulfillJson(route, { user, quotas: { text: 5, image: 3, video: 2 } })
    }
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, {
        items: [{ id: PROJECT_ID, user_id: user.id, name: 'Revision project', created_at: NOW }],
        total: 1,
      })
    }
    if (method === 'GET' && path === `/api/projects/${PROJECT_ID}/canvases`) {
      return fulfillJson(route, { items: [canvas(state)], order_revision: 0 })
    }
    if (method === 'GET' && path === `/api/projects/${PROJECT_ID}/canvases/${CANVAS_ID}/document`) {
      state.documentGets += 1
      if (state.failDocumentReload && state.documentGets > 1) {
        return fulfillJson(route, { detail: 'Document reload unavailable' }, 503)
      }
      return fulfillJson(route, {
        canvas: canvas(state), nodes: [node(state)], connections: [], revision: state.revision,
      })
    }
    if (method === 'GET' && path === `/api/projects/${PROJECT_ID}/canvases/${CANVAS_ID}/revisions`) {
      return fulfillJson(route, { items: revisionItems(state.revision), current_revision: state.revision })
    }
    const restoreMatch = path.match(
      new RegExp(`^/api/projects/${PROJECT_ID}/canvases/${CANVAS_ID}/revisions/(\\d+)/restore$`),
    )
    if (method === 'POST' && restoreMatch) {
      const target = Number(restoreMatch[1])
      state.restoreRequests.push(target)
      state.revision += 1
      state.nodeTitle = `Restored revision ${target}`
      return fulfillJson(route, {
        revision: state.revision, restored_from_revision: target, server_timestamp: NOW,
      })
    }
    if (method === 'PATCH' && path.endsWith('/document')) {
      if (state.conflict) {
        state.revision = 12
        state.nodeTitle = 'Server revision 12'
        return fulfillJson(route, {
          detail: { code: 'stale_graph_revision', current_revision: 12 },
        }, 409)
      }
      return fulfillJson(route, { detail: 'Unexpected patch' }, 500)
    }
    if (method === 'PATCH' && path.endsWith('/viewport')) return fulfillJson(route, canvas(state))
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function openCanvas(page: Page, state: RevisionState, width = 1366) {
  await page.setViewportSize({ width, height: width < 768 ? 812 : 768 })
  await installApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'revision-token'))
  await page.goto(`/app/projects/${PROJECT_ID}/canvases/${CANVAS_ID}`)
  await expect(page.locator('.canvas-surface')).toBeVisible()
  await expect(page.locator('.sync-status')).toContainText(`r${state.revision}`)
}

test('revision panel lists checkpoints and restores a retained edit to a new head', async ({ page }) => {
  const state: RevisionState = {
    conflict: false, documentGets: 0, failDocumentReload: false,
    restoreRequests: [], revision: 8, nodeTitle: 'Current revision 8',
  }
  await openCanvas(page, state)

  await page.getByRole('button', { name: '打开修订历史' }).click()
  const panel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await expect(panel).toBeVisible()
  await expect(panel).toBeFocused()
  const axe = await new AxeBuilder({ page }).include('.revision-panel').analyze()
  expect(axe.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
  await expect(panel).toContainText('r7')
  await expect(panel).toContainText('Checkpoint')
  await panel.getByRole('button', { name: '恢复修订 r7' }).click()
  await expect(panel.getByText('恢复会创建新的 head，不会改写现有历史。')).toBeVisible()
  await panel.getByRole('button', { name: '确认恢复 r7' }).click()

  await expect.poll(() => state.restoreRequests).toEqual([7])
  await expect.poll(() => state.documentGets).toBeGreaterThan(1)
  await expect(page.locator('.sync-status')).toContainText('r9')
  await expect(panel).toContainText('已从 r7 创建新 head r9')
  await panel.getByRole('button', { name: '关闭修订历史' }).click()
  await expect(page.getByRole('button', { name: '打开修订历史' })).toBeFocused()
})

test('conflict recovery offers explicit reload-latest and preserve-local-copy choices', async ({ page }) => {
  const state: RevisionState = {
    conflict: true, documentGets: 0, failDocumentReload: false,
    restoreRequests: [], revision: 8, nodeTitle: 'Current revision 8',
  }
  await openCanvas(page, state)
  await page.locator('.canvas-surface').dblclick({ position: { x: 900, y: 520 } })

  const panel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('服务器当前为 r12')
  await expect(panel.getByRole('button', { name: '加载服务器最新版本' })).toBeVisible()
  await expect(panel.getByRole('button', { name: '保留本地副本并加载最新版本' })).toBeVisible()
  await panel.getByRole('button', { name: '保留本地副本并加载最新版本' }).click()

  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  await expect.poll(() => state.documentGets).toBeGreaterThan(1)
  await expect(panel).toContainText('本地副本已保留')
})

test('mobile review can inspect history but cannot restore revisions', async ({ page }) => {
  const state: RevisionState = {
    conflict: false, documentGets: 0, failDocumentReload: false,
    restoreRequests: [], revision: 8, nodeTitle: 'Review revision',
  }
  await openCanvas(page, state, 375)
  await page.getByRole('button', { name: '打开修订历史' }).click()
  const panel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: '恢复修订 r7' })).toHaveCount(0)
  await expect(panel).toContainText('审阅模式不会修改画布历史')
})

test('reload failure keeps the local recovery copy and never claims success', async ({ page }) => {
  const state: RevisionState = {
    conflict: true, documentGets: 0, failDocumentReload: true,
    restoreRequests: [], revision: 8, nodeTitle: 'Current revision 8',
  }
  await openCanvas(page, state)
  await page.locator('.canvas-surface').dblclick({ position: { x: 900, y: 520 } })
  const panel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await panel.getByRole('button', { name: '加载服务器最新版本' }).click()

  await expect(panel).toContainText('Document reload unavailable')
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY)).not.toBeNull()
  await expect(panel).not.toContainText('已加载服务器最新版本。')
})

test('committed restore reports a local refresh failure without claiming no change', async ({ page }) => {
  const state: RevisionState = {
    conflict: false, documentGets: 0, failDocumentReload: true,
    restoreRequests: [], revision: 8, nodeTitle: 'Current revision 8',
  }
  await openCanvas(page, state)
  await page.getByRole('button', { name: '打开修订历史' }).click()
  const panel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await panel.getByRole('button', { name: '恢复修订 r7' }).click()
  await panel.getByRole('button', { name: '确认恢复 r7' }).click()

  await expect.poll(() => state.restoreRequests).toEqual([7])
  await expect(panel).toContainText('服务器已创建新 head r9，但本地重新加载失败')
  await expect(panel).not.toContainText('画布未变更')
})
