<script setup lang="ts">
import type { DropdownDividerOption, DropdownGroupOption, DropdownOption } from 'naive-ui'
import { NDropdown, NIcon } from 'naive-ui'
import { ChevronDown, LoaderCircle, LogOut, UserRound } from 'lucide-vue-next'
import type { Component } from 'vue'
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'

const props = withDefaults(defineProps<{
  compact?: boolean
  displayName?: string
  fullWidth?: boolean
}>(), {
  compact: false,
  displayName: '',
  fullWidth: false,
})

const router = useRouter()
const authStore = useAuthStore()
const isMenuOpen = ref(false)
const accountName = computed(() => (
  props.displayName ||
  authStore.user?.nickname ||
  authStore.user?.username ||
  '账户'
))

function renderIcon(icon: Component, className = '') {
  return () => h(
    NIcon,
    { class: className || undefined },
    { default: () => h(icon, { size: 17, 'aria-hidden': 'true' }) },
  )
}

const menuOptions = computed<Array<DropdownOption | DropdownDividerOption>>(() => [
  {
    key: 'space',
    label: '个人空间',
    icon: renderIcon(UserRound),
  },
  {
    key: 'session-divider',
    type: 'divider',
  },
  {
    key: 'logout',
    label: () => h(
      'span',
      { class: 'account-session-menu__danger-label' },
      authStore.isLoggingOut ? '正在退出…' : '退出登录',
    ),
    icon: renderIcon(LogOut, 'account-session-menu__danger-icon'),
    disabled: authStore.isLoggingOut,
  },
])

function resolveMenuProps() {
  return {
    role: 'menu',
    'aria-label': `${accountName.value} 账户操作`,
  }
}

function resolveNodeProps(option: DropdownOption | DropdownGroupOption) {
  const isLogout = option.key === 'logout'
  return {
    role: 'menuitem',
    'aria-label': isLogout ? '退出登录' : '个人空间',
    'aria-disabled': option.disabled ? ('true' as const) : undefined,
  }
}

async function handleSelect(key: string | number) {
  isMenuOpen.value = false
  if (key === 'space') {
    await router.push({ name: 'space' })
    return
  }

  if (key !== 'logout' || authStore.isLoggingOut) {
    return
  }

  const logoutRequest = authStore.logout()
  await router.replace({ name: 'login' })
  await logoutRequest
}
</script>

<template>
  <NDropdown
    v-model:show="isMenuOpen"
    trigger="click"
    placement="bottom-end"
    :options="menuOptions"
    :menu-props="resolveMenuProps"
    :node-props="resolveNodeProps"
    @select="handleSelect"
  >
    <button
      class="account-session-trigger"
      :class="{
        'is-compact': compact,
        'is-full-width': fullWidth,
        'is-loading': authStore.isLoggingOut,
      }"
      type="button"
      :aria-label="`打开 ${accountName} 账户菜单`"
      :aria-expanded="isMenuOpen"
      aria-haspopup="menu"
      :disabled="authStore.isLoggingOut"
      :title="accountName"
    >
      <LoaderCircle
        v-if="authStore.isLoggingOut"
        class="account-session-trigger__spinner"
        :size="17"
        aria-hidden="true"
      />
      <UserRound v-else :size="17" aria-hidden="true" />
      <span class="account-session-trigger__name">{{ accountName }}</span>
      <ChevronDown class="account-session-trigger__chevron" :size="15" aria-hidden="true" />
    </button>
  </NDropdown>
</template>

<style scoped lang="scss">
.account-session-trigger {
  display: inline-flex;
  min-width: 0;
  min-height: var(--v2-control-min-size);
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-sm);
  color: var(--v2-text-secondary);
  background: var(--v2-surface-1);
  box-shadow: var(--v2-shadow-floating);
  font: inherit;
  font-size: var(--v2-font-size-body);
  font-weight: var(--v2-font-weight-medium);
  line-height: var(--v2-line-height-body);
  cursor: pointer;
  touch-action: manipulation;
  transition:
    color var(--v2-duration-fast) var(--v2-ease-standard),
    background-color var(--v2-duration-fast) var(--v2-ease-standard),
    border-color var(--v2-duration-fast) var(--v2-ease-standard),
    transform var(--v2-duration-fast) var(--v2-ease-standard);
}

.account-session-trigger.is-full-width {
  width: 100%;
  justify-content: flex-start;
}

.account-session-trigger.is-compact {
  width: var(--v2-control-min-size);
  padding: 0;
}

.account-session-trigger:active {
  transform: scale(var(--v2-press-scale));
}

.account-session-trigger:focus-visible {
  outline: 2px solid var(--v2-focus-ring);
  outline-offset: 2px;
}

.account-session-trigger:disabled {
  cursor: wait;
  opacity: 0.72;
}

.account-session-trigger__name {
  max-width: 18ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-session-trigger__chevron {
  flex: 0 0 auto;
  color: var(--v2-text-muted);
}

.account-session-trigger.is-full-width .account-session-trigger__chevron {
  margin-left: auto;
}

.account-session-trigger.is-compact .account-session-trigger__name,
.account-session-trigger.is-compact .account-session-trigger__chevron {
  display: none;
}

.account-session-trigger__spinner {
  animation: account-session-spin 900ms linear infinite;
}

:global(.account-session-menu__danger-label),
:global(.account-session-menu__danger-icon) {
  color: var(--v2-danger);
}

@keyframes account-session-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (hover: hover) {
  .account-session-trigger:hover {
    color: var(--v2-text-primary);
    border-color: var(--v2-accent);
    background: var(--v2-accent-soft);
  }
}

@media (max-width: 560px) {
  .account-session-trigger:not(.is-full-width) {
    width: var(--v2-control-min-size);
    padding: 0;
  }

  .account-session-trigger:not(.is-full-width) .account-session-trigger__name,
  .account-session-trigger:not(.is-full-width) .account-session-trigger__chevron {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .account-session-trigger {
    transition: none;
  }

  .account-session-trigger:active {
    transform: none;
  }

  .account-session-trigger__spinner {
    animation: none;
  }
}
</style>
