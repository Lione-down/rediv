<script setup lang="ts">
import axios from 'axios'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Images,
  LoaderCircle,
  RefreshCcw,
  Sparkles,
  TriangleAlert,
  UserRound,
  WandSparkles,
} from 'lucide-vue-next'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import PromptComposer from '../../components/common/PromptComposer.vue'
import { useAuthStore } from '../../store/auth'
import { useAssetStore } from '../../store/assets'
import type { Asset } from '../../types/asset'

const authStore = useAuthStore()
const assetStore = useAssetStore()
const message = useMessage()
const isAuthenticating = ref(false)
const authError = ref('')
const assetError = ref('')

const quickStarts = [
  {
    title: '故事脚本',
    text: '把一句想法拆成镜头结构、节奏和生成顺序。',
    tone: 'story',
  },
  {
    title: '角色参考',
    text: '整理角色外观、服装和表情，避免多轮返工。',
    tone: 'character',
  },
  {
    title: '视频草稿',
    text: '先生成一版可讨论的短视频草稿，再继续 refine。',
    tone: 'video',
  },
] as const

const displayedAssets = computed(() => (authStore.isLoggedIn ? assetStore.items.slice(0, 3) : []))
const quotaCards = computed(() => [
  {
    label: 'Text',
    value: authStore.quotas.text,
    tone: 'text',
  },
  {
    label: 'Image',
    value: authStore.quotas.image,
    tone: 'image',
  },
  {
    label: 'Video',
    value: authStore.quotas.video,
    tone: 'video',
  },
])

const statusCards = computed(() => [
  {
    title: '最近项目',
    text: '雨夜车站短片、角色设定、封面探索。',
    meta: '3 个项目持续编辑中',
    icon: FolderKanban,
    layout: 'wide',
  },
  {
    title: '资产库',
    text: 'Prompt、图片、视频持续沉淀，随时回流到工作流。',
    meta: '12 个可复用素材片段',
    icon: Images,
    layout: 'default',
  },
  {
    title: '额度',
    text: authStore.isLoggedIn
      ? `文本 ${authStore.quotas.text} / 图片 ${authStore.quotas.image} / 视频 ${authStore.quotas.video}`
      : '登录后同步 text / image / video 额度',
    meta: authStore.isLoggedIn ? '已同步当前账户额度' : '登录后可同步真实额度',
    icon: Clock3,
    layout: 'default',
  },
])

const userSummary = computed(() => {
  if (!authStore.user) {
    return null
  }

  return {
    nickname: authStore.user.nickname,
    role: authStore.user.role === 'admin' ? 'Admin' : 'Creator',
    status: authStore.user.generation_status === 'enabled' ? '可生成' : '已冻结',
  }
})

function getAssetTitle(asset: Asset) {
  if (asset.content_text?.trim()) {
    return asset.content_text.trim()
  }

  if (asset.url) {
    return asset.url.split('/').pop() || asset.url
  }

  return '未命名资产'
}

function getAssetTypeLabel(type: Asset['type']) {
  if (type === 'prompt') return 'Prompt'
  if (type === 'image') return 'Image'
  return 'Video'
}

function getAssetSourceLabel(source?: Asset['source']) {
  return source === 'generation' ? 'Generation' : 'Upload'
}

function getAssetStatusLabel(status?: Asset['status']) {
  if (status === 'hidden') return 'Hidden'
  if (status === 'deleted') return 'Deleted'
  return 'Active'
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试。'
    }
  }

  return fallback
}

async function loadAssets() {
  if (!authStore.isLoggedIn) {
    return
  }

  assetError.value = ''

  try {
    await assetStore.loadAssets()
  } catch (error) {
    assetError.value = getErrorMessage(error, '资产列表加载失败，请稍后重试。')
  }
}

async function handleWechatLogin() {
  isAuthenticating.value = true
  authError.value = ''

  try {
    await authStore.loginWithWechat()
  } catch (error) {
    authError.value = getErrorMessage(error, '登录失败，请检查后端服务后重试。')
    message.error(authError.value)
  } finally {
    isAuthenticating.value = false
  }
}

watch(
  () => authStore.isLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      await loadAssets()
      return
    }

    assetError.value = ''
  },
)

onMounted(async () => {
  if (!authStore.token) {
    return
  }

  if (!authStore.user) {
    try {
      await authStore.loadCurrentUser()
    } catch (error) {
      authError.value = getErrorMessage(error, '当前登录状态已失效，请重新登录。')
      return
    }
  }

  await loadAssets()
})
</script>

<template>
  <main class="app-shell home-page">
    <AppTopBar />

    <div class="page-shell">
      <section class="hero" aria-label="首页主入口">
        <article class="hero-main">
          <div>
            <p class="hero-label">
              <WandSparkles :size="14" />
              安静的创作工作台
            </p>
            <h1>把 prompt、图片和视频放进同一个创作空间。</h1>
            <p class="hero-description">
              Revid 先帮你整理脚本、角色参考和素材脉络，再把生成任务放回工作流里持续迭代，
              让每一次试错都能沉淀为后续可复用的资产。
            </p>
            <div v-if="userSummary" class="account-banner" aria-label="当前登录状态">
              <div class="account-banner__icon">
                <UserRound :size="18" />
              </div>
              <div class="account-banner__copy">
                <strong>{{ userSummary.nickname }}</strong>
                <span>{{ userSummary.role }} · {{ userSummary.status }}</span>
              </div>
            </div>
            <p v-if="authError" class="inline-feedback is-danger" role="alert">
              <TriangleAlert :size="14" />
              {{ authError }}
            </p>
            <div class="hero-actions">
              <button
                class="action secondary focus-ring"
                type="button"
                :disabled="isAuthenticating"
                @click="handleWechatLogin"
              >
                <LoaderCircle v-if="isAuthenticating" :size="18" class="is-spinning" />
                <CheckCircle2 v-else-if="authStore.isLoggedIn" :size="18" />
                <WandSparkles v-else :size="18" />
                {{ authStore.isLoggedIn ? '重新同步账户' : '微信登录' }}
              </button>
              <RouterLink class="action primary focus-ring" to="/app/workspace">
                进入工作流
                <ArrowRight :size="18" />
              </RouterLink>
            </div>
          </div>

          <div class="quick-start-strip" aria-label="快速开始">
            <article
              v-for="item in quickStarts"
              :key="item.title"
              class="quick-start-card"
              :class="item.tone"
            >
              <Sparkles :size="18" />
              <strong>{{ item.title }}</strong>
              <span>{{ item.text }}</span>
            </article>
          </div>
        </article>

        <aside class="hero-side">
          <PromptComposer />
        </aside>
      </section>

      <section class="status-grid" aria-label="最近项目和资产状态">
        <article
          v-for="card in statusCards"
          :key="card.title"
          class="status-card"
          :class="card.layout"
        >
          <div class="status-icon">
            <component :is="card.icon" :size="18" />
          </div>
          <div class="status-copy">
            <p>{{ card.title }}</p>
            <h2>{{ card.text }}</h2>
            <span>{{ card.meta }}</span>
          </div>
        </article>
      </section>

      <section class="data-grid" aria-label="联调结果展示">
        <article class="data-card quota-card">
          <div class="section-heading">
            <div>
              <p>当前账户</p>
              <h2>额度总览</h2>
            </div>
            <span>{{ authStore.isLoggedIn ? '已连接后端' : '等待登录' }}</span>
          </div>

          <div class="quota-grid">
            <article
              v-for="quota in quotaCards"
              :key="quota.label"
              class="quota-pill"
              :class="quota.tone"
            >
              <span>{{ quota.label }}</span>
              <strong>{{ quota.value }}</strong>
            </article>
          </div>
        </article>

        <article class="data-card assets-card">
          <div class="section-heading">
            <div>
              <p>真实资产</p>
              <h2>最近 3 条资产</h2>
            </div>
            <button
              class="ghost-action focus-ring"
              type="button"
              :disabled="assetStore.isLoading || !authStore.isLoggedIn"
              @click="loadAssets"
            >
              <RefreshCcw :size="14" :class="{ 'is-spinning': assetStore.isLoading }" />
              重试加载
            </button>
          </div>

          <p v-if="assetError" class="inline-feedback is-danger" role="alert">
            <TriangleAlert :size="14" />
            {{ assetError }}
          </p>
          <p v-else-if="!authStore.isLoggedIn" class="inline-feedback">
            <Sparkles :size="14" />
            登录后会自动请求 `GET /assets` 并展示真实数据。
          </p>
          <p v-else-if="assetStore.isLoading" class="inline-feedback">
            <LoaderCircle :size="14" class="is-spinning" />
            正在加载资产列表。
          </p>

          <div v-if="displayedAssets.length" class="asset-list">
            <article
              v-for="asset in displayedAssets"
              :key="asset.id || getAssetTitle(asset)"
              class="asset-row"
            >
              <div class="asset-copy">
                <strong>{{ getAssetTitle(asset) }}</strong>
                <span>{{ getAssetTypeLabel(asset.type) }} · {{ getAssetSourceLabel(asset.source) }}</span>
              </div>
              <div class="asset-meta">
                <b>{{ getAssetStatusLabel(asset.status) }}</b>
              </div>
            </article>
          </div>
          <div v-else class="asset-empty">
            <p>{{ authStore.isLoggedIn ? '当前没有可展示的资产。' : '登录后展示资产列表。' }}</p>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
.home-page {
  color: var(--text-primary);
}

.page-shell {
  width: min(1240px, calc(100% - 40px));
  margin: 0 auto;
  padding: 20px 0 44px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: 18px;
  align-items: stretch;
}

.hero-main,
.hero-side,
.status-card {
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
  min-width: 0;
}

.hero-main {
  min-height: 560px;
  padding: 28px;
  border-radius: 28px;
  display: grid;
  align-content: space-between;
  gap: 28px;
  background:
    radial-gradient(circle at top right, oklch(84% 0.045 175 / 0.24), transparent 28%),
    linear-gradient(180deg, oklch(100% 0.004 92 / 0.94), oklch(97% 0.006 92 / 0.96));
}

.hero-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 18px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  color: var(--accent-generate-hover);
  /* Keep this soft translucent badge tone; no direct token with matching alpha exists. */
  background: oklch(99% 0.008 92 / 0.92);
  border: 1px solid oklch(88% 0.016 175 / 0.55);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
  font-weight: 600;
}

h1 {
  max-width: 620px;
  margin: 0;
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1;
  letter-spacing: -0.03em;
}

.hero-description {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.75;
}

.account-banner {
  display: inline-grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: center;
  min-width: min(100%, 360px);
  margin-top: 22px;
  padding: 14px var(--space-4);
  border-radius: 18px;
  /* Keep this elevated account surface tone; no direct token with matching alpha exists. */
  background: oklch(99% 0.007 92 / 0.94);
  border: 1px solid oklch(87% 0.014 175 / 0.48);
}

.account-banner__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--accent-generate-hover);
  background: oklch(95% 0.018 175);
}

.account-banner__copy {
  display: grid;
  gap: var(--space-1);
}

.account-banner__copy strong,
.account-banner__copy span {
  margin: 0;
}

.account-banner__copy span {
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: 28px;
}

.action {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: 14px;
  padding: 0 18px;
  border: 1px solid transparent;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.action:active {
  transform: scale(0.96);
}

.action.primary {
  color: white;
  background: var(--accent-generate);
  box-shadow: var(--shadow-accent);
}

.action.primary:hover {
  background: var(--accent-generate-hover);
}

.action.secondary {
  color: var(--text-primary);
  background: var(--bg-panel);
  border-color: var(--border-subtle);
}

.action.secondary:hover {
  background: var(--bg-panel-subtle);
}

.action:disabled,
.ghost-action:disabled {
  cursor: wait;
  opacity: 0.72;
}

.quick-start-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.quick-start-card {
  min-height: 134px;
  padding: 18px;
  border-radius: 20px;
  color: white;
  border: 1px solid oklch(98% 0.003 92 / 0.16);
  display: grid;
  align-content: start;
  gap: 10px;
  transition:
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.quick-start-card:active {
  transform: scale(0.96);
}

.quick-start-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px oklch(20% 0.02 245 / 0.18);
}

.quick-start-card strong {
  font-size: 15px;
}

.quick-start-card span {
  color: oklch(94% 0.008 92 / 0.78);
  font-size: var(--font-size-hint);
  line-height: 1.65;
}

.quick-start-card.story {
  background: linear-gradient(135deg, oklch(34% 0.03 237), oklch(46% 0.06 230));
}

.quick-start-card.character {
  background: linear-gradient(135deg, oklch(30% 0.055 340), oklch(44% 0.115 290));
}

.quick-start-card.video {
  background: linear-gradient(135deg, oklch(38% 0.04 140), oklch(49% 0.075 150));
}

.hero-side {
  border-radius: 28px;
  padding: 18px;
  background:
    linear-gradient(180deg, oklch(21% 0.015 245 / 0.96), oklch(16% 0.013 245 / 0.98)),
    linear-gradient(180deg, oklch(97% 0.006 92), oklch(95% 0.006 92));
}

.status-grid {
  display: grid;
  grid-template-columns: 1.6fr repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.status-card {
  min-height: 160px;
  padding: 18px;
  border-radius: 22px;
  background: oklch(100% 0.004 92 / 0.8);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: start;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--accent-generate-hover);
  background: oklch(96% 0.015 175);
}

.status-copy p,
.status-copy h2,
.status-copy span {
  margin: 0;
  overflow-wrap: anywhere;
}

.status-copy p {
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
}

.status-copy h2 {
  margin-top: 8px;
  font-size: 18px;
  line-height: 1.45;
  letter-spacing: -0.01em;
}

.status-copy span {
  display: block;
  margin-top: 14px;
  color: var(--text-muted);
  font-size: var(--font-size-hint);
}

.data-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 14px;
  margin-top: 18px;
}

.data-card {
  padding: 22px;
  border-radius: 22px;
  border: 1px solid var(--border-subtle);
  background: oklch(100% 0.004 92 / 0.86);
  box-shadow: var(--shadow-soft);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.section-heading p,
.section-heading h2,
.asset-empty p {
  margin: 0;
}

.section-heading p {
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
}

.section-heading h2 {
  margin-top: 6px;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.section-heading span {
  color: var(--text-muted);
  font-size: var(--font-size-hint);
  white-space: nowrap;
}

.quota-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: 20px;
}

.quota-pill {
  min-height: 124px;
  padding: var(--space-4);
  border-radius: 18px;
  display: grid;
  align-content: space-between;
  gap: 14px;
  color: white;
}

.quota-pill span {
  font-size: var(--font-size-hint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.quota-pill strong {
  font-size: clamp(28px, 5vw, 40px);
  line-height: 1;
}

.quota-pill.text {
  background: linear-gradient(135deg, oklch(34% 0.03 237), oklch(46% 0.06 230));
}

.quota-pill.image {
  background: linear-gradient(135deg, oklch(58% 0.115 252), oklch(66% 0.082 226));
}

.quota-pill.video {
  background: linear-gradient(135deg, oklch(43% 0.06 164), oklch(58% 0.105 175));
}

.ghost-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 34px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  background: var(--bg-panel);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.ghost-action:hover {
  background: var(--bg-panel-subtle);
}

.ghost-action:active {
  transform: scale(0.96);
}

.inline-feedback {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
  color: var(--text-secondary);
  font-size: var(--font-size-number);
}

.inline-feedback.is-danger {
  color: var(--danger);
}

.asset-list {
  display: grid;
  gap: var(--space-3);
  margin-top: 18px;
}

.asset-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4);
  border-radius: 18px;
  border: 1px solid var(--border-subtle);
  background: linear-gradient(180deg, oklch(99% 0.004 92), oklch(97% 0.006 92));
}

.asset-copy {
  display: grid;
  gap: 6px;
}

.asset-copy strong {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 1.5;
}

.asset-copy span,
.asset-meta b,
.asset-empty p {
  color: var(--text-secondary);
  font-size: var(--font-size-hint);
}

.asset-meta b {
  display: inline-flex;
  padding: var(--space-2) 10px;
  border-radius: var(--radius-pill);
  color: var(--accent-generate-hover);
  background: oklch(96% 0.018 175);
}

.asset-empty {
  margin-top: 18px;
  padding: 28px 18px;
  border-radius: 18px;
  border: 1px dashed var(--border-subtle);
  background: oklch(98% 0.005 92);
  text-align: center;
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .quick-start-strip {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .page-shell {
    width: min(100%, calc(100% - 28px));
    padding-top: 14px;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .hero-main,
  .hero-side,
  .status-card {
    border-radius: 24px;
  }

  .hero-main {
    min-height: auto;
    padding: 22px;
  }

  h1 {
    font-size: clamp(32px, 11vw, 44px);
  }

  .hero-side {
    padding: 14px;
  }

  .quota-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page-shell {
    width: min(100%, calc(100% - 20px));
    padding-bottom: var(--space-6);
  }

  .hero-main {
    gap: 20px;
    padding: 18px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .status-card,
  .asset-row,
  .section-heading {
    grid-template-columns: 1fr;
  }

  .action {
    width: 100%;
  }

  .status-card {
    min-height: auto;
  }

  .data-card {
    padding: 18px;
  }

  .section-heading {
    display: grid;
  }

  .ghost-action {
    width: fit-content;
  }

  .section-heading span {
    white-space: normal;
  }
}

@media (max-width: 420px) {
  .hero-label,
  .account-banner,
  .asset-row,
  .asset-empty {
    border-radius: 16px;
  }

  .quick-start-card,
  .status-card,
  .data-card {
    padding: 16px;
  }

  .ghost-action {
    width: 100%;
  }
}
</style>
