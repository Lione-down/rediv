import { createRouter, createWebHistory } from 'vue-router'
import { useCanvasListStore } from '../modules/canvas/canvas-list-store'
import { canvasRouteLocation, normalizeRouteIdentifier } from '../modules/canvas/metadata'
import { useAuthStore } from '../store/auth'

export const DEFAULT_AUTH_REDIRECT = '/app/workspace'

const AUTH_ENTRY_PATH_PATTERN = /^\/(?:login|register|auth\/callback\/wechat)\/?$/
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/

function hasUnsafeRedirectShape(value: string) {
  return (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHARACTER_PATTERN.test(value)
  )
}

export function resolveAuthRedirect(value: unknown, fallback = DEFAULT_AUTH_REDIRECT) {
  if (Array.isArray(value) || typeof value !== 'string' || value !== value.trim()) {
    return fallback
  }

  if (hasUnsafeRedirectShape(value)) {
    return fallback
  }

  try {
    const decodedValue = decodeURIComponent(value)
    if (hasUnsafeRedirectShape(decodedValue)) {
      return fallback
    }

    const target = new URL(value, 'https://revid.local')
    const decodedPathname = decodeURIComponent(target.pathname)
    if (
      target.origin !== 'https://revid.local' ||
      hasUnsafeRedirectShape(target.pathname) ||
      hasUnsafeRedirectShape(decodedPathname) ||
      AUTH_ENTRY_PATH_PATTERN.test(target.pathname)
    ) {
      return fallback
    }

    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return fallback
  }
}

async function resolveLegacyWorkspace(to: { query: Record<string, unknown> }) {
  const projectId = normalizeRouteIdentifier(to.query.project_id)
  if (!projectId) return { name: 'home', replace: true }

  try {
    const canvas = await useCanvasListStore().resolveCanvas(projectId, undefined, false)
    return canvas ? canvasRouteLocation(projectId, canvas.id) : { name: 'home', replace: true }
  } catch {
    return { name: 'home', replace: true }
  }
}

async function validateCanonicalWorkspace(to: { params: Record<string, unknown> }) {
  const projectId = normalizeRouteIdentifier(to.params.projectId)
  const canvasId = normalizeRouteIdentifier(to.params.canvasId)
  if (!projectId || !canvasId) return { name: 'home', replace: true }

  try {
    const canvas = await useCanvasListStore().resolveCanvas(projectId, canvasId)
    if (!canvas) return { name: 'home', replace: true }
    return canvas.id === canvasId ? true : canvasRouteLocation(projectId, canvas.id)
  } catch {
    return { name: 'home', replace: true }
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/user/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/user/Register.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/app/Home.vue'),
    },
    {
      path: '/app/workspace',
      name: 'workspace',
      component: () => import('../views/app/Workspace.vue'),
      meta: { requiresAuth: true },
      beforeEnter: resolveLegacyWorkspace,
    },
    {
      path: '/app/projects/:projectId/canvases/:canvasId',
      name: 'canvas-workspace',
      component: () => import('../views/app/CanvasWorkspace.vue'),
      meta: { requiresAuth: true },
      beforeEnter: validateCanonicalWorkspace,
    },
    {
      path: '/app/space',
      name: 'space',
      component: () => import('../views/app/Space.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/callback/wechat',
      name: 'wechat-callback',
      component: () => import('../views/app/WechatCallback.vue'),
    },
    {
      path: '/smoke',
      name: 'smoke-test',
      component: () => import('../views/smoke/SmokeTest.vue'),
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('../views/admin/Dashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/Users.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/invitations',
      name: 'admin-invitations',
      component: () => import('../views/admin/Invitations.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/quotas',
      name: 'admin-quotas',
      component: () => import('../views/admin/Quotas.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/assets',
      name: 'admin-assets',
      component: () => import('../views/admin/Assets.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/tasks',
      name: 'admin-tasks',
      component: () => import('../views/admin/Tasks.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const isWechatCallback = to.name === 'wechat-callback'
  authStore.setSessionRestoreSuppressed(isWechatCallback)

  if (
    !isWechatCallback &&
    authStore.token &&
    !authStore.hasRestoredSession
  ) {
    try {
      await authStore.restoreSession()
    } catch {
      // Public and auth-entry routes remain usable during a transient /me failure.
    }
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.isLoggedIn) {
    return resolveAuthRedirect(to.query.redirect)
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return {
      name: 'login',
      query: { redirect: resolveAuthRedirect(to.fullPath) },
    }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'home' }
  }

  return true
})
