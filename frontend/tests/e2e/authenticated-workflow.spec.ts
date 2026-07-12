import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-12T08:00:00Z'

interface MockState {
  projects: Array<Record<string, unknown>>
  assets: Array<Record<string, unknown>>
  imageQuota: number
  generationAttempts: number
  generationBodies: unknown[]
  authenticatedRequests: string[]
}

const user = {
  id: 'user-e2e',
  username: 'creator',
  email: 'creator@example.com',
  nickname: 'E2E Creator',
  avatar_url: '',
  role: 'user',
  status: 'active',
  generation_status: 'enabled',
  created_at: NOW,
  updated_at: NOW,
  last_login_at: NOW,
}

const canvasNodes = [
  {
    id: 'node-image',
    project_id: 'project-e2e',
    node_type: 'image',
    content: { title: '生成封面', prompt: '夏日海边电影海报' },
    position_x: 180,
    position_y: 140,
    width: 240,
    height: 140,
    status: 'idle',
    created_at: NOW,
  },
  {
    id: 'node-result',
    project_id: 'project-e2e',
    node_type: 'result',
    content: { title: '成片结果', description: '等待生成结果' },
    position_x: 560,
    position_y: 140,
    width: 240,
    height: 140,
    status: 'idle',
    created_at: NOW,
  },
]

const canvasConnections = [
  {
    id: 'connection-e2e',
    project_id: 'project-e2e',
    source_node_id: 'node-image',
    source_port: 'out',
    target_node_id: 'node-result',
    target_port: 'in',
    status: 'active',
    metadata: {},
    created_at: NOW,
    updated_at: NOW,
  },
]

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  })
}

async function installMockApi(page: Page, state: MockState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders() })
      return
    }

    if (request.headers().authorization === 'Bearer mock-session-token') {
      state.authenticatedRequests.push(`${request.method()} ${pathname}`)
    }

    if (request.method() === 'GET' && pathname === '/auth/registration-settings') {
      await fulfillJson(route, { registration_mode: 'open', wechat_login_enabled: false })
      return
    }

    if (request.method() === 'POST' && pathname === '/auth/login') {
      await fulfillJson(route, {
        token: 'mock-session-token',
        user,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/me') {
      await fulfillJson(route, {
        user,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/projects') {
      await fulfillJson(route, { items: state.projects, total: state.projects.length })
      return
    }

    if (request.method() === 'POST' && pathname === '/projects') {
      const payload = request.postDataJSON() as { name: string }
      const project = {
        id: 'project-e2e',
        user_id: user.id,
        name: payload.name,
        created_at: NOW,
      }
      state.projects.unshift(project)
      await fulfillJson(route, project, 201)
      return
    }

    if (request.method() === 'GET' && pathname === '/assets') {
      await fulfillJson(route, {
        items: state.assets,
        total: state.assets.length,
        page: Number(url.searchParams.get('page') || 1),
        page_size: Number(url.searchParams.get('page_size') || 20),
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/projects/project-e2e/nodes') {
      await fulfillJson(route, { items: canvasNodes, total: canvasNodes.length })
      return
    }

    if (request.method() === 'GET' && pathname === '/projects/project-e2e/connections') {
      await fulfillJson(route, { items: canvasConnections, total: canvasConnections.length })
      return
    }

    if (request.method() === 'POST' && pathname === '/api/image-generate') {
      state.generationAttempts += 1
      state.generationBodies.push(request.postDataJSON())

      if (state.generationAttempts === 2) {
        await fulfillJson(route, { detail: 'mock provider unavailable' }, 503)
        return
      }

      const asset = {
        id: 'asset-generated',
        user_id: user.id,
        project_id: 'project-e2e',
        canvas_node_id: 'node-image',
        type: 'image',
        url: 'https://example.invalid/generated.webp',
        content_text: null,
        source: 'generation',
        source_model: 'mock-image-model',
        source_task_id: 'task-generated',
        status: 'ready',
        created_at: NOW,
        updated_at: NOW,
      }
      state.assets.unshift(asset)
      state.imageQuota -= 1
      await fulfillJson(route, { asset })
      return
    }

    await fulfillJson(route, { detail: `Unhandled mock route: ${request.method()} ${pathname}` }, 501)
  })
}

test('authenticated project and Canvas generation workflow survives reload', async ({ page }) => {
  const state: MockState = {
    projects: [],
    assets: [],
    imageQuota: 3,
    generationAttempts: 0,
    generationBodies: [],
    authenticatedRequests: [],
  }
  await installMockApi(page, state)

  await page.goto('/login?redirect=/')
  await page.getByLabel('用户名或邮箱').fill('creator')
  await page.getByLabel('密码').fill('correct-password')
  await page.getByRole('button', { name: '登录并进入工作流' }).click()

  await expect(page).toHaveURL(`${APP_ORIGIN}/`)
  await expect(page.getByRole('heading', { name: '你的项目' })).toBeVisible()

  await page.getByRole('button', { name: '创建第一个项目' }).click()
  await page.getByLabel('项目名称').fill('E2E 夏日短片')
  await page.getByRole('button', { name: '创建项目', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'E2E 夏日短片' })).toBeVisible()

  await page.getByRole('button', { name: '进入项目 E2E 夏日短片' }).click()
  await expect(page).toHaveURL(/\/app\/workspace\?project_id=project-e2e$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()
  await expect(page.locator('.connection-line')).toHaveCount(1)

  const canvas = page.locator('.canvas-surface')
  await expect(canvas).toBeVisible()
  await canvas.click({ position: { x: 220, y: 180 } })
  await expect(page.getByText('继续处理「生成封面」节点的生成任务。')).toBeVisible()

  await page.getByRole('button', { name: '立即生成' }).click()
  const desktopInspector = page.locator('aside.right-panel').first()
  await expect(desktopInspector.getByText('generation')).toBeVisible()
  await desktopInspector.getByRole('tab', { name: 'Properties' }).click()
  await expect(desktopInspector.getByText('图片生成完成，结果已写入资产区。')).toBeVisible()
  await expect(desktopInspector.getByText('图片 2')).toBeVisible()

  await page.getByRole('button', { name: '立即生成' }).click()
  await expect(desktopInspector.getByText('mock provider unavailable')).toBeVisible()
  await expect(desktopInspector.getByText('图片 2')).toBeVisible()
  expect(state.imageQuota).toBe(2)
  expect(state.generationBodies).toEqual([
    { prompt: '夏日海边电影海报' },
    { prompt: '关键帧已生成，可在 Assets 面板查看。' },
  ])

  await page.reload()
  await expect(page).toHaveURL(/\/app\/workspace\?project_id=project-e2e$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()
  await expect(page.locator('.connection-line')).toHaveCount(1)
  expect(state.authenticatedRequests).toContain('GET /me')
  expect(state.authenticatedRequests).toContain('GET /projects/project-e2e/nodes')
  expect(state.authenticatedRequests).toContain('POST /api/image-generate')
})
