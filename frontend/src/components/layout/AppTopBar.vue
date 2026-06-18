<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Shield, UserRound, Workflow } from '@lucide/vue'
import { useAuthStore } from '../../store/auth'

const authStore = useAuthStore()
</script>

<template>
  <header class="top-bar">
    <RouterLink class="brand focus-ring" to="/" aria-label="返回 Revid 首页">
      <span class="brand-mark">R</span>
      <span>
        <strong>Revid</strong>
        <small>AI 创作工作台</small>
      </span>
    </RouterLink>

    <nav class="top-actions" aria-label="主导航">
      <RouterLink class="nav-link focus-ring" to="/app/workspace">
        <Workflow :size="17" />
        工作流
      </RouterLink>
      <RouterLink class="nav-link focus-ring" to="/app/space">
        <UserRound :size="17" />
        个人空间
      </RouterLink>
      <RouterLink v-if="authStore.isAdmin" class="nav-link focus-ring" to="/admin">
        <Shield :size="17" />
        Admin
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped lang="scss">
.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 22px;
  border-bottom: 1px solid var(--border-subtle);
  background: oklch(100% 0.004 92 / 0.86);
  backdrop-filter: blur(18px);
}

.brand,
.top-actions,
.nav-link {
  display: flex;
  align-items: center;
}

.brand {
  gap: 10px;
}

.brand-mark {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 10px;
  color: white;
  background: var(--text-primary);
  font-weight: 700;
}

.brand strong,
.brand small {
  display: block;
}

.brand small {
  color: var(--text-muted);
  font-size: 12px;
}

.top-actions {
  gap: 8px;
}

.nav-link {
  min-height: 40px;
  gap: 7px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-panel-subtle);
}

@media (max-width: 720px) {
  .top-bar {
    padding: 0 14px;
  }

  .brand small {
    display: none;
  }

  .nav-link {
    padding: 0 9px;
    font-size: 0;
  }
}
</style>
