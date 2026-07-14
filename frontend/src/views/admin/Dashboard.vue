<script setup lang="ts">
import { computed } from 'vue'
import { Activity, Clock3, Database, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-vue-next'
import AdminLayout from './AdminLayout.vue'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'

const authStore = useAuthStore()
const assetStore = useAssetStore()

const metrics = computed(() => [
  {
    label: '注册用户数',
    value: authStore.user ? '1' : '0',
    hint: '当前基于 mock admin 账户，后续替换为真实统计接口。',
    tone: 'blue',
    icon: Users,
  },
  {
    label: '今日任务数',
    value: '12',
    hint: '覆盖文本、图片和视频请求的当日总量。',
    tone: 'green',
    icon: Sparkles,
  },
  {
    label: '排队任务数',
    value: '3',
    hint: '当前等待执行或轮询完成的生成任务。',
    tone: 'amber',
    icon: Workflow,
  },
  {
    label: '系统状态',
    value: 'Healthy',
    hint: '登录、额度和资产模块都处于可继续联调状态。',
    tone: 'neutral',
    icon: ShieldCheck,
  },
])

const adminSummary = computed(() => ({
  nickname: authStore.user?.nickname ?? 'Admin Operator',
  role: authStore.user?.role === 'admin' ? '管理员' : '观察账号',
  lastLogin: authStore.user?.last_login_at
    ? new Date(authStore.user.last_login_at).toLocaleString('zh-CN')
    : '待接入真实登录时间',
}))

const quickSignals = computed(() => [
  {
    label: '资产沉淀',
    value: `${assetStore.items.length} 项`,
    meta: '当前来自本地 store mock 数据',
    icon: Database,
  },
  {
    label: '额度库存',
    value: `${authStore.quotas.text}/${authStore.quotas.image}/${authStore.quotas.video}`,
    meta: '文本 / 图片 / 视频余额',
    icon: Activity,
  },
  {
    label: '最近更新',
    value: 'T2-004',
    meta: '后台页面迁移进行中',
    icon: Clock3,
  },
])
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="page-hero card-shell">
        <div class="hero-copy">
          <span class="eyebrow">平台总览</span>
          <h2>把注册、额度、任务和资产状态压缩到一个可快速判断的平台视图里。</h2>
          <p>
            当前先用 mock 指标建立管理台结构，后续联调时可直接替换为真实 Dashboard 查询。
          </p>
        </div>

        <div class="hero-panel">
          <span class="panel-label">当前值班</span>
          <strong>{{ adminSummary.nickname }}</strong>
          <p>{{ adminSummary.role }} · 最近登录 {{ adminSummary.lastLogin }}</p>
        </div>
      </header>

      <section class="metric-grid" aria-label="关键指标">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card card-shell" :data-tone="metric.tone">
          <div class="metric-head">
            <span class="metric-icon">
              <component :is="metric.icon" :size="18" />
            </span>
            <span class="metric-label">{{ metric.label }}</span>
          </div>
          <strong>{{ metric.value }}</strong>
          <p>{{ metric.hint }}</p>
        </article>
      </section>

      <section class="signal-grid">
        <article v-for="item in quickSignals" :key="item.label" class="signal-card card-shell">
          <span class="signal-icon">
            <component :is="item.icon" :size="18" />
          </span>
          <div>
            <span class="signal-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.meta }}</p>
          </div>
        </article>
      </section>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-page {
  display: grid;
  gap: 18px;
  animation: page-enter 420ms ease both;
}

.card-shell {
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  background: var(--v2-surface-1);
  box-shadow: none;
}

.page-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  gap: 16px;
  padding: 20px;
}

.hero-copy,
.hero-panel {
  border-radius: 20px;
  padding: 22px;
}

.hero-copy {
  background: var(--v2-surface-1);
  border: 1px solid var(--v2-border-subtle);
}

.hero-panel {
  display: grid;
  align-content: start;
  gap: 8px;
  background: var(--bg-panel);
}

.eyebrow,
.panel-label {
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12px;
}

.eyebrow {
  color: var(--accent-generate-hover);
  background: var(--v2-accent-soft);
}

.panel-label {
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
}

.hero-copy h2,
.hero-panel strong,
.metric-card strong,
.signal-card strong {
  margin: 0;
  color: var(--text-primary);
}

.hero-copy h2 {
  margin-top: 14px;
  max-width: 16ch;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.08;
  letter-spacing: -0.02em;
}

.hero-copy p,
.hero-panel p,
.metric-card p,
.signal-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.metric-grid,
.signal-grid {
  display: grid;
  gap: 14px;
}

.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card,
.signal-card {
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.metric-card {
  display: grid;
  gap: 14px;
  min-height: 190px;
  padding: 18px;
}

.metric-card:hover,
.signal-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}

.metric-head,
.signal-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.metric-icon,
.signal-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.metric-card[data-tone='green'] .metric-icon {
  color: var(--accent-generate-hover);
  background: color-mix(in oklab, var(--v2-success) 14%, var(--v2-surface-1));
}

.metric-card[data-tone='blue'] .metric-icon {
  color: var(--accent-select);
  background: var(--v2-accent-soft);
}

.metric-card[data-tone='amber'] .metric-icon {
  color: var(--v2-warning);
  background: color-mix(in oklab, var(--v2-warning) 14%, var(--v2-surface-1));
}

.metric-card[data-tone='neutral'] .metric-icon,
.signal-icon {
  color: var(--text-primary);
  background: var(--bg-panel-subtle);
}

.metric-label,
.signal-label {
  color: var(--text-muted);
  font-size: 13px;
}

.metric-card strong {
  font-size: 32px;
  line-height: 1;
}

.signal-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.signal-card {
  padding: 18px;
  border-radius: 20px;
}

.signal-card strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
}

@media (max-width: 1040px) {
  .page-hero,
  .metric-grid,
  .signal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .metric-grid,
  .signal-grid {
    grid-template-columns: 1fr;
  }

  .page-hero {
    padding: 14px;
  }

  .hero-copy,
  .hero-panel {
    padding: 18px;
  }

  .hero-copy h2 {
    max-width: none;
    font-size: clamp(24px, 8vw, 32px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-page {
    animation: none;
  }

  .metric-card,
  .signal-card {
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
</style>
