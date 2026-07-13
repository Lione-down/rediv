import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test, type Page, type Route, type TestInfo } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-12T08:00:00Z'

interface MockState {
  projects: Array<Record<string, unknown>>
  canvases: Array<Record<string, unknown>>
  canvasOrderRevision: number
  assets: Array<Record<string, unknown>>
  templates: Array<Record<string, unknown>>
  imageQuota: number
  quotaRevision: number
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

function canvasMetadata(id: string, name: string, sortOrder: number) {
  return {
    id,
    project_id: 'project-e2e',
    name,
    sort_order: sortOrder,
    status: 'active',
    viewport_x: 0,
    viewport_y: 0,
    viewport_zoom: 1,
    graph_revision: 0,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
  }
}

const canvasNodes = [
  {
    id: 'node-image',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'image',
    content: { title: '生成封面', prompt: '夏日海边电影海报' },
    position_x: 180,
    position_y: 140,
    width: 240,
    height: 140,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'node-result',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'result',
    content: { title: '成片结果', description: '等待生成结果' },
    position_x: 560,
    position_y: 140,
    width: 240,
    height: 140,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  },
]

const canvasConnections = [
  {
    id: 'connection-e2e',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
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

const visualViewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'compact-desktop', width: 1366, height: 768 },
  { name: 'tablet', width: 920, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
] as const

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
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
        quota_revision: state.quotaRevision,
      })
      return
    }

    if (request.method() === 'GET' && pathname === '/me') {
      await fulfillJson(route, {
        user,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
        quota_revision: state.quotaRevision,
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
      state.canvases = [canvasMetadata('canvas-first', '画布 1', 0)]
      await fulfillJson(route, project, 201)
      return
    }

    if (request.method() === 'GET' && pathname === '/api/projects/project-e2e/canvases') {
      await fulfillJson(route, {
        items: state.canvases,
        order_revision: state.canvasOrderRevision,
      })
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

    if (request.method() === 'GET' && pathname === '/templates') {
      await fulfillJson(route, { items: state.templates, total: state.templates.length })
      return
    }

    if (request.method() === 'GET' && pathname === '/api/projects/project-e2e/canvases/canvas-first/document') {
      const activeCanvas = state.canvases.find((canvas) => canvas.id === 'canvas-first')
      await fulfillJson(route, {
        canvas: activeCanvas,
        nodes: canvasNodes,
        connections: canvasConnections,
        revision: activeCanvas?.graph_revision ?? 0,
      })
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
      state.imageQuota = 3
      state.quotaRevision += 1
      await fulfillJson(route, {
        asset,
        quotas: { text: 5, image: state.imageQuota, video: 2 },
        quota_revision: state.quotaRevision,
      })
      return
    }

    await fulfillJson(route, { detail: `Unhandled mock route: ${request.method()} ${pathname}` }, 501)
  })
}

async function captureVisualEvidence(page: Page, testInfo: TestInfo, name: string) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1)

  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't4-013-responsive')
  const screenshotPath = resolve(evidenceDirectory, `${name}.png`)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach(name, { path: screenshotPath, contentType: 'image/png' })
}

function createVisualState(): MockState {
  return {
    projects: [
      {
        id: 'project-e2e',
        user_id: user.id,
        name: 'E2E 夏日短片',
        created_at: NOW,
      },
    ],
    canvases: [canvasMetadata('canvas-first', '画布 1', 0)],
    canvasOrderRevision: 0,
    assets: [
      {
        id: 'asset-prompt',
        user_id: user.id,
        project_id: 'project-e2e',
        canvas_node_id: 'node-image',
        type: 'prompt',
        url: null,
        content_text: '夏日海边电影海报，柔和日落与清晰标题留白。',
        source: 'generation',
        source_model: 'mock-text-model',
        source_task_id: 'task-prompt',
        status: 'ready',
        created_at: NOW,
        updated_at: NOW,
      },
    ],
    templates: [
      {
        id: 'template-e2e',
        name: '短片封面流程',
        user_id: user.id,
        node_count: 2,
        created_at: NOW,
        node_data: null,
      },
    ],
    imageQuota: 3,
    quotaRevision: 0,
    generationAttempts: 0,
    generationBodies: [],
    authenticatedRequests: [],
  }
}

test('authenticated project and Canvas generation workflow survives reload', async ({ page }) => {
  const state: MockState = {
    projects: [],
    canvases: [],
    canvasOrderRevision: 0,
    assets: [],
    templates: [],
    imageQuota: 1,
    quotaRevision: 0,
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
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()
  await expect(page.locator('.connection-line')).toHaveCount(1)

  const canvas = page.locator('.canvas-surface')
  await expect(canvas).toBeVisible()
  await canvas.click({ position: { x: 220, y: 180 } })
  await expect(page.getByText('继续处理“生成封面”节点的生成任务。')).toBeVisible()

  await page.getByRole('button', { name: '立即生成' }).click()
  const nodeContext = page.getByRole('region', { name: '节点上下文' })
  await expect(nodeContext.getByText('图片生成完成，结果已写入资产区。')).toBeVisible()

  await page.getByRole('button', { name: '立即生成' }).click()
  await expect(nodeContext.getByText('mock provider unavailable')).toBeVisible()
  expect(state.imageQuota).toBe(3)
  expect(state.generationBodies).toEqual([
    {
      project_id: 'project-e2e', origin_canvas_id: 'canvas-first',
      canvas_node_id: 'node-image', prompt: '夏日海边电影海报',
    },
    {
      project_id: 'project-e2e', origin_canvas_id: 'canvas-first',
      canvas_node_id: 'node-image', prompt: '关键帧已生成，可在 Assets 面板查看。',
    },
  ])

  await page.reload()
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()
  await expect(page.locator('.connection-line')).toHaveCount(1)
  expect(state.authenticatedRequests).toContain('GET /me')
  expect(state.authenticatedRequests).toContain('GET /api/projects/project-e2e/canvases')
  expect(state.authenticatedRequests).toContain('GET /api/projects/project-e2e/canvases/canvas-first/document')
  expect(state.authenticatedRequests).toContain('POST /api/image-generate')
})

for (const viewport of visualViewports) {
  test(`responsive visual matrix at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    const state = createVisualState()
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await installMockApi(page, state)

    await page.goto('/login?redirect=/')
    await expect(page.getByRole('heading', { name: '登录 Revid' })).toBeVisible()
    await expect(page.getByLabel('用户名或邮箱')).toBeVisible()
    await captureVisualEvidence(page, testInfo, `${viewport.name}-login`)

    await page.getByLabel('用户名或邮箱').fill('creator')
    await page.getByLabel('密码').fill('correct-password')
    await page.getByRole('button', { name: '登录并进入工作流' }).click()
    await expect(page.getByRole('heading', { name: 'E2E Creator 的创作工作台' })).toBeVisible()
    await expect(page.getByRole('button', { name: '进入项目 E2E 夏日短片' })).toBeVisible()
    await captureVisualEvidence(page, testInfo, `${viewport.name}-home`)

    await page.getByRole('button', { name: '进入项目 E2E 夏日短片' }).click()
    await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
    await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
    await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
    await expect(page.getByText('E2E 夏日短片')).toBeVisible()
    await expect(page.locator('footer[aria-label="Prompt 输入区"]')).toHaveCount(0)
    await expect(page.locator('aside.right-panel')).toHaveCount(0)
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    if (viewport.width < 768) {
      await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
      await expect(stage).toHaveAttribute('aria-description', '只读审阅模式')
    } else {
      await expect(page.getByText('浏览审阅模式', { exact: true })).toHaveCount(0)
      await expect(stage).toHaveAttribute('aria-description', '可编辑画布')
    }
    await captureVisualEvidence(page, testInfo, `${viewport.name}-workspace`)

    await page.goto('/app/space')
    await expect(page.getByRole('heading', { name: 'E2E Creator 的个人空间' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '个人资产' })).toBeVisible()
    await expect(page.getByRole('button', { name: /查看资产详情/ })).toBeVisible()
    await captureVisualEvidence(page, testInfo, `${viewport.name}-space`)
  })
}

test('legacy and invalid canonical routes resolve only through the active Canvas list', async ({ page }) => {
  const state = createVisualState()
  state.canvases = [
    canvasMetadata('canvas-first', '画布 1', 0),
    canvasMetadata('canvas-second', '分镜', 1),
  ]
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
    window.localStorage.setItem(
      'revid:last-canvas:user-e2e:project-e2e',
      'canvas-second',
    )
  })

  await page.goto('/app/workspace?project_id=project-e2e')
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()

  await page.goto('/app/projects/project-e2e/canvases/foreign-canvas')
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
  expect(state.authenticatedRequests).toContain('GET /api/projects/project-e2e/canvases')
})
