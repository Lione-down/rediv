<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  darkTheme,
} from 'naive-ui'
import { onMounted } from 'vue'
import { naiveDarkTheme } from './assets/styles/naive-theme'
import { useAuthStore } from './store/auth'

const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.token || authStore.user) {
    return
  }

  try {
    await authStore.loadCurrentUser()
  } catch {
    // 401 会由请求层清理登录态，这里不额外打断首屏渲染。
  }
})
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="naiveDarkTheme">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider placement="top-right" :max="3">
            <router-view />
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
