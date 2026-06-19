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
        <p>本轮以浅色工作台风格承接 Admin 信息密度，避免回退到普通后台列表页。</p>
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
  background:
    radial-gradient(circle at top left, oklch(98% 0.014 98), transparent 24%),
    linear-gradient(180deg, oklch(97% 0.005 92), var(--bg-app) 28%);
}

.admin-sidebar {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 24px 18px;
  border-right: 1px solid var(--border-subtle);
  background: oklch(100% 0.004 92 / 0.86);
  backdrop-filter: blur(8px);
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
  color: var(--accent-generate-hover);
  background: oklch(96% 0.022 175);
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
  background: var(--bg-panel);
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
  border-color: oklch(83% 0.04 252);
  background: oklch(96% 0.02 252);
  box-shadow: 0 16px 32px oklch(38% 0.03 252 / 0.08);
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
  background: oklch(94% 0.03 252);
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
</style>
