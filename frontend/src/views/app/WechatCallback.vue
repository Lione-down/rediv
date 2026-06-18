<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.loginWithMockWechat()
  router.replace('/app/workspace')
})
</script>

<template>
  <main class="callback-page">
    <p>正在完成微信登录...</p>
  </main>
</template>

<style scoped>
.callback-page {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  color: var(--text-secondary);
}
</style>
