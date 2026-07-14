<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Shield, UserRound, Workflow } from 'lucide-vue-next'
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
  min-height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-subtle);
  /* Keep translucent panel chrome; no exact alpha token in design-direction. */
  background: var(--v2-surface-1);
}

.brand,
.top-actions,
.nav-link {
  display: flex;
  align-items: center;
}

.brand {
  gap: 10px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  width: var(--v2-control-min-size);
  height: var(--v2-control-min-size);
  place-items: center;
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-on-accent);
  background: var(--v2-accent);
  font-weight: 700;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  line-height: 1.1;
}

.brand small {
  color: var(--text-muted);
  font-size: var(--font-size-hint);
  line-height: var(--line-height-hint);
}

.top-actions {
  gap: var(--space-2);
  flex-shrink: 0;
}

.nav-link {
  min-height: var(--v2-control-min-size);
  gap: 7px;
  padding: 0 var(--space-3);
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-secondary);
  font-size: var(--v2-font-size-body);
  font-weight: var(--v2-font-weight-medium);
  line-height: var(--v2-line-height-body);
  transition:
    color 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease,
    transform 120ms ease;
}

.nav-link:active {
  transform: scale(0.96);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--v2-text-primary);
  border-color: var(--v2-accent);
  background: var(--v2-accent-soft);
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

@media (max-width: 560px) {
  .top-bar {
    padding: 0 10px;
    gap: var(--space-2);
  }

  .brand {
    gap: var(--space-2);
  }

  .brand strong {
    font-size: 14px;
  }

  .top-actions {
    gap: var(--space-1);
  }

  .nav-link {
    min-height: 34px;
    padding: 0 var(--space-2);
  }
}

@media (max-width: 420px) {
  .brand strong {
    display: none;
  }

  .nav-link {
    padding: 0 7px;
  }
}
</style>
