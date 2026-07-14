<script setup lang="ts">
import { FolderPlus, LogIn, RefreshCcw, Shield, UserRound } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps<{
  isLoggedIn: boolean
  isAdmin: boolean
  isRefreshing: boolean
  nickname?: string
}>()

const emit = defineEmits<{
  create: []
  refresh: []
}>()
</script>

<template>
  <header class="route-header">
    <RouterLink class="brand focus-ring" to="/" aria-label="返回 Revid 首页">
      <span class="brand__mark">R</span>
      <span class="brand__copy">
        <strong>Revid</strong>
        <small>项目工作台</small>
      </span>
    </RouterLink>

    <div v-if="isLoggedIn" class="route-actions">
      <RouterLink class="account-label focus-ring" to="/app/space" aria-label="打开个人空间">
        <UserRound :size="16" />
        <span>{{ nickname || 'Creator' }}</span>
      </RouterLink>
      <RouterLink
        v-if="isAdmin"
        class="header-action focus-ring"
        to="/admin"
        aria-label="打开 Admin"
      >
        <Shield :size="16" />
        <span>Admin</span>
      </RouterLink>
      <button
        class="header-action focus-ring"
        type="button"
        aria-label="刷新项目和最近资产"
        :disabled="isRefreshing"
        @click="emit('refresh')"
      >
        <RefreshCcw :size="16" :class="{ 'is-spinning': isRefreshing }" />
        <span>刷新数据</span>
      </button>
      <button
        class="header-action is-primary focus-ring"
        type="button"
        aria-label="新建项目"
        @click="emit('create')"
      >
        <FolderPlus :size="16" />
        <span>新建项目</span>
      </button>
    </div>

    <RouterLink v-else class="header-action is-primary focus-ring" to="/login?redirect=/">
      <LogIn :size="16" />
      登录工作台
    </RouterLink>
  </header>
</template>

<style scoped lang="scss">
.route-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  min-height: 60px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--v2-surface-1);
  box-shadow: none;
}

.brand,
.route-actions,
.account-label,
.header-action {
  display: inline-flex;
  align-items: center;
}

.brand {
  min-width: 0;
  gap: 10px;
}

.brand__mark {
  display: grid;
  width: var(--space-8);
  height: var(--space-8);
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  color: var(--v2-text-on-accent);
  background: var(--v2-accent);
  font-weight: 700;
}

.brand__copy strong,
.brand__copy small {
  display: block;
}

.brand__copy strong {
  line-height: 1.1;
}

.brand__copy small {
  color: var(--text-muted);
  font-size: var(--font-size-hint);
}

.route-actions {
  gap: var(--space-2);
}

.account-label,
.header-action {
  min-height: 40px;
  gap: 7px;
  border-radius: var(--radius-lg);
  padding: 0 var(--space-3);
  font-size: var(--font-size-body);
}

.account-label {
  color: var(--text-secondary);
}

.header-action {
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  background: var(--bg-panel);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    border-color 120ms ease,
    transform 120ms ease;
}

.header-action:active {
  transform: scale(0.96);
}

.header-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.header-action.is-primary {
  color: var(--text-primary);
  border-color: transparent;
  background: var(--accent-generate);
  box-shadow: var(--shadow-accent);
}

.is-spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (hover: hover) {
  .account-label:hover {
    background: var(--bg-panel-subtle);
  }

  .header-action:hover {
    background: var(--bg-panel-subtle);
  }

  .header-action.is-primary:hover {
    background: var(--v2-accent-hover);
  }
}

@media (max-width: 640px) {
  .route-header {
    padding-inline: 10px;
  }

  .brand__copy small,
  .account-label span,
  .header-action span {
    display: none;
  }

  .account-label,
  .header-action {
    width: 40px;
    padding: 0;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-action {
    transition: none;
  }

  .header-action:active {
    transform: none;
  }

  .is-spinning {
    animation: none;
  }
}
</style>
