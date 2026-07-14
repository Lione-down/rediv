<script setup lang="ts">
import { ArrowRight, FolderKanban, LogIn, RefreshCcw, TriangleAlert } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useProjectStore } from '../../modules/project/store'
import type { Project } from '../../modules/project/types'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'
import HomeCreateProjectModal from './components/home/home-create-project-modal.vue'
import HomeProjectsPanel from './components/home/home-projects-panel.vue'
import HomeQuotaSummary from './components/home/home-quota-summary.vue'
import HomeRecentAssets from './components/home/home-recent-assets.vue'
import HomeRouteHeader from './components/home/home-route-header.vue'
import './home-page-v2.scss'
const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()
const assetStore = useAssetStore()

const isCreateModalOpen = ref(false)
const isRestoringSession = ref(false)
const sessionError = ref('')

const isRefreshingDashboard = computed(() => projectStore.isLoading || assetStore.isLoading)

const dashboardSummary = computed(() => {
  const projectSummary = projectStore.hasLoaded
    ? `${projectStore.total} 个项目${projectStore.loadError ? '（刷新失败）' : ''}`
    : projectStore.loadError
      ? '项目加载失败'
      : projectStore.isLoading
        ? '项目正在同步'
        : '项目等待同步'
  const assetSummary = assetStore.hasLoaded
    ? `已载入 ${Math.min(assetStore.items.length, 3)} 条最近资产${assetStore.loadError ? '（刷新失败）' : ''}`
    : assetStore.loadError
      ? '最近资产加载失败'
      : assetStore.isLoading
        ? '最近资产正在同步'
        : '最近资产等待同步'
  return `${projectSummary}，${assetSummary}。`
})

async function loadDashboard(force = false) {
  if (!authStore.isLoggedIn) {
    return
  }

  const projectRequest = force
    ? projectStore.refreshProjects()
    : projectStore.loadProjects()
  const assetRequest = force
    ? assetStore.refreshAssets()
    : assetStore.loadAssets(false)

  await Promise.allSettled([projectRequest, assetRequest])
}

async function restoreSession() {
  if (!authStore.token || authStore.user) {
    return
  }

  isRestoringSession.value = true
  sessionError.value = ''

  try {
    await authStore.loadCurrentUser()
  } catch {
    sessionError.value = '暂时无法恢复登录状态，请重试或重新登录。'
  } finally {
    isRestoringSession.value = false
  }
}

function openCreateModal() {
  projectStore.clearCreateError()
  isCreateModalOpen.value = true
}

async function handleCreateProject(name: string) {
  try {
    await projectStore.createProject({ name })
    isCreateModalOpen.value = false
  } catch {
    // The store exposes a sanitized error inside the modal and preserves the entered name.
  }
}

function openProject(project: Project) {
  void router.push({
    name: 'workspace',
    query: { project_id: project.id },
  })
}

async function refreshProjects() {
  await Promise.allSettled([projectStore.refreshProjects()])
}

async function refreshAssets() {
  await Promise.allSettled([assetStore.refreshAssets()])
}

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token === previousToken) {
      return
    }

    sessionError.value = ''
    isCreateModalOpen.value = false
  },
  { flush: 'sync' },
)

watch(
  () => [authStore.token, authStore.user?.id] as const,
  async ([token, userId], [previousToken, previousUserId]) => {
    if (!token || !userId) {
      return
    }

    if (token !== previousToken || userId !== previousUserId) {
      await loadDashboard()
    }
  },
)

onMounted(async () => {
  await restoreSession()
  await loadDashboard()
})
</script>

<template>
  <main class="app-shell home-page">
    <HomeRouteHeader
      :is-logged-in="authStore.isLoggedIn"
      :is-admin="authStore.isAdmin"
      :is-refreshing="isRefreshingDashboard"
      :nickname="authStore.user?.nickname"
      @create="openCreateModal"
      @refresh="loadDashboard(true)"
    />

    <div class="home-shell">
      <template v-if="authStore.isLoggedIn && authStore.user">
        <section class="dashboard-intro" aria-labelledby="dashboard-title">
          <div class="intro-copy">
            <p class="intro-kicker">Personal dashboard</p>
            <h1 id="dashboard-title">{{ authStore.user.nickname }} 的创作工作台</h1>
            <p>{{ dashboardSummary }}</p>
          </div>
          <div class="intro-status" :class="{ 'is-frozen': authStore.user.generation_status === 'frozen' }">
            <span>{{ authStore.user.role === 'admin' ? 'Admin' : 'Creator' }}</span>
            <strong>{{ authStore.user.generation_status === 'enabled' ? '生成服务可用' : '生成服务已冻结' }}</strong>
          </div>
        </section>

        <div class="dashboard-grid">
          <HomeProjectsPanel
            :projects="projectStore.items"
            :total="projectStore.total"
            :has-loaded="projectStore.hasLoaded"
            :is-loading="projectStore.isLoading"
            :error="projectStore.loadError"
            @create="openCreateModal"
            @open="openProject"
            @refresh="refreshProjects"
          />

          <aside class="dashboard-side" aria-label="账户状态与最近资产">
            <HomeQuotaSummary
              :quotas="authStore.quotas"
              :generation-status="authStore.user.generation_status"
            />
            <HomeRecentAssets
              :assets="assetStore.items"
              :has-loaded="assetStore.hasLoaded"
              :is-loading="assetStore.isLoading"
              :error="assetStore.loadError"
              @refresh="refreshAssets"
            />
          </aside>
        </div>
      </template>

      <section v-else class="guest-entry" aria-labelledby="guest-title">
        <div class="guest-icon" aria-hidden="true">
          <FolderKanban :size="26" />
        </div>
        <p class="intro-kicker">Revid projects</p>
        <h1 id="guest-title">先登录，再从真实项目开始创作。</h1>
        <p>
          登录后可查看持久化项目、最近资产和当前额度。进入工作流前需要先选择一个项目，
          不会再使用隐式 demo 数据。
        </p>

        <div v-if="sessionError" class="session-alert" role="alert">
          <TriangleAlert :size="17" />
          <span>{{ sessionError }}</span>
          <button
            class="guest-action is-secondary focus-ring"
            type="button"
            :disabled="isRestoringSession"
            @click="restoreSession"
          >
            <RefreshCcw :size="16" />
            {{ isRestoringSession ? '重试中…' : '重试恢复' }}
          </button>
        </div>

        <div class="guest-actions">
          <RouterLink class="guest-action is-primary focus-ring" to="/login?redirect=/">
            <LogIn :size="17" />
            登录工作台
          </RouterLink>
          <RouterLink class="guest-action is-secondary focus-ring" to="/register?redirect=/">
            创建账户
            <ArrowRight :size="17" />
          </RouterLink>
        </div>
      </section>
    </div>

    <HomeCreateProjectModal
      :show="isCreateModalOpen"
      :is-creating="projectStore.isCreating"
      :error="projectStore.createError"
      @close="isCreateModalOpen = false"
      @submit="handleCreateProject"
    />
  </main>
</template>

<style scoped lang="scss">
.home-page {
  color: var(--text-primary);
}

:global(.home-page .focus-ring:focus-visible) {
  outline-color: var(--accent-select);
}

.home-shell {
  width: min(1240px, calc(100% - 40px));
  margin: 0 auto;
  padding: var(--space-6) 0 44px;
}

.dashboard-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
  padding: 10px 4px var(--space-6);
}

.intro-copy {
  min-width: 0;
}

.intro-kicker,
.intro-copy h1,
.intro-copy > p:last-child,
.guest-entry h1,
.guest-entry > p {
  margin: 0;
}

.intro-kicker {
  color: var(--accent-generate-hover);
  font-size: var(--font-size-hint);
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.intro-copy h1,
.guest-entry h1 {
  margin-top: var(--space-2);
  text-wrap: balance;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.08;
}

.intro-copy > p:last-child,
.guest-entry > p {
  max-width: 65ch;
  margin-top: var(--space-3);
  color: var(--text-secondary);
  line-height: 1.75;
  text-wrap: pretty;
}

.intro-status {
  display: grid;
  flex: 0 0 auto;
  gap: 5px;
  min-width: 180px;
  padding: var(--space-3) var(--space-4);
  border-radius: 16px;
  color: var(--accent-generate-hover);
  background: color-mix(in oklab, var(--v2-success) 14%, var(--v2-surface-1));
}

.intro-status.is-frozen {
  color: var(--danger);
  background: color-mix(in oklab, var(--v2-danger) 12%, var(--v2-surface-1));
}

.intro-status span {
  font-size: var(--font-size-hint);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
  gap: var(--space-4);
  align-items: start;
}

.dashboard-side {
  display: grid;
  min-width: 0;
  gap: var(--space-4);
}

.guest-entry {
  display: grid;
  min-height: calc(100dvh - 132px);
  align-content: center;
  justify-items: start;
  max-width: 760px;
  padding: 64px 4px 96px;
}

.guest-icon {
  display: grid;
  width: 54px;
  height: 54px;
  margin-bottom: var(--space-4);
  place-items: center;
  border-radius: 18px;
  color: var(--accent-generate-hover);
  background: var(--v2-accent-soft);
  box-shadow: var(--shadow-soft);
}

.guest-actions,
.session-alert,
.guest-action {
  display: flex;
  align-items: center;
}

.guest-actions {
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.guest-action {
  min-height: 44px;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.guest-action.is-primary {
  color: var(--text-primary);
  border-color: transparent;
  background: var(--accent-generate);
  box-shadow: var(--shadow-accent);
}

.guest-action.is-secondary {
  color: var(--text-primary);
  background: var(--bg-panel);
}

.guest-action:active {
  transform: scale(0.96);
}

.guest-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.session-alert {
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--danger);
  background: color-mix(in oklab, var(--v2-danger) 10%, var(--v2-surface-1));
}

.session-alert span {
  flex: 1;
  line-height: 1.6;
}

.session-alert .guest-action {
  flex: 0 0 auto;
}

@media (hover: hover) {
  .guest-action.is-primary:hover {
    background: var(--v2-accent-hover);
  }

  .guest-action.is-secondary:hover {
    border-color: var(--border-strong);
    background: var(--bg-panel-subtle);
  }
}

@media (max-width: 920px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-side {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  }
}

@media (max-width: 680px) {
  .home-shell {
    width: min(100%, calc(100% - 24px));
    padding-top: var(--space-4);
  }

  .dashboard-intro {
    display: grid;
    align-items: start;
  }

  .intro-status {
    width: 100%;
  }

  .dashboard-side {
    grid-template-columns: 1fr;
  }

  .guest-entry {
    min-height: calc(100dvh - 108px);
    padding-block: 44px 72px;
  }

  .session-alert {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .session-alert .guest-action {
    grid-column: 2;
    justify-self: start;
  }
}

@media (max-width: 420px) {
  .home-shell {
    width: min(100%, calc(100% - 20px));
  }

  .intro-copy h1,
  .guest-entry h1 {
    font-size: 30px;
  }

  .guest-actions {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guest-action {
    transition: none;
  }

  .guest-action:active {
    transform: none;
  }
}

</style>
