<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  BellRing,
  Clapperboard,
  Clock3,
  FolderOpen,
  HardDrive,
  History,
  Image as ImageIcon,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  Video,
  Workflow,
} from 'lucide-vue-next'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'

type SpaceTab = 'profile' | 'assets' | 'history' | 'results'

const authStore = useAuthStore()
const assetStore = useAssetStore()

const activeTab = ref<SpaceTab>('profile')

const tabOptions: Array<{
  key: SpaceTab
  label: string
  description: string
  icon: unknown
}> = [
  {
    key: 'profile',
    label: '个人中心',
    description: '账号、订阅、通知和基础设置。',
    icon: UserRound,
  },
  {
    key: 'assets',
    label: '个人资产',
    description: '素材库、结果资产和空间占用。',
    icon: FolderOpen,
  },
  {
    key: 'history',
    label: '历史记录',
    description: '回看最近一次创作链路和版本。',
    icon: History,
  },
  {
    key: 'results',
    label: '结果页',
    description: '集中处理结果预览、导出和回链。',
    icon: Clapperboard,
  },
]

const heroStats = computed(() => [
  {
    key: 'text',
    label: '文本额度',
    value: authStore.quotas.text,
    hint: '用于脚本、分镜和 prompt 拆解',
    icon: Ticket,
  },
  {
    key: 'image',
    label: '图片额度',
    value: authStore.quotas.image,
    hint: '用于参考图、首帧和风格图生成',
    icon: ImageIcon,
  },
  {
    key: 'video',
    label: '视频额度',
    value: authStore.quotas.video,
    hint: '用于片段生成、扩写和结果导出',
    icon: Video,
  },
])

const managementStrip = computed(() => {
  const assetCount = assetStore.items.length
  const resultCount = assetStore.items.filter((asset) => asset.source === 'generation').length
  return [
    { label: '最近结果', value: String(resultCount || 0) },
    { label: '资产空间', value: `${Math.max(assetCount, 1) * 1.2} GB` },
    { label: '已拆分模块', value: String(tabOptions.length) },
  ]
})

const profileOverview = computed(() => [
  {
    title: '账号概览',
    body: authStore.user
      ? `${authStore.user.nickname} · ${authStore.user.role === 'admin' ? 'Admin' : '创作账号'}`
      : '当前为未加载账号状态，后续联调后会接入真实个人信息。',
    icon: ShieldCheck,
  },
  {
    title: '订阅与通知',
    body: '把生成提醒、额度变更和结果到达提示集中管理，避免打断工作流。',
    icon: BellRing,
  },
  {
    title: '基础设置',
    body: '预留主题、默认工作区、导出偏好和安全设置入口，先只承接骨架。',
    icon: Settings2,
  },
])

const assetPanels = computed(() => [
  {
    title: '素材库',
    body: assetStore.items.length
      ? `当前已沉淀 ${assetStore.items.length} 项素材，可继续接筛选和搜索。`
      : '暂时没有真实素材，后续联调后会从个人资产接口加载。',
    icon: FolderOpen,
  },
  {
    title: '结果资产',
    body: '生成结果会继续归档成可复用资产，便于回拖到工作流里继续编辑。',
    icon: Sparkles,
  },
  {
    title: '空间用量',
    body: `${Math.max(assetStore.items.length, 1) * 1.2} GB / 12 GB，当前以 mock 占用表达容量感。`,
    icon: HardDrive,
  },
])

const historyItems = computed(() => [
  {
    title: '雨夜旧车站 · 最近一次编辑',
    meta: '2 小时前 · 可直接回到工作流继续编排镜头。',
    status: '可恢复',
  },
  {
    title: '角色设定实验 · 旧版本',
    meta: '昨天 · 保留历史分支和生成结果记录。',
    status: '已保存',
  },
  {
    title: '首帧图试验 · 单次输出',
    meta: '3 天前 · 可重新打开对应工作流链路。',
    status: '完成',
  },
])

const resultPanels = computed(() => [
  {
    title: '结果封面',
    body: '先保留封面和结果状态摘要，后续再接真实媒体预览。',
    icon: Clapperboard,
  },
  {
    title: '操作位',
    body: '支持复制、下载、加入资产库和重新推回工作流，当前先留结构。',
    icon: ArrowRight,
  },
  {
    title: '回链工作流',
    body: '从结果页回到工作流时直接承接历史链路，减少重复搭建。',
    icon: Workflow,
  },
])

const resultPreview = computed(() => assetStore.items.find((asset) => asset.type !== 'prompt') ?? assetStore.items[0])

function setActiveTab(tab: SpaceTab) {
  activeTab.value = tab
}
</script>

<template>
  <main class="space-page">
    <AppTopBar />

    <section class="space-wrap">
      <header class="space-hero section-card">
        <div class="hero-main">
          <div class="hero-kicker">管理总览</div>
          <h1>把账号、资产和结果集中到一个不打断工作流的管理台里。</h1>
          <p>
            这里优先负责看状态、回历史、管资产，再决定什么时候回到工作流继续创作。
          </p>

          <div class="hero-actions">
            <button class="hero-action primary focus-ring" type="button" @click="setActiveTab('assets')">
              查看个人资产
            </button>
            <RouterLink class="hero-action focus-ring" to="/app/workspace">
              继续工作流
            </RouterLink>
          </div>

          <div class="hero-meta">
            <span class="meta-pill">
              <UserRound :size="14" />
              {{ authStore.user?.nickname || '创作账号' }}
            </span>
            <span class="meta-pill">
              <Clock3 :size="14" />
              最近活跃 2 小时前
            </span>
          </div>
        </div>

        <div class="hero-stats" aria-label="额度统计">
          <article v-for="stat in heroStats" :key="stat.key" class="stat-card">
            <div class="stat-copy">
              <span class="stat-label">
                <component :is="stat.icon" :size="15" />
                {{ stat.label }}
              </span>
              <strong>{{ stat.value }}</strong>
              <p>{{ stat.hint }}</p>
            </div>
            <span class="stat-badge">可用</span>
          </article>
        </div>
      </header>

      <section class="nav-section section-card">
        <div class="section-head">
          <div>
            <h2>内容入口</h2>
            <span>先按管理任务拆入口，再分别进入资产、历史和结果的独立内容区。</span>
          </div>
        </div>

        <div class="management-strip" aria-label="管理总览">
          <span v-for="item in managementStrip" :key="item.label" class="management-chip">
            <strong>{{ item.value }}</strong>
            {{ item.label }}
          </span>
        </div>

        <div class="nav-grid">
          <button
            v-for="tab in tabOptions"
            :key="tab.key"
            class="nav-card focus-ring"
            :class="{ active: activeTab === tab.key }"
            type="button"
            @click="setActiveTab(tab.key)"
          >
            <span class="nav-icon">
              <component :is="tab.icon" :size="18" />
            </span>
            <strong>{{ tab.label }}</strong>
            <p>{{ tab.description }}</p>
            <span class="nav-linkish">
              进入模块
              <ArrowRight :size="15" />
            </span>
          </button>
        </div>
      </section>

      <section class="space-panel section-card">
        <div class="section-head">
          <div>
            <h2>个人空间</h2>
            <span>先切到目标模块，再决定是查看状态、回看历史，还是继续推回工作流。</span>
          </div>
        </div>

        <div class="section-switcher" role="tablist" aria-label="个人空间切换">
          <button
            v-for="tab in tabOptions"
            :key="tab.key"
            class="section-chip focus-ring"
            :class="{ active: activeTab === tab.key }"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            @click="setActiveTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="subpages">
          <article
            class="subpage"
            :class="{ active: activeTab === 'profile' }"
            :aria-hidden="activeTab !== 'profile'"
          >
            <div class="subpage-grid">
              <article v-for="item in profileOverview" :key="item.title" class="content-card">
                <span class="content-icon">
                  <component :is="item.icon" :size="18" />
                </span>
                <strong>{{ item.title }}</strong>
                <p>{{ item.body }}</p>
              </article>
            </div>
          </article>

          <article
            class="subpage"
            :class="{ active: activeTab === 'assets' }"
            :aria-hidden="activeTab !== 'assets'"
          >
            <div class="subpage-grid">
              <article v-for="item in assetPanels" :key="item.title" class="content-card">
                <span class="content-icon">
                  <component :is="item.icon" :size="18" />
                </span>
                <strong>{{ item.title }}</strong>
                <p>{{ item.body }}</p>
              </article>
            </div>

            <div class="asset-preview">
              <div class="asset-preview-head">
                <h3>最近资产</h3>
                <span>{{ assetStore.items.length }} 项</span>
              </div>
              <div class="asset-preview-list">
                <article v-for="asset in assetStore.items.slice(0, 3)" :key="asset.id" class="asset-item">
                  <div>
                    <strong>{{ asset.content_text || '未命名资产' }}</strong>
                    <p>{{ asset.source === 'generation' ? '生成资产' : '上传资产' }}</p>
                  </div>
                  <span class="item-pill">{{ asset.type }}</span>
                </article>
              </div>
            </div>
          </article>

          <article
            class="subpage"
            :class="{ active: activeTab === 'history' }"
            :aria-hidden="activeTab !== 'history'"
          >
            <div class="history-list">
              <article v-for="item in historyItems" :key="item.title" class="history-item">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.meta }}</p>
                </div>
                <span class="item-pill">{{ item.status }}</span>
              </article>
            </div>
          </article>

          <article
            class="subpage"
            :class="{ active: activeTab === 'results' }"
            :aria-hidden="activeTab !== 'results'"
          >
            <div class="result-hero">
              <div class="result-cover">
                <span class="cover-badge">最近结果</span>
                <strong>{{ resultPreview?.content_text || '结果预览占位' }}</strong>
                <p>结果页先承接封面、导出操作和回链入口，真实媒体联调放到后续任务。</p>
              </div>
              <div class="result-summary">
                <span class="meta-pill">
                  <Sparkles :size="14" />
                  已进入结果页骨架
                </span>
                <span class="meta-pill">
                  <Workflow :size="14" />
                  可回链工作流
                </span>
              </div>
            </div>

            <div class="subpage-grid">
              <article v-for="item in resultPanels" :key="item.title" class="content-card">
                <span class="content-icon">
                  <component :is="item.icon" :size="18" />
                </span>
                <strong>{{ item.title }}</strong>
                <p>{{ item.body }}</p>
              </article>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped lang="scss">
.space-page {
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, oklch(98% 0.012 98), transparent 28%),
    linear-gradient(180deg, oklch(97% 0.006 92), var(--bg-app) 30%);
}

.space-wrap {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 42px;
}

.section-card {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: oklch(100% 0.004 92 / 0.84);
  box-shadow: 0 22px 50px oklch(24% 0.016 245 / 0.06);
  animation: page-enter 420ms ease both;
}

.space-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 18px;
  padding: 18px;
}

.nav-section,
.space-panel {
  margin-top: 18px;
  padding: 22px;
}

.nav-section {
  animation-delay: 48ms;
}

.space-panel {
  animation-delay: 96ms;
}

.hero-main {
  display: grid;
  align-content: start;
  gap: 18px;
  min-height: 280px;
  padding: 28px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, oklch(94% 0.03 175 / 0.7), transparent 28%),
    linear-gradient(180deg, oklch(99% 0.006 92), oklch(97% 0.008 92));
  border: 1px solid oklch(90% 0.01 92);
}

.hero-kicker,
.meta-pill,
.management-chip,
.section-chip,
.item-pill,
.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  font-size: 12px;
}

.hero-kicker {
  min-height: 32px;
  width: fit-content;
  padding: 0 12px;
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
}

.hero-main h1 {
  max-width: 12ch;
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.hero-main p,
.nav-card p,
.content-card p,
.history-item p,
.result-cover p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.hero-actions,
.hero-meta,
.management-strip,
.section-switcher,
.result-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: var(--bg-panel-subtle);
  color: var(--text-primary);
  font-size: 14px;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.hero-action:hover,
.nav-card:hover,
.content-card:hover,
.asset-item:hover,
.history-item:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

.hero-action:active,
.nav-card:active,
.section-chip:active {
  transform: scale(0.96);
}

.hero-action.primary {
  color: white;
  background: var(--accent-generate);
}

.hero-action.primary:hover {
  background: var(--accent-generate-hover);
}

.meta-pill {
  min-height: 30px;
  padding: 0 11px;
  color: var(--text-secondary);
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
}

.hero-stats {
  display: grid;
  gap: 12px;
}

.stat-card,
.nav-card,
.content-card,
.asset-item,
.history-item,
.result-cover {
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-height: 112px;
  padding: 18px;
  border-radius: 20px;
}

.stat-copy {
  display: grid;
  gap: 8px;
}

.stat-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.stat-copy strong {
  color: var(--text-primary);
  font-size: 28px;
  line-height: 1;
}

.stat-copy p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.55;
}

.stat-badge {
  min-height: 28px;
  padding: 0 10px;
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
}

.section-head {
  margin-bottom: 16px;
}

.section-head h2,
.asset-preview-head h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  line-height: 1.25;
}

.section-head span,
.asset-preview-head span {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.management-strip {
  margin-bottom: 16px;
}

.management-chip,
.section-chip {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel-subtle);
  color: var(--text-secondary);
}

.management-chip strong {
  color: var(--text-primary);
  font-weight: 600;
}

.nav-grid,
.subpage-grid {
  display: grid;
  gap: 12px;
}

.nav-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.nav-card {
  display: grid;
  gap: 12px;
  min-height: 188px;
  padding: 18px;
  border-radius: 20px;
  text-align: left;
}

.nav-card.active,
.section-chip.active {
  border-color: oklch(78% 0.04 175);
  background: oklch(97% 0.014 175);
}

.nav-icon,
.content-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  color: var(--accent-select);
  background: oklch(95% 0.024 252);
}

.nav-card strong,
.content-card strong,
.history-item strong,
.result-cover strong {
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.4;
}

.nav-linkish {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  color: var(--text-secondary);
  font-size: 13px;
}

.section-switcher {
  margin-bottom: 14px;
}

.section-chip {
  border-radius: 999px;
  transition:
    color 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.subpages {
  position: relative;
}

.subpage {
  display: none;
}

.subpage.active {
  display: block;
}

.subpage.active .content-card,
.subpage.active .history-item,
.subpage.active .result-cover,
.subpage.active .asset-item {
  animation: panel-enter 320ms ease both;
}

.subpage.active .content-card:nth-child(2),
.subpage.active .history-item:nth-child(2),
.subpage.active .asset-item:nth-child(2) {
  animation-delay: 40ms;
}

.subpage.active .content-card:nth-child(3),
.subpage.active .history-item:nth-child(3),
.subpage.active .asset-item:nth-child(3) {
  animation-delay: 80ms;
}

.content-card {
  display: grid;
  gap: 12px;
  min-height: 168px;
  padding: 18px;
  border-radius: 18px;
}

.subpage-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.asset-preview {
  margin-top: 14px;
}

.asset-preview-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.asset-preview-list,
.history-list {
  display: grid;
  gap: 10px;
}

.asset-item,
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
}

.asset-item p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.item-pill {
  min-height: 30px;
  padding: 0 10px;
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.result-hero {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
}

.result-cover {
  display: grid;
  gap: 12px;
  min-height: 168px;
  padding: 22px;
  border-radius: 22px;
  background:
    linear-gradient(135deg, oklch(97% 0.024 175), oklch(99% 0.005 92)),
    var(--bg-panel);
}

.cover-badge {
  display: inline-flex;
  width: fit-content;
  min-height: 28px;
  align-items: center;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
  font-size: 12px;
}

@media (max-width: 1040px) {
  .space-hero,
  .subpage-grid {
    grid-template-columns: 1fr;
  }

  .nav-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .space-wrap {
    width: min(1120px, calc(100% - 24px));
    padding: 20px 0 28px;
  }

  .space-hero,
  .nav-section,
  .space-panel {
    padding: 14px;
  }

  .hero-main {
    min-height: auto;
    padding: 20px;
  }

  .hero-main h1 {
    max-width: none;
    font-size: clamp(28px, 9vw, 40px);
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-action {
    width: 100%;
  }

  .nav-grid {
    grid-template-columns: 1fr;
  }

  .section-switcher {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .section-chip {
    white-space: nowrap;
  }

  .asset-item,
  .history-item,
  .asset-preview-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .item-pill {
    align-self: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-card,
  .subpage.active .content-card,
  .subpage.active .history-item,
  .subpage.active .result-cover,
  .subpage.active .asset-item {
    animation: none;
  }

  .hero-action,
  .nav-card,
  .content-card,
  .asset-item,
  .history-item,
  .section-chip {
    transition: none;
  }
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes panel-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
