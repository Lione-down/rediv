<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Activity, Database, Gauge, ShieldCheck, Ticket, Users, Workflow } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  {
    to: '/admin',
    label: '总览',
    description: '平台状态与关键指标',
    icon: Gauge,
    match: (path: string) => path === '/admin',
  },
  {
    to: '/admin/users',
    label: '用户',
    description: '账号状态与权限管理',
    icon: Users,
    match: (path: string) => path.startsWith('/admin/users'),
  },
  {
    to: '/admin/invitations',
    label: '邀请码',
    description: '注册准入与发放节奏',
    icon: Ticket,
    match: (path: string) => path.startsWith('/admin/invitations'),
  },
  {
    to: '/admin/quotas',
    label: '额度',
    description: '文本 图片 视频配额',
    icon: Activity,
    match: (path: string) => path.startsWith('/admin/quotas'),
  },
  {
    to: '/admin/assets',
    label: '资产',
    description: '上传 生成 归档状态',
    icon: Database,
    match: (path: string) => path.startsWith('/admin/assets'),
  },
  {
    to: '/admin/tasks',
    label: '任务',
    description: '生成队列与执行监控',
    icon: Workflow,
    match: (path: string) => path.startsWith('/admin/tasks'),
  },
]

const activeLabel = computed(() => navItems.find((item) => item.match(route.path))?.label ?? '总览')
</script>

<template>
  <main class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-head">
        <span class="eyebrow">
          <ShieldCheck :size="14" />
          Admin Console
        </span>
        <div>
          <h1>Revid Admin</h1>
          <p>内部平台控制台，优先处理注册、额度、资产和任务状态。</p>
        </div>
      </div>

      <nav class="admin-nav" aria-label="Admin 导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="nav-link focus-ring"
          :class="{ active: item.match(route.path) }"
          :to="item.to"
        >
          <span class="nav-icon">
            <component :is="item.icon" :size="18" />
          </span>
          <span class="nav-copy">
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </span>
        </RouterLink>
      </nav>

      <section class="sidebar-note" aria-label="当前上下文">
        <span class="note-label">当前模块</span>
        <strong>{{ activeLabel }}</strong>
        <p>本轮以深色工作台承接 Admin 信息密度，保持状态优先而不回退到普通后台列表页。</p>
      </section>
    </aside>

    <section class="admin-content">
      <slot />
    </section>
  </main>
</template>

<style scoped lang="scss">
.admin-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--v2-app);
}

.admin-sidebar {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 24px 18px;
  border-right: 1px solid var(--border-subtle);
  background: var(--v2-surface-1);
}

.sidebar-head {
  display: grid;
  gap: 14px;
  padding: 6px 6px 0;
}

.eyebrow,
.note-label {
  display: inline-flex;
  width: fit-content;
  min-height: 28px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
}

.eyebrow {
  color: var(--v2-accent-hover);
  background: var(--v2-accent-soft);
}

.sidebar-head h1,
.sidebar-note strong {
  margin: 0;
  color: var(--text-primary);
}

.sidebar-head h1 {
  font-size: 24px;
  line-height: 1.15;
}

.sidebar-head p,
.sidebar-note p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.admin-nav {
  display: grid;
  gap: 8px;
}

.nav-link,
.sidebar-note {
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  background: var(--v2-surface-2);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.nav-link {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 72px;
  padding: 12px;
  color: var(--text-secondary);
}

.nav-link:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.nav-link:active {
  transform: scale(0.96);
}

.nav-link.active {
  color: var(--text-primary);
  border-color: var(--v2-accent);
  background: var(--v2-surface-1);
  box-shadow: 0 16px 32px color-mix(in oklab, var(--v2-accent) 10%, transparent);
}

.nav-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: var(--bg-panel-subtle);
}

.nav-link.active .nav-icon {
  color: var(--accent-select);
  background: var(--v2-accent-soft);
}

.nav-copy {
  display: grid;
  gap: 2px;
}

.nav-copy strong {
  font-size: 14px;
  line-height: 1.3;
}

.nav-copy span {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.sidebar-note {
  padding: 16px;
}

.note-label {
  color: var(--text-secondary);
  background: var(--bg-panel-subtle);
}

.admin-content {
  padding: 28px;
}

@media (max-width: 760px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-sidebar {
    gap: 14px;
    padding: 16px 12px;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .admin-nav {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .nav-link {
    flex: 0 0 220px;
  }

  .sidebar-note {
    display: none;
  }

  .admin-content {
    padding: 18px 12px 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .sidebar-note {
    transition: none;
  }
}

/* Page-level V2 bridge for the existing admin data views. */
:deep(.admin-page) {
  color: var(--v2-text-primary);
}

:deep(.admin-page .page-head),
:deep(.admin-page .page-hero),
:deep(.admin-page .hero-copy),
:deep(.admin-page .hero-panel),
:deep(.admin-page .card-shell),
:deep(.admin-page .table-card),
:deep(.admin-page .summary-card),
:deep(.admin-page .stats-card),
:deep(.admin-page .signal-card),
:deep(.admin-page .tip-card),
:deep(.admin-page .invite-card),
:deep(.admin-page .dispatch-card) {
  border-color: var(--v2-border-subtle) !important;
  background: var(--v2-surface-1) !important;
  box-shadow: none !important;
}

:deep(.admin-page .metric-card),
:deep(.admin-page .summary-card),
:deep(.admin-page .stats-card),
:deep(.admin-page .invite-card),
:deep(.admin-page .dispatch-card) {
  border-radius: var(--v2-radius-md);
}

:deep(.admin-page .eyebrow),
:deep(.admin-page .panel-label),
:deep(.admin-page .meta-chip),
:deep(.admin-page .status-pill),
:deep(.admin-page .ghost-action) {
  border-color: var(--v2-border-standard);
  color: var(--v2-accent-hover);
  background: var(--v2-accent-soft);
}

:deep(.admin-page .metric-icon),
:deep(.admin-page .signal-icon),
:deep(.admin-page .summary-icon),
:deep(.admin-page .stats-icon),
:deep(.admin-page .tip-icon),
:deep(.admin-page .ticket-icon),
:deep(.admin-page .action-icon),
:deep(.admin-page .note-icon) {
  color: var(--v2-accent);
  background: var(--v2-accent-soft);
}

:deep(.admin-page .action-row),
:deep(.admin-page .table-wrap),
:deep(.admin-page tr),
:deep(.admin-page .stock-note) {
  border-color: var(--v2-border-subtle);
  background: var(--v2-surface-2);
}

:deep(.admin-page .action-row:hover),
:deep(.admin-page .ghost-action:hover) {
  border-color: var(--v2-border-strong);
  background: var(--v2-surface-3);
}

:deep(.admin-page .status-pill[data-status*='失败']),
:deep(.admin-page .status-pill[data-status*='禁用']) {
  color: var(--v2-danger);
}

@media (max-width: 760px) {
  :deep(.admin-page .page-head),
  :deep(.admin-page .page-hero) {
    padding: var(--space-4);
  }
}
</style>
