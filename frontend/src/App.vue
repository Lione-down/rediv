<script setup lang="ts">
import { onMounted } from 'vue'
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
  <router-view />
</template>
