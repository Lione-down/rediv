<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Activity, Database, Gauge, Ticket, Users } from '@lucide/vue'

const navItems = [
  { to: '/admin', label: '总览', icon: Gauge },
  { to: '/admin/users', label: '用户', icon: Users },
  { to: '/admin/invitations', label: '邀请码', icon: Ticket },
  { to: '/admin/quotas', label: '额度', icon: Activity },
  { to: '/admin/assets', label: '资产', icon: Database },
]
</script>

<template>
  <main class="admin-layout">
    <aside>
      <h1>Revid Admin</h1>
      <nav aria-label="Admin 导航">
        <RouterLink v-for="item in navItems" :key="item.to" class="focus-ring" :to="item.to">
          <component :is="item.icon" :size="17" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
    <section class="admin-content">
      <slot />
    </section>
  </main>
</template>

<style scoped lang="scss">
.admin-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--bg-app);
}

aside {
  border-right: 1px solid var(--border-subtle);
  padding: 22px;
  background: var(--bg-panel);
}

h1 {
  margin: 0 0 24px;
  font-size: 20px;
}

nav {
  display: grid;
  gap: 6px;
}

a {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 9px;
  border-radius: var(--radius-md);
  padding: 0 12px;
  color: var(--text-secondary);
}

a:hover,
a.router-link-active {
  color: var(--text-primary);
  background: var(--bg-panel-subtle);
}

.admin-content {
  padding: 26px;
}

@media (max-width: 760px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  aside {
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }
}
</style>
