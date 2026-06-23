import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/app/Home.vue'),
    },
    {
      path: '/app/workspace',
      name: 'workspace',
      component: () => import('../views/app/Workspace.vue'),
    },
    {
      path: '/app/space',
      name: 'space',
      component: () => import('../views/app/Space.vue'),
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
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/Users.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/invitations',
      name: 'admin-invitations',
      component: () => import('../views/admin/Invitations.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/quotas',
      name: 'admin-quotas',
      component: () => import('../views/admin/Quotas.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/assets',
      name: 'admin-assets',
      component: () => import('../views/admin/Assets.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/tasks',
      name: 'admin-tasks',
      component: () => import('../views/admin/Tasks.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'home' }
  }

  return true
})
