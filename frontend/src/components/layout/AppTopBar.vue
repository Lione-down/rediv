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
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-subtle);
  /* Keep translucent panel chrome; no exact alpha token in design-direction. */
  background: oklch(100% 0.004 92 / 0.82);
  backdrop-filter: blur(14px);
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
  width: var(--space-8);
  height: var(--space-8);
  place-items: center;
  border-radius: 10px;
  color: white;
  /* Keep the brand mark gradient; no matching design token is defined. */
  background: linear-gradient(135deg, var(--text-primary), oklch(36% 0.03 245));
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
  min-height: 38px;
  gap: 7px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-body);
  line-height: var(--line-height-body);
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
